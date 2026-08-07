import 'package:flutter/material.dart';
import '../theme/human_theme.dart';
import '../database/local_database.dart';
import '../sync/sync_manager.dart';

class PosBillingTab extends StatefulWidget {
  final LocalDatabase db;
  final SyncManager syncManager;

  const PosBillingTab({
    super.key,
    required this.db,
    required this.syncManager,
  });

  @override
  State<PosBillingTab> createState() => _PosBillingTabState();
}

class _PosBillingTabState extends State<PosBillingTab> {
  List<Item> items = [];
  List<Map<String, dynamic>> cart = [];

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    await widget.db.seedInitialOfflineData();
    final list = await widget.db.getItems();
    setState(() {
      items = list;
      if (list.isNotEmpty && cart.isEmpty) {
        cart = [
          {
            'item': list.first,
            'quantity': 1,
            'subtotal': list.first.unitPrice,
            'vat': list.first.unitPrice * 0.05,
          }
        ];
      }
    });
  }

  void _addToCart(Item item) {
    setState(() {
      final index = cart.indexWhere((c) => (c['item'] as Item).id == item.id);
      if (index >= 0) {
        final q = cart[index]['quantity'] + 1;
        cart[index]['quantity'] = q;
        cart[index]['subtotal'] = item.unitPrice * q;
        cart[index]['vat'] = item.unitPrice * q * 0.05;
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

  Future<void> _checkout() async {
    if (cart.isEmpty) return;

    final itemsPayload = cart.map((c) {
      final i = c['item'] as Item;
      return {
        'description': i.name,
        'sku': i.sku,
        'quantity': c['quantity'],
        'unitPrice': i.unitPrice,
        'vatCategory': 'STANDARD_5',
      };
    }).toList();

    await widget.syncManager.saveOfflineInvoice(
      customerName: 'Al Serkal Group LLC',
      customerTrn: '100293847500003',
      items: itemsPayload,
      subtotal: subtotal,
      totalVat: vatTotal,
      grandTotal: grandTotal,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.syncManager.isOnline
                ? '✅ POS Tax Invoice Created & Synced to Server!'
                : '🟡 Working Offline: Invoice Saved to Local Database Outbox!',
          ),
          backgroundColor: widget.syncManager.isOnline ? HumanTheme.successGreen : HumanTheme.warningAmber,
        ),
      );
      setState(() => cart.clear());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Item Catalogue Left Grid
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Scan Barcode or Search Item Name / SKU...',
                    prefixIcon: const Icon(Icons.qr_code_scanner, color: HumanTheme.primaryIndigo),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: HumanTheme.borderLight),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: HumanTheme.borderLight),
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                Expanded(
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 1.35,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: items.length,
                    itemBuilder: (context, idx) {
                      final item = items[idx];
                      return Card(
                        child: InkWell(
                          onTap: () => _addToCart(item),
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(item.sku, style: const TextStyle(fontSize: 11, color: HumanTheme.primaryIndigo, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                                Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: HumanTheme.textDark), maxLines: 2),
                                Text('AED ${item.unitPrice.toStringAsFixed(2)}', style: const TextStyle(color: HumanTheme.successGreen, fontWeight: FontWeight.bold, fontSize: 15)),
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
          const SizedBox(width: 24),

          // Active Cart Right Column
          Expanded(
            flex: 2,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Active POS Cart', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: HumanTheme.textDark)),
                        HumanTheme.buildBadge('${cart.length} Items', HumanTheme.infoBlue, Icons.shopping_cart_outlined),
                      ],
                    ),
                    const Divider(height: 24),

                    Expanded(
                      child: ListView.builder(
                        itemCount: cart.length,
                        itemBuilder: (context, idx) {
                          final c = cart[idx];
                          final i = c['item'] as Item;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: HumanTheme.backgroundSlate,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: HumanTheme.borderLight),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(i.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: HumanTheme.textDark)),
                                    Text('Qty: ${c['quantity']} x AED ${i.unitPrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, color: HumanTheme.textMuted)),
                                  ],
                                ),
                                Text('AED ${(c['subtotal'] as double).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                              ],
                            ),
                          );
                        },
                      ),
                    ),

                    const Divider(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotal (Excl. VAT):', style: TextStyle(color: HumanTheme.textMuted)),
                        Text('AED ${subtotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('UAE VAT (5%):', style: TextStyle(color: HumanTheme.successGreen, fontWeight: FontWeight.bold)),
                        Text('AED ${vatTotal.toStringAsFixed(2)}', style: const TextStyle(color: HumanTheme.successGreen, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Grand Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: HumanTheme.textDark)),
                        Text('AED ${grandTotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: HumanTheme.primaryIndigo)),
                      ],
                    ),
                    const SizedBox(height: 18),

                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton.icon(
                        onPressed: cart.isEmpty ? null : _checkout,
                        icon: const Icon(Icons.print_rounded),
                        label: const Text('Complete Sale & Print ESC/POS Receipt'),
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
