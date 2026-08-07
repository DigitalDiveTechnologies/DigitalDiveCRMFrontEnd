import 'package:flutter/material.dart';
import '../theme/human_theme.dart';
import '../database/local_database.dart';
import '../sync/sync_manager.dart';

class SyncOutboxTab extends StatefulWidget {
  final LocalDatabase db;
  final SyncManager syncManager;

  const SyncOutboxTab({
    super.key,
    required this.db,
    required this.syncManager,
  });

  @override
  State<SyncOutboxTab> createState() => _SyncOutboxTabState();
}

class _SyncOutboxTabState extends State<SyncOutboxTab> {
  List<OutboxMutation> outboxList = [];

  @override
  void initState() {
    super.initState();
    _loadOutbox();
  }

  Future<void> _loadOutbox() async {
    final list = await widget.db.getAllOutbox();
    setState(() => outboxList = list);
  }

  Future<void> _syncNow() async {
    final count = await widget.syncManager.triggerBackgroundSync();
    await _loadOutbox();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(count > 0 ? '🔄 Synced $count mutations to remote server.' : 'Remote server is up to date.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = outboxList.where((o) => o.status == 'PENDING').length;

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Local Outbox Queue & Synchronization', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                  Text(widget.syncManager.isOnline ? '🟢 Connected to Remote Server (Auto-Push Active)' : '🟡 Offline Mode (Writing to Local Database)', style: TextStyle(color: widget.syncManager.isOnline ? HumanTheme.successGreen : HumanTheme.warningAmber, fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _syncNow,
                icon: const Icon(Icons.sync_rounded, size: 18),
                label: const Text('Sync Pending Outbox Now'),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Overview Cards
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Pending Outbox Mutations', style: TextStyle(fontSize: 12, color: HumanTheme.textMuted)),
                        const SizedBox(height: 6),
                        Text('$pendingCount Pending', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HumanTheme.warningAmber)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Idempotency Key Protection', style: TextStyle(fontSize: 12, color: HumanTheme.textMuted)),
                        const SizedBox(height: 6),
                        const Text('100% Active', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HumanTheme.primaryIndigo)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Outbox List Table
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Local Outbox Table Mutations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: HumanTheme.textDark)),
                    const Divider(height: 20),
                    Expanded(
                      child: outboxList.isEmpty
                          ? const Center(child: Text('No outbox mutations logged yet.', style: TextStyle(color: HumanTheme.textMuted)))
                          : ListView.separated(
                              itemCount: outboxList.length,
                              separatorBuilder: (context, idx) => const Divider(height: 1),
                              itemBuilder: (context, idx) {
                                final mut = outboxList[idx];
                                final isSynced = mut.status == 'SYNCED';
                                return ListTile(
                                  leading: Icon(
                                    isSynced ? Icons.cloud_done_rounded : Icons.cloud_upload_outlined,
                                    color: isSynced ? HumanTheme.successGreen : HumanTheme.warningAmber,
                                  ),
                                  title: Text(mut.mutationId, style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', color: HumanTheme.primaryIndigo)),
                                  subtitle: Text('Idempotency Key: ${mut.idempotencyKey.substring(0, 20)}...', style: const TextStyle(fontSize: 11, color: HumanTheme.textMuted)),
                                  trailing: HumanTheme.buildBadge(
                                    mut.status,
                                    isSynced ? HumanTheme.successGreen : HumanTheme.warningAmber,
                                    isSynced ? Icons.check_circle_outline : Icons.pending_actions,
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
