import 'package:flutter/material.dart';
import '../theme/human_theme.dart';
import '../database/local_database.dart';

class InventoryTab extends StatefulWidget {
  final LocalDatabase db;
  const InventoryTab({super.key, required this.db});

  @override
  State<InventoryTab> createState() => _InventoryTabState();
}

class _InventoryTabState extends State<InventoryTab> {
  List<Item> items = [];

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  Future<void> _loadItems() async {
    final list = await widget.db.getItems();
    setState(() => items = list);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Inventory Catalogue & Stock Levels', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
              ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Add New Item'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          Expanded(
            child: Card(
              child: ListView.separated(
                itemCount: items.length,
                separatorBuilder: (context, idx) => const Divider(height: 1),
                itemBuilder: (context, idx) {
                  final item = items[idx];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: HumanTheme.primaryIndigo.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.inventory_2_rounded, color: HumanTheme.primaryIndigo),
                    ),
                    title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                    subtitle: Text('SKU: ${item.sku} | 5% UAE VAT', style: const TextStyle(color: HumanTheme.textMuted, fontSize: 12)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('AED ${item.unitPrice.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: HumanTheme.textDark)),
                        const SizedBox(height: 2),
                        HumanTheme.buildBadge('${item.stockQuantity} in Stock', HumanTheme.successGreen, Icons.check_circle_outline_rounded),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
