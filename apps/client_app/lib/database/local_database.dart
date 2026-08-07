import 'package:flutter/foundation.dart';

class Item {
  final String id;
  final String name;
  final String sku;
  final double unitPrice;
  final double vatRate;
  final int stockQuantity;

  Item({
    required this.id,
    required this.name,
    required this.sku,
    required this.unitPrice,
    this.vatRate = 0.05,
    required this.stockQuantity,
  });
}

class Party {
  final String id;
  final String name;
  final String? trn;
  final String type;
  final double creditLimit;

  Party({
    required this.id,
    required this.name,
    this.trn,
    required this.type,
    this.creditLimit = 0.0,
  });
}

class OutboxMutation {
  final String mutationId;
  final String idempotencyKey;
  final String entityType;
  final String operation;
  final String payloadJson;
  final String status;
  final DateTime createdAt;

  OutboxMutation({
    required this.mutationId,
    required this.idempotencyKey,
    required this.entityType,
    required this.operation,
    required this.payloadJson,
    required this.status,
    required this.createdAt,
  });
}

class LocalDatabase {
  final List<Item> _items = [
    Item(id: 'itm-101', name: 'POS Thermal Printer 80mm ESC/POS', sku: 'PRN-80-ESC', unitPrice: 450.0, stockQuantity: 42),
    Item(id: 'itm-102', name: 'Barcode Scanner Handheld USB/BT', sku: 'SCN-BT-2D', unitPrice: 220.0, stockQuantity: 15),
    Item(id: 'itm-103', name: 'Thermal Paper Roll 80x80 (Box of 50)', sku: 'PPR-8080-BOX', unitPrice: 120.0, stockQuantity: 100),
  ];

  final List<Party> _parties = [
    Party(id: 'pty-101', name: 'Al Serkal Group LLC', trn: '100293847500003', type: 'CUSTOMER', creditLimit: 50000.0),
  ];

  final List<OutboxMutation> _outbox = [];

  Future<void> seedInitialOfflineData() async {}

  Future<List<Item>> getItems() async => List.unmodifiable(_items);

  Future<List<Party>> getParties() async => List.unmodifiable(_parties);

  Future<List<OutboxMutation>> getPendingOutbox() async {
    return _outbox.where((o) => o.status == 'PENDING').toList();
  }

  Future<List<OutboxMutation>> getAllOutbox() async {
    return List.unmodifiable(_outbox);
  }

  Future<void> insertOutbox(OutboxMutation mutation) async {
    _outbox.insert(0, mutation);
  }

  Future<void> markOutboxSynced(String mutationId) async {
    final idx = _outbox.indexWhere((o) => o.mutationId == mutationId);
    if (idx >= 0) {
      final old = _outbox[idx];
      _outbox[idx] = OutboxMutation(
        mutationId: old.mutationId,
        idempotencyKey: old.idempotencyKey,
        entityType: old.entityType,
        operation: old.operation,
        payloadJson: old.payloadJson,
        status: 'SYNCED',
        createdAt: old.createdAt,
      );
    }
  }
}
