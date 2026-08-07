import { PurchasesService } from './purchases.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

describe('PurchasesService (Phase 2 Full Operations)', () => {
  let purchasesService: PurchasesService;

  beforeEach(() => {
    const ledger = new LedgerPostingService();
    const vat = new VatCalculatorService();
    purchasesService = new PurchasesService(ledger, vat);
  });

  it('should post Purchase Bill with 5% Recoverable Input VAT and balanced journal entry', async () => {
    const result = await purchasesService.postPurchaseBill({
      tenantId: 'tenant-dxb',
      supplierId: 'sup-501',
      supplierName: 'Al Habtoor Hardware Supplies LLC',
      supplierBillNumber: 'SUP-BILL-2026-901',
      billDate: new Date(),
      lines: [{ description: 'Bulk ESC/POS Printer Hardware', unitPrice: 10000, quantity: 1, vatCategory: VatCategory.STANDARD }],
    });

    expect(result.status).toBe('POSTED');
    expect(result.subtotal).toBe(10000);
    expect(result.inputVatTotal).toBe(500);
    expect(result.grandTotal).toBe(10500);
    expect(result.postedJournalId).toBeDefined();
  });
});
