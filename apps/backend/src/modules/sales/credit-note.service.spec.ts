import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreditNoteService } from './credit-note.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService } from '../tax/vat-calculator.service';
import { SequenceService } from '../ledger/sequence.service';
import { CreditNote } from '../../database/entities/credit-note.entity';
import { SalesInvoice } from '../../database/entities/sales-invoice.entity';
import { VatCategory } from '../tax/vat-calculator.service';

describe('CreditNoteService', () => {
  let creditNoteService: CreditNoteService;

  const mockInvoice = {
    id: 'inv-888',
    invoiceNumber: 'INV-2026-0088',
    grandTotal: 1050,
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => cb({
        findOne: jest.fn().mockResolvedValue(mockInvoice),
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
      })),
    },
  };

  const mockLedgerPostingService = {
    postJournal: jest.fn().mockResolvedValue({ journalId: 'mock-journal-id' }),
  };

  const mockSequenceService = {
    getNextSequence: jest.fn().mockResolvedValue('CN-1001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditNoteService,
        VatCalculatorService,
        {
          provide: LedgerPostingService,
          useValue: mockLedgerPostingService,
        },
        {
          provide: SequenceService,
          useValue: mockSequenceService,
        },
        {
          provide: getRepositoryToken(CreditNote),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesInvoice),
          useValue: mockRepository,
        },
      ],
    }).compile();

    creditNoteService = module.get<CreditNoteService>(CreditNoteService);
  });

  it('should issue Credit Note and post balanced reversal journal entry', async () => {
    const result = await creditNoteService.issueCreditNote({
      tenantId: 'tenant-dxb',
      originalInvoiceId: 'inv-888',
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
