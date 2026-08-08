import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LedgerPostingService } from './ledger-posting.service';
import { SequenceService } from './sequence.service';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { JournalLine } from '../../database/entities/journal-line.entity';
import { Account } from '../../database/entities/account.entity';
import { BadRequestException } from '@nestjs/common';

describe('LedgerPostingService', () => {
  let service: LedgerPostingService;

  const mockRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation((cb) => cb({
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(dto => dto),
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
      })),
    },
  };

  const mockSequenceService = {
    getNextSequence: jest.fn().mockResolvedValue('JRN-1001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerPostingService,
        {
          provide: SequenceService,
          useValue: mockSequenceService,
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Account),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LedgerPostingService>(LedgerPostingService);
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
