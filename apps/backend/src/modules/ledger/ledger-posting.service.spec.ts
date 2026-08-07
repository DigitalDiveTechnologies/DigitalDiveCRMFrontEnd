import { LedgerPostingService } from './ledger-posting.service';
import { BadRequestException } from '@nestjs/common';

describe('LedgerPostingService', () => {
  let service: LedgerPostingService;

  beforeEach(() => {
    service = new LedgerPostingService();
  });

  it('should post balanced journal entry successfully', async () => {
    const result = await service.postJournal({
      tenantId: 'tenant-101',
      sourceDocumentId: 'INV-001',
      sourceDocumentType: 'SALES_INVOICE',
      postingDate: new Date(),
      narration: 'Cash sale to Al Futtaim Trading',
      lines: [
        { accountId: 'acc-1', accountCode: '1010', debit: 1050, credit: 0, description: 'Bank Account' },
        { accountId: 'acc-2', accountCode: '4010', debit: 0, credit: 1000, description: 'Sales Revenue' },
        { accountId: 'acc-3', accountCode: '2150', debit: 0, credit: 50, description: 'Output VAT Payable' },
      ],
    });

    expect(result.status).toBe('POSTED');
    expect(result.isBalanced).toBe(true);
    expect(result.totalDebit).toBe(1050);
    expect(result.totalCredit).toBe(1050);
  });

  it('should throw BadRequestException if journal entry is out of balance', async () => {
    await expect(
      service.postJournal({
        tenantId: 'tenant-101',
        sourceDocumentId: 'INV-002',
        sourceDocumentType: 'SALES_INVOICE',
        postingDate: new Date(),
        narration: 'Unbalanced sale',
        lines: [
          { accountId: 'acc-1', accountCode: '1010', debit: 1000, credit: 0 },
          { accountId: 'acc-2', accountCode: '4010', debit: 0, credit: 800 },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
