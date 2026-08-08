import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { Item } from '../../database/entities/item.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { StockMovement } from '../../database/entities/stock-movement.entity';

describe('InventoryService (Phase 2 Multi-Warehouse & Stock Loss)', () => {
  let inventoryService: InventoryService;

  const mockItem = {
    id: 'item-prn-80',
    sku: 'PRN-80',
    name: 'POS Thermal Printer 80mm',
    currentStock: 50,
    purchasePrice: 250,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockRepository = {
    findOne: jest.fn().mockResolvedValue(mockItem),
    find: jest.fn().mockResolvedValue([mockItem]),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => cb({
        findOne: jest.fn().mockImplementation((entityClass, conditions) => {
          if (entityClass === Item) return Promise.resolve(mockItem);
          return Promise.resolve({ id: 'mock-warehouse-id', isActive: true });
        }),
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
      })),
    },
  };

  const mockLedgerPostingService = {
    postJournal: jest.fn().mockResolvedValue({ journalId: 'mock-journal-id' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: LedgerPostingService,
          useValue: mockLedgerPostingService,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockRepository,
        },
      ],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('should transfer stock between warehouses successfully', async () => {
    const result = await inventoryService.transferStock({
      tenantId: 'tenant-dxb',
      sourceWarehouseId: 'wh-main-dubai',
      targetWarehouseId: 'wh-mall-branch',
      itemId: 'item-prn-80',
      quantity: 10,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.quantityTransferred).toBe(10);
  });

  it('should adjust stock loss (spoilage/damage) and post balanced journal loss entry', async () => {
    const result = await inventoryService.adjustStockLoss({
      tenantId: 'tenant-dxb',
      warehouseId: 'wh-main-dubai',
      itemId: 'item-prn-80',
      adjustedStock: 48, // 2 units lost
      unitCost: 250,
      reason: 'Physical stock count damage adjustment',
    });

    expect(result.quantityAdjusted).toBe(-2);
    expect(result.inventoryLossValue).toBe(500); // 2 * 250
    expect(result.postedJournalId).toBeDefined();
  });
});
