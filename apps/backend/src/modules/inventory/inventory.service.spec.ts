import { InventoryService } from './inventory.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

describe('InventoryService (Phase 2 Multi-Warehouse & Stock Loss)', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    const ledger = new LedgerPostingService();
    inventoryService = new InventoryService(ledger);
  });

  it('should transfer stock between warehouses successfully', async () => {
    const result = await inventoryService.transferStock({
      tenantId: 'tenant-dxb',
      sourceWarehouseId: 'wh-main-dubai',
      sourceWarehouseName: 'Dubai Central Warehouse',
      targetWarehouseId: 'wh-mall-branch',
      targetWarehouseName: 'Dubai Mall Retail Store',
      itemId: 'item-prn-80',
      itemName: 'POS Thermal Printer 80mm',
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
      itemName: 'POS Thermal Printer 80mm',
      currentStock: 50,
      adjustedStock: 48, // 2 units lost
      unitCost: 250,
      reason: 'Physical stock count damage adjustment',
    });

    expect(result.quantityAdjusted).toBe(-2);
    expect(result.inventoryLossValue).toBe(500); // 2 * 250
    expect(result.postedJournalId).toBeDefined();
  });
});
