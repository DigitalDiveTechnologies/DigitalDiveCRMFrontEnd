import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import '../database/local_database.dart';

class SyncManager {
  final LocalDatabase db;
  final String baseUrl;
  final String tenantId;
  
  bool isOnline = true;
  bool isSyncing = false;

  SyncManager({
    required this.db,
    this.baseUrl = 'http://localhost:3000',
    this.tenantId = 'tenant-default',
  });

  // Save POS Tax Invoice offline first to Local Database Outbox
  Future<String> saveOfflineInvoice({
    required String customerName,
    required String customerTrn,
    required List<Map<String, dynamic>> items,
    required double subtotal,
    required double totalVat,
    required double grandTotal,
  }) async {
    const uuid = Uuid();
    final mutationId = 'mut-${uuid.v4().substring(0, 8)}';
    final idempotencyKey = 'idemp-${uuid.v4()}';

    final payload = {
      'customerName': customerName,
      'customerTrn': customerTrn,
      'items': items,
      'subtotal': subtotal,
      'totalVat': totalVat,
      'grandTotal': grandTotal,
      'clientCreatedAt': DateTime.now().toIso8601String(),
    };

    final mutation = OutboxMutation(
      mutationId: mutationId,
      idempotencyKey: idempotencyKey,
      entityType: 'SALES_INVOICE',
      operation: 'CREATE',
      payloadJson: jsonEncode(payload),
      status: 'PENDING',
      createdAt: DateTime.now(),
    );

    // 1. Write to Local Outbox table
    await db.insertOutbox(mutation);

    // 2. If online, attempt immediate background push
    if (isOnline) {
      triggerBackgroundSync();
    }

    return mutationId;
  }

  // Trigger Outbox Background Sync
  Future<int> triggerBackgroundSync() async {
    if (isSyncing) return 0;
    isSyncing = true;

    int syncedCount = 0;

    try {
      final pendingMutations = await db.getPendingOutbox();

      for (final mutation in pendingMutations) {
        final payload = jsonDecode(mutation.payloadJson);

        final response = await http.post(
          Uri.parse('$baseUrl/sync/push'),
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId,
          },
          body: jsonEncode({
            'mutationId': mutation.mutationId,
            'idempotencyKey': mutation.idempotencyKey,
            'entityType': mutation.entityType,
            'operation': mutation.operation,
            'payload': payload,
          }),
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200 || response.statusCode == 201) {
          await db.markOutboxSynced(mutation.mutationId);
          syncedCount++;
        }
      }
    } catch (e) {
      // Keep mutations PENDING in outbox if offline
      isOnline = false;
    } finally {
      isSyncing = false;
    }

    return syncedCount;
  }
}
