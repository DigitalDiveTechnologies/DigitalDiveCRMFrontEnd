import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { SequenceService } from '../ledger/sequence.service';
import { Receipt } from '../../database/entities/receipt.entity';
import { SalesInvoice } from '../../database/entities/sales-invoice.entity';
import { BadRequestException } from '@nestjs/common';

describe('ReceiptsService', () => {
  let receiptsService: ReceiptsService;

  const mockInvoice = {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-0001',
    grandTotal: 1000,
    paidAmount: 0,
    save: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => cb({
        findOne: jest.fn().mockImplementation(() => {
          return Promise.resolve(mockInvoice);
        }),
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
      })),
    },
  };

  const mockLedgerPostingService = {
    postJournal: jest.fn().mockResolvedValue({ journalId: 'mock-journal-id' }),
  };

  const mockSequenceService = {
    getNextSequence: jest.fn().mockResolvedValue('RCT-1001'),
  };

  beforeEach(async () => {
    mockInvoice.paidAmount = 0; // reset
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptsService,
        {
          provide: LedgerPostingService,
          useValue: mockLedgerPostingService,
        },
        {
          provide: SequenceService,
          useValue: mockSequenceService,
        },
        {
          provide: getRepositoryToken(Receipt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SalesInvoice),
          useValue: mockRepository,
        },
      ],
    }).compile();

    receiptsService = module.get<ReceiptsService>(ReceiptsService);
  });

  it('should allocate partial payment receipt and update invoice status to PARTIALLY_PAID', async () => {
    mockInvoice.paidAmount = 0;
    const result = await receiptsService.processPaymentReceipt({
      tenantId: 'tenant-dxb',
      invoiceId: 'inv-101',
      paymentAmount: 400,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
    });

    expect(result.newInvoiceStatus).toBe('PARTIALLY_PAID');
    expect(result.remainingBalance).toBe(600);
    expect(result.postedJournalId).toBeDefined();
  });

  it('should allocate full payment receipt and update invoice status to PAID', async () => {
    mockInvoice.paidAmount = 400; // set existing
    const result = await receiptsService.processPaymentReceipt({
      tenantId: 'tenant-dxb',
      invoiceId: 'inv-101',
      paymentAmount: 600,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date(),
    });

    expect(result.newInvoiceStatus).toBe('PAID');
    expect(result.remainingBalance).toBe(0);
  });

  it('should throw BadRequestException if payment exceeds outstanding balance', async () => {
    mockInvoice.paidAmount = 900; // set existing
    await expect(
      receiptsService.processPaymentReceipt({
        tenantId: 'tenant-dxb',
        invoiceId: 'inv-101',
        paymentAmount: 200,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
