import 'package:flutter/material.dart';
import '../database/local_database.dart';
import '../sync/sync_manager.dart';

class PosDesktopScreen extends StatefulWidget {
  final LocalDatabase db;
  final SyncManager syncManager;

  const PosDesktopScreen({
    super.key,
    required this.db,
    required this.syncManager,
  });

  @override
  State<PosDesktopScreen> createState() => _PosDesktopScreenState();
}

class _PosDesktopScreenState extends State<PosDesktopScreen> {
  bool isOnline = true;
  List<Item> catalogueItems = [];
  List<Map<String, dynamic>> cart = [];
  List<OutboxMutation> outboxList = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    await widget.db.seedInitialOfflineData();
    final items = await widget.db.select(widget.db.items).get();
    final outbox = await widget.db.select(widget.db.outboxMutations).get();

    setState(() {
      catalogueItems = items;
      outboxList = outbox;
      isLoading = false;
      // Pre-fill initial cart
      if (items.isNotEmpty && cart.isEmpty) {
        cart = [
          {
            'item': items.first,
            'quantity': 1,
            'subtotal': items.first.unitPrice,
            'vat': items.first.unitPrice * 0.05,
          }
        ];
      }
    });
  }

  void _addToCart(Item item) {
    setState(() {
      final existingIndex = cart.indexWhere((c) => (c['item'] as Item).id == item.id);
      if (existingIndex >= 0) {
        final q = cart[existingIndex]['quantity'] + 1;
        cart[existingIndex]['quantity'] = q;
        cart[existingIndex]['subtotal'] = item.unitPrice * q;
        cart[existingIndex]['vat'] = item.unitPrice * q * 0.05;
      } else {
        cart.add({
          'item': item,
          'quantity': 1,
          'subtotal': item.unitPrice,
          'vat': item.unitPrice * 0.05,
        });
      }
    });
  }

  double get subtotal => cart.fold(0.0, (sum, c) => sum + (c['subtotal'] as double));
  double get vatTotal => cart.fold(0.0, (sum, c) => sum + (c['vat'] as double));
  double get grandTotal => subtotal + vatTotal;

  Future<void> _processCheckout() async {
    if (cart.isEmpty) return;

    final itemsPayload = cart.map((c) {
      final item = c['item'] as Item;
      return {
        'description': item.name,
        'sku': item.sku,
        'quantity': c['quantity'],
        'unitPrice': item.unitPrice,
        'vatCategory': 'STANDARD_5',
      };
    }).toList();

    // 1. Write invoice to local Drift SQLite outbox
    await widget.syncManager.saveOfflineInvoice(
      customerName: 'Al Serkal Group LLC',
      customerTrn: '100293847500003',
      items: itemsPayload,
      subtotal: subtotal,
      totalVat: vatTotal,
      grandTotal: grandTotal,
    );

    // 2. Reload outbox data from SQLite
    final updatedOutbox = await widget.db.select(widget.db.outboxMutations).get();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isOnline
                ? '✅ POS Tax Invoice Created & Pushed to Remote Database!'
                : '🟡 Working Offline: Invoice Saved to Local Drift SQLite Outbox Queue!',
          ),
          backgroundColor: isOnline ? Colors.green[800] : Colors.amber[900],
        ),
      );

      setState(() {
        cart.clear();
        outboxList = updatedOutbox;
      });
    }
  }

  Future<void> _manualSyncOutbox() async {
    widget.syncManager.isOnline = isOnline;
    final synced = await widget.syncManager.triggerBackgroundSync();
    final updatedOutbox = await widget.db.select(widget.db.outboxMutations).get();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            synced > 0
                ? '🔄 Offline Sync Complete: $synced mutations uploaded to Remote Server!'
                : 'Server up to date. No pending offline mutations.',
          ),
        ),
      );

      setState(() {
        outboxList = updatedOutbox;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F19),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121A2C),
        elevation: 2,
        title: const Text('🇦🇪 UAE Desktop POS — Offline-First Architecture', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          // Online / Offline Network Status Switcher
          InkWell(
            onTap: () {
              setState(() {
                isOnline = !isOnline;
                widget.syncManager.isOnline = isOnline;
              });
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isOnline ? Colors.green.withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isOnline ? Colors.green : Colors.amber),
              ),
              child: Row(
                children: [
                  Icon(
                    isOnline ? Icons.wifi : Icons.wifi_off,
                    size: 16,
                    color: isOnline ? Colors.green : Colors.amber,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isOnline ? 'ONLINE (Sync Active)' : 'OFFLINE MODE (Drift SQLite)',
                    style: TextStyle(
                      color: isOnline ? Colors.green : Colors.amber,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton.icon(
            onPressed: _manualSyncOutbox,
            icon: const Icon(Icons.sync, size: 16),
            label: const Text('Sync Outbox Now'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0284C7),
              foregroundColor: Colors.white,
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Side: Catalogue & Scan
                  Expanded(
                    flex: 3,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Search Bar
                        TextField(
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'Scan Barcode or Search SKU / Item Name...',
                            hintStyle: const TextStyle(color: Colors.grey),
                            prefixIcon: const Icon(Icons.qr_code_scanner, color: Color(0xFF38BDF8)),
                            filled: true,
                            fillColor: const Color(0xFF121A2C),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Item Grid
                        Expanded(
                          child: GridView.builder(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3,
                              childAspectRatio: 1.4,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                            ),
                            itemCount: catalogueItems.length,
                            itemBuilder: (context, index) {
                              final item = catalogueItems[index];
                              return Card(
                                color: const Color(0xFF121A2C),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: const BorderSide(color: Colors.white12),
                                ),
                                child: InkWell(
                                  onTap: () => _addToCart(item),
                                  borderRadius: BorderRadius.circular(12),
                                  child: Padding(
                                    padding: const EdgeInsets.all(12.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(item.sku, style: const TextStyle(fontSize: 11, color: Color(0xFF38BDF8), fontFamily: 'monospace')),
                                        Text(item.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13), maxLines: 2),
                                        Text('AED ${item.unitPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 15)),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),

                  // Right Side: Active Cart & Local Outbox Log
                  Expanded(
                    flex: 2,
                    child: Column(
                      children: [
                        // Cart Container
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF121A2C),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Current POS Cart', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                  Text('Tax Invoice', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                ],
                              ),
                              const Divider(color: Colors.white12, height: 20),

                              // Cart items
                              ...cart.map((c) {
                                final item = c['item'] as Item;
                                return ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(item.name, style: const TextStyle(color: Colors.white, fontSize: 13)),
                                  subtitle: Text('Qty: ${c['quantity']} x AED ${item.unitPrice.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                  trailing: Text('AED ${(c['subtotal'] as double).toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                );
                              }),

                              const Divider(color: Colors.white12, height: 20),

                              // Totals
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Subtotal:', style: TextStyle(color: Colors.grey)),
                                  Text('AED ${subtotal.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('UAE VAT (5%):', style: TextStyle(color: Colors.greenAccent)),
                                  Text('AED ${vatTotal.toStringAsFixed(2)}', style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Grand Total:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                  Text('AED ${grandTotal.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 18)),
                                ],
                              ),
                              const SizedBox(height: 16),

                              SizedBox(
                                width: double.infinity,
                                height: 44,
                                child: ElevatedButton.icon(
                                  onPressed: cart.isEmpty ? null : _processCheckout,
                                  icon: const Icon(Icons.print),
                                  label: Text(isOnline ? 'Checkout & Post to Server' : 'Checkout Offline (Save to SQLite)'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isOnline ? const Color(0xFF059669) : const Color(0xFFD97706),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Offline Outbox SQLite Table Log
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF121A2C),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Local Drift SQLite Outbox Queue', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                    Chip(
                                      label: Text('${outboxList.where((o) => o.status == 'PENDING').length} Pending', style: const TextStyle(fontSize: 10, color: Colors.white)),
                                      backgroundColor: Colors.amber[900],
                                    )
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Expanded(
                                  child: ListView.builder(
                                    itemCount: outboxList.length,
                                    itemBuilder: (context, idx) {
                                      final mut = outboxList[idx];
                                      final isSynced = mut.status == 'SYNCED';
                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 6),
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0B0F19),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: isSynced ? Colors.green.withOpacity(0.3) : Colors.amber.withOpacity(0.3)),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(mut.mutationId, style: const TextStyle(color: Color(0xFF38BDF8), fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.bold)),
                                                Text('Idempotency: ${mut.idempotencyKey.substring(0, 16)}...', style: const TextStyle(color: Colors.grey, fontSize: 9)),
                                              ],
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: isSynced ? Colors.green[900] : Colors.amber[900],
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                mut.status,
                                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                              ),
                                            )
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
