import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../database/entities/item.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { StockMovement, StockMovementType } from '../../database/entities/stock-movement.entity';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

export interface StockTransferInput {
  tenantId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  itemId: string;
  quantity: number;
}

export interface StockAdjustmentInput {
  tenantId: string;
  warehouseId: string;
  itemId: string;
  adjustedStock: number; // The new actual stock count
  unitCost: number;
  reason: string;
}

export interface StockTransferResult {
  transferId: string;
  status: 'COMPLETED';
  quantityTransferred: number;
}

export interface StockAdjustmentResult {
  adjustmentId: string;
  quantityAdjusted: number;
  inventoryLossValue: number;
  postedJournalId: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  async getItems(tenantId: string): Promise<Item[]> {
    return this.itemRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createItem(tenantId: string, dto: any): Promise<Item> {
    const item = this.itemRepository.create({
      tenantId,
      name: dto.name,
      sku: dto.sku,
      barcode: dto.barcode || null,
      unit: dto.unit || 'PCS',
      salesPrice: dto.unitPrice || dto.salesPrice || 0,
      purchasePrice: dto.purchasePrice || 0,
      vatCategory: dto.vatCategory || 'STANDARD_5',
      isInventoryItem: dto.isInventoryItem !== undefined ? dto.isInventoryItem : true,
      currentStock: dto.initialStock || 0,
      reorderLevel: dto.reorderLevel || 0,
      isActive: true,
    });
    return this.itemRepository.save(item);
  }

  async getWarehouses(tenantId: string): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { tenantId, isActive: true },
    });
  }

  async createWarehouse(tenantId: string, dto: any): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      tenantId,
      code: dto.code,
      name: dto.name,
      address: dto.address || null,
      isActive: true,
    });
    return this.warehouseRepository.save(warehouse);
  }

  /**
   * Records a stock movement and updates current stock + Weighted Average Cost (WAC)
   */
  async recordStockMovement(
    tenantId: string,
    itemId: string,
    warehouseId: string,
    quantity: number, // positive for in, negative for out
    movementType: StockMovementType,
    sourceDocumentId: string,
    sourceDocumentType: string,
    costPrice?: number,
  ): Promise<StockMovement> {
    return this.stockMovementRepository.manager.transaction(async (transactionalEntityManager) => {
      const item = await transactionalEntityManager.findOne(Item, {
        where: { tenantId, id: itemId },
      });

      if (!item) {
        throw new NotFoundException(`Item with ID ${itemId} not found.`);
      }

      // Verify warehouse exists if warehouseId is provided
      if (warehouseId) {
        const warehouse = await transactionalEntityManager.findOne(Warehouse, {
          where: { tenantId, id: warehouseId },
        });
        if (!warehouse) {
          throw new NotFoundException(`Warehouse with ID ${warehouseId} not found.`);
        }
      }

      const currentStock = Number(item.currentStock || 0);
      const oldWac = Number(item.purchasePrice || 0);
      const movementQty = Number(quantity);

      // Perform Weighted Average Cost (WAC) update on purchase
      if (movementType === StockMovementType.PURCHASE && costPrice > 0 && movementQty > 0) {
        const newCost = Number(costPrice);
        if (currentStock + movementQty > 0) {
          item.purchasePrice = Number(
            ((currentStock * oldWac + movementQty * newCost) / (currentStock + movementQty)).toFixed(2),
          );
        }
      }

      // Update actual item stock
      item.currentStock = Number((currentStock + movementQty).toFixed(2));
      await transactionalEntityManager.save(item);

      // Save movement record
      const movement = this.stockMovementRepository.create({
        tenantId,
        itemId,
        warehouseId,
        quantity: movementQty,
        movementType,
        sourceDocumentId,
        sourceDocumentType,
        costPrice: costPrice || oldWac,
      });

      return transactionalEntityManager.save(movement);
    });
  }

  /**
   * Transfer stock between warehouses.
   */
  async transferStock(input: StockTransferInput): Promise<StockTransferResult> {
    if (input.quantity <= 0) {
      throw new BadRequestException('Transfer quantity must be greater than zero.');
    }
    if (input.sourceWarehouseId === input.targetWarehouseId) {
      throw new BadRequestException('Source and target warehouse cannot be identical.');
    }

    const transferId = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Out movement from source warehouse
    await this.recordStockMovement(
      input.tenantId,
      input.itemId,
      input.sourceWarehouseId,
      -input.quantity,
      StockMovementType.TRANSFER,
      transferId,
      'STOCK_TRANSFER',
    );

    // In movement to target warehouse
    await this.recordStockMovement(
      input.tenantId,
      input.itemId,
      input.targetWarehouseId,
      input.quantity,
      StockMovementType.TRANSFER,
      transferId,
      'STOCK_TRANSFER',
    );

    return {
      transferId,
      status: 'COMPLETED',
      quantityTransferred: input.quantity,
    };
  }

  /**
   * Adjust stock level (spoilage/damage/shrinkage) and post double-entry loss entry to General Ledger.
   */
  async adjustStockLoss(input: StockAdjustmentInput): Promise<StockAdjustmentResult> {
    const item = await this.itemRepository.findOne({
      where: { tenantId: input.tenantId, id: input.itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${input.itemId} not found.`);
    }

    const currentStock = Number(item.currentStock || 0);
    const quantityDifference = input.adjustedStock - currentStock;

    if (quantityDifference >= 0) {
      throw new BadRequestException('Stock loss adjustment requires adjusted stock to be less than current stock.');
    }

    const lossQuantity = Math.abs(quantityDifference);
    const unitCost = input.unitCost || Number(item.purchasePrice || 0);
    const inventoryLossValue = Number((lossQuantity * unitCost).toFixed(2));
    const adjustmentId = `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Perform the inventory stock reduction
    await this.recordStockMovement(
      input.tenantId,
      input.itemId,
      input.warehouseId,
      quantityDifference, // negative value representing stock reduction
      StockMovementType.ADJUSTMENT,
      adjustmentId,
      'INVENTORY_ADJUSTMENT',
      unitCost,
    );

    // Post Inventory Loss Journal to GL
    const journalResult = await this.ledgerPostingService.postJournal({
      tenantId: input.tenantId,
      sourceDocumentId: adjustmentId,
      sourceDocumentType: 'INVENTORY_ADJUSTMENT',
      postingDate: new Date(),
      narration: `Inventory loss adjustment for ${item.name} (${lossQuantity} units). Reason: ${input.reason}`,
      lines: [
        {
          accountId: 'acc-inv-loss-5050',
          accountCode: '5050',
          debit: inventoryLossValue,
          credit: 0,
          description: `Inventory Adjustment Expense for ${item.name}`,
        },
        {
          accountId: 'acc-inv-asset-1200',
          accountCode: '1200',
          debit: 0,
          credit: inventoryLossValue,
          description: `Inventory Asset reduction for ${item.name}`,
        },
      ],
    });

    return {
      adjustmentId,
      quantityAdjusted: quantityDifference,
      inventoryLossValue,
      postedJournalId: journalResult.journalId,
    };
  }
}
