import { ReceiptsService } from './receipts.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { BadRequestException } from '@nestjs/common';

describe('ReceiptsService', () => {
  let receiptsService: ReceiptsService;
  let ledgerPostingService: LedgerPostingService;

  beforeEach(() => {
    ledgerPostingService = new LedgerPostingService();
    receiptsService = new ReceiptsService(ledgerPostingService);
  });

  it('should allocate partial payment receipt and update invoice status to PARTIALLY_PAID', async () => {
    const result = await receiptsService.processPaymentReceipt({
      tenantId: 'tenant-dxb',
      invoiceId: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      invoiceTotalAmount: 1000,
      existingPaidAmount: 0,
      paymentAmount: 400,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
    });

    expect(result.newInvoiceStatus).toBe('PARTIALLY_PAID');
    expect(result.remainingBalance).toBe(600);
    expect(result.postedJournalId).toBeDefined();
  });

  it('should allocate full payment receipt and update invoice status to PAID', async () => {
    const result = await receiptsService.processPaymentReceipt({
      tenantId: 'tenant-dxb',
      invoiceId: 'inv-101',
      invoiceNumber: 'INV-2026-0001',
      invoiceTotalAmount: 1000,
      existingPaidAmount: 400,
      paymentAmount: 600,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date(),
    });

    expect(result.newInvoiceStatus).toBe('PAID');
    expect(result.remainingBalance).toBe(0);
  });

  it('should throw BadRequestException if payment exceeds outstanding balance', async () => {
    await expect(
      receiptsService.processPaymentReceipt({
        tenantId: 'tenant-dxb',
        invoiceId: 'inv-101',
        invoiceNumber: 'INV-2026-0001',
        invoiceTotalAmount: 1000,
        existingPaidAmount: 900,
        paymentAmount: 200,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
