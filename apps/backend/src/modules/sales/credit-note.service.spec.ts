import { CreditNoteService } from './credit-note.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

describe('CreditNoteService', () => {
  let creditNoteService: CreditNoteService;

  beforeEach(() => {
    const ledger = new LedgerPostingService();
    const vat = new VatCalculatorService();
    creditNoteService = new CreditNoteService(ledger, vat);
  });

  it('should issue Credit Note and post balanced reversal journal entry', async () => {
    const result = await creditNoteService.issueCreditNote({
      tenantId: 'tenant-dxb',
      originalInvoiceId: 'inv-888',
      originalInvoiceNumber: 'INV-2026-0088',
      reason: 'Damaged item return',
      returnedItems: [{ unitPrice: 1000, quantity: 1, vatCategory: VatCategory.STANDARD }],
    });

    expect(result.creditNoteId).toBeDefined();
    expect(result.subtotal).toBe(1000);
    expect(result.vatAmount).toBe(50);
    expect(result.totalRefundAmount).toBe(1050);
    expect(result.postedReversalJournalId).toBeDefined();
  });
});
