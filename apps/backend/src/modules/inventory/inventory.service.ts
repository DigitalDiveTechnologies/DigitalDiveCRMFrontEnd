import { Injectable, BadRequestException } from '@nestjs/common';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

export interface StockTransferInput {
  tenantId: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface StockAdjustmentInput {
  tenantId: string;
  warehouseId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  adjustedStock: number;
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
  constructor(private readonly ledgerPostingService: LedgerPostingService) {}

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

    return {
      transferId,
      status: 'COMPLETED',
      quantityTransferred: input.quantity,
    };
  }

  /**
   * Adjust stock level (spoilage/damage/shrinkage) and post double-entry loss entry to General Ledger.
   * Debit: Inventory Adjustment Expense (5050)
   * Credit: Inventory Asset (1200)
   */
  async adjustStockLoss(input: StockAdjustmentInput): Promise<StockAdjustmentResult> {
    const quantityDifference = input.adjustedStock - input.currentStock;

    if (quantityDifference >= 0) {
      throw new BadRequestException('Stock loss adjustment requires adjusted stock to be less than current stock.');
    }

    const lossQuantity = Math.abs(quantityDifference);
    const inventoryLossValue = Number((lossQuantity * input.unitCost).toFixed(2));
    const adjustmentId = `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Post Inventory Loss Journal
    const journalResult = await this.ledgerPostingService.postJournal({
      tenantId: input.tenantId,
      sourceDocumentId: adjustmentId,
      sourceDocumentType: 'INVENTORY_ADJUSTMENT',
      postingDate: new Date(),
      narration: `Inventory loss adjustment for ${input.itemName} (${lossQuantity} units). Reason: ${input.reason}`,
      lines: [
        {
          accountId: 'acc-inv-loss-5050',
          accountCode: '5050',
          debit: inventoryLossValue,
          credit: 0,
          description: `Inventory Adjustment Expense for ${input.itemName}`,
        },
        {
          accountId: 'acc-inv-asset-1200',
          accountCode: '1200',
          debit: 0,
          credit: inventoryLossValue,
          description: `Inventory Asset reduction for ${input.itemName}`,
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
