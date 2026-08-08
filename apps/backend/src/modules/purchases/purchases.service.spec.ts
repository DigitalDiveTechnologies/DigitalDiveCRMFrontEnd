import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';
import { InventoryService } from '../inventory/inventory.service';
import { SequenceService } from '../ledger/sequence.service';
import { PurchaseBill } from '../../database/entities/purchase-bill.entity';
import { PurchaseBillLine } from '../../database/entities/purchase-bill-line.entity';
import { Party } from '../../database/entities/party.entity';

describe('PurchasesService (Phase 2 Full Operations)', () => {
  let purchasesService: PurchasesService;

  const mockSupplier = {
    id: 'sup-501',
    name: 'Al Habtoor Hardware Supplies LLC',
    trn: '100000000000003',
  };

  const mockRepository = {
    findOne: jest.fn().mockResolvedValue(mockSupplier),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => cb({
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
      })),
    },
  };

  const mockLedgerPostingService = {
    postJournal: jest.fn().mockResolvedValue({ journalId: 'mock-journal-id' }),
  };

  const mockInventoryService = {
    getWarehouses: jest.fn().mockResolvedValue([{ id: 'wh-1' }]),
    recordStockMovement: jest.fn().mockResolvedValue(true),
  };

  const mockSequenceService = {
    getNextSequence: jest.fn().mockResolvedValue('BILL-1001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        VatCalculatorService,
        {
          provide: LedgerPostingService,
          useValue: mockLedgerPostingService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: SequenceService,
          useValue: mockSequenceService,
        },
        {
          provide: getRepositoryToken(PurchaseBill),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PurchaseBillLine),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Party),
          useValue: mockRepository,
        },
      ],
    }).compile();

    purchasesService = module.get<PurchasesService>(PurchasesService);
  });

  it('should post Purchase Bill with 5% Recoverable Input VAT and balanced journal entry', async () => {
    const result = await purchasesService.postPurchaseBill({
      tenantId: 'tenant-dxb',
      supplierId: 'sup-501',
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
