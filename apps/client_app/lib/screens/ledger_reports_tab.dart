import 'package:flutter/material.dart';
import '../theme/human_theme.dart';

class LedgerReportsTab extends StatelessWidget {
  const LedgerReportsTab({super.key});

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
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('General Ledger & Financial Statements', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                  Text('Double-entry balanced journals, Trial Balance & Form VAT 201', style: TextStyle(color: HumanTheme.textMuted, fontSize: 13)),
                ],
              ),
              HumanTheme.buildBadge('∑ Debits == ∑ Credits (Verified)', HumanTheme.successGreen, Icons.verified_rounded),
            ],
          ),
          const SizedBox(height: 20),

          // Overview Metric Cards
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Gross Revenue (MTD)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: HumanTheme.textMuted)),
                        const SizedBox(height: 8),
                        const Text('AED 142,850.00', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                        const SizedBox(height: 4),
                        HumanTheme.buildBadge('+14.2% Growth', HumanTheme.successGreen, Icons.trending_up_rounded),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Output VAT Payable (5%)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: HumanTheme.textMuted)),
                        const SizedBox(height: 8),
                        const Text('AED 7,142.50', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: HumanTheme.textDark)),
                        const SizedBox(height: 4),
                        HumanTheme.buildBadge('Form VAT 201', HumanTheme.infoBlue, Icons.document_scanner_rounded),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Double-Entry Balance Invariant', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: HumanTheme.textMuted)),
                        const SizedBox(height: 8),
                        const Text('Balanced', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: HumanTheme.successGreen)),
                        const SizedBox(height: 4),
                        const Text('Debits (384.99k) == Credits (384.99k)', style: TextStyle(fontSize: 11, color: HumanTheme.textMuted)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Ledger Accounts Table
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Chart of Accounts & Trial Balance Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: HumanTheme.textDark)),
                    const Divider(height: 20),
                    Expanded(
                      child: ListView(
                        children: const [
                          _AccountRow(code: '1010', name: 'Cash on Hand / Counter Cash', debit: 'AED 45,000.00', credit: 'AED 0.00'),
                          _AccountRow(code: '1020', name: 'Emirates NBD Bank Account', debit: 'AED 185,000.00', credit: 'AED 0.00'),
                          _AccountRow(code: '1100', name: 'Accounts Receivable (Customers)', debit: 'AED 50,000.00', credit: 'AED 0.00'),
                          _AccountRow(code: '1200', name: 'Inventory Asset Account', debit: 'AED 65,000.00', credit: 'AED 0.00'),
                          _AccountRow(code: '2100', name: 'Accounts Payable (Suppliers)', debit: 'AED 0.00', credit: 'AED 35,000.00'),
                          _AccountRow(code: '2150', name: 'Output VAT Payable (5%)', debit: 'AED 0.00', credit: 'AED 7,142.50'),
                          _AccountRow(code: '4000', name: 'Sales Revenue', debit: 'AED 0.00', credit: 'AED 142,850.00'),
                        ],
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

class _AccountRow extends StatelessWidget {
  final String code;
  final String name;
  final String debit;
  final String credit;

  const _AccountRow({
    required this.code,
    required this.name,
    required this.debit,
    required this.credit,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          SizedBox(width: 60, child: Text(code, style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.primaryIndigo, fontFamily: 'monospace'))),
          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500, color: HumanTheme.textDark))),
          SizedBox(width: 140, child: Text(debit, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.textDark))),
          SizedBox(width: 140, child: Text(credit, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.bold, color: HumanTheme.textDark))),
        ],
      ),
    );
  }
}
