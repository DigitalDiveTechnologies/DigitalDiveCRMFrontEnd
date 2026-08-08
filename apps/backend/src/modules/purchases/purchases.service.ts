import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseBill, PurchaseBillStatus } from '../../database/entities/purchase-bill.entity';
import { PurchaseBillLine } from '../../database/entities/purchase-bill-line.entity';
import { Party } from '../../database/entities/party.entity';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';
import { InventoryService } from '../inventory/inventory.service';
import { SequenceService } from '../ledger/sequence.service';
import { StockMovementType } from '../../database/entities/stock-movement.entity';

export interface PurchaseBillLineInput {
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatCategory: VatCategory;
}

export interface CreatePurchaseBillInput {
  tenantId: string;
  branchId?: string;
  supplierId: string;
  supplierBillNumber: string;
  billDate: Date;
  dueDate?: Date;
  warehouseId?: string;
  lines: PurchaseBillLineInput[];
}

export interface PurchaseBillResult {
  billId: string;
  billNumber: string;
  supplierBillNumber: string;
  subtotal: number;
  inputVatTotal: number;
  grandTotal: number;
  postedJournalId: string;
  status: 'POSTED';
}

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseBill)
    private readonly billRepository: Repository<PurchaseBill>,
    @InjectRepository(PurchaseBillLine)
    private readonly billLineRepository: Repository<PurchaseBillLine>,
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly vatCalculatorService: VatCalculatorService,
    private readonly inventoryService: InventoryService,
    private readonly sequenceService: SequenceService,
  ) {}

  async getPurchaseBills(tenantId: string): Promise<PurchaseBill[]> {
    return this.billRepository.find({
      where: { tenantId },
      relations: ['lines', 'supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Post Purchase Bill from Supplier with Input VAT calculation and double-entry ledger posting.
   * Increments stock levels and cost price (WAC) for catalogue items.
   */
  async postPurchaseBill(input: CreatePurchaseBillInput): Promise<PurchaseBillResult> {
    if (!input.lines || input.lines.length === 0) {
      throw new BadRequestException('Purchase Bill must contain at least one line item.');
    }

    // Validate supplier
    const supplier = await this.partyRepository.findOne({
      where: { tenantId: input.tenantId, id: input.supplierId },
    });
    if (!supplier) {
      throw new BadRequestException(`Supplier with ID ${input.supplierId} not found.`);
    }

    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(input.lines.map(line => ({
      unitPrice: Number(line.unitPrice),
      quantity: Number(line.quantity),
      vatCategory: line.vatCategory,
    })));

    // Generate atomic sequence number
    const billNumber = await this.sequenceService.getNextSequence(input.tenantId, 'PURCHASE_BILL', 'BILL');

    return this.billRepository.manager.transaction(async (transactionalEntityManager) => {
      // Create and save PurchaseBill
      const bill = this.billRepository.create({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        billNumber,
        supplierBillNumber: input.supplierBillNumber,
        supplierId: input.supplierId,
        billDate: input.billDate ? new Date(input.billDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        currency: 'AED',
        status: PurchaseBillStatus.POSTED,
        subtotal: taxSummary.subtotal,
        vatTotal: taxSummary.totalVat,
        grandTotal: taxSummary.grandTotal,
        paidAmount: 0,
      });

      const savedBill = await transactionalEntityManager.save(bill);

      // Create lines and update inventory stock (cost WAC adjustment)
      const lines: PurchaseBillLine[] = [];
      for (let idx = 0; idx < input.lines.length; idx++) {
        const lineInput = input.lines[idx];
        const calcLine = taxSummary.lines[idx];

        const line = this.billLineRepository.create({
          billId: savedBill.id,
          itemId: lineInput.itemId || null,
          description: lineInput.description,
          quantity: lineInput.quantity,
          unitPrice: lineInput.unitPrice,
          vatCategory: lineInput.vatCategory,
          taxableAmount: calcLine.taxableAmount,
          vatAmount: calcLine.vatAmount,
          lineTotal: calcLine.lineTotal,
        });
        const savedLine = await transactionalEntityManager.save(line);
        lines.push(savedLine);

        // Increment inventory stock & update Weighted Average Cost
        if (lineInput.itemId) {
          try {
            let warehouseId = input.warehouseId;
            if (!warehouseId) {
              const warehouses = await this.inventoryService.getWarehouses(input.tenantId);
              if (warehouses && warehouses.length > 0) {
                warehouseId = warehouses[0].id;
              }
            }

            await this.inventoryService.recordStockMovement(
              input.tenantId,
              lineInput.itemId,
              warehouseId,
              Number(lineInput.quantity), // positive quantity increases stock
              StockMovementType.PURCHASE,
              savedBill.id,
              'PURCHASE_BILL',
              Number(lineInput.unitPrice), // cost price to calculate WAC
            );
          } catch (stockError) {
            // Log warning but let bill post proceed
            console.error(`Failed to record stock movement for purchased item [${lineInput.itemId}]:`, stockError.message);
          }
        }
      }

      savedBill.lines = lines;

      // Post double-entry journal entry for purchase bill
      const journalResult = await this.ledgerPostingService.postJournal({
        tenantId: input.tenantId,
        branchId: input.branchId,
        sourceDocumentId: savedBill.id,
        sourceDocumentType: 'PURCHASE_BILL',
        postingDate: savedBill.billDate,
        narration: `Purchase Bill ${savedBill.supplierBillNumber} from ${supplier.name}`,
        lines: [
          {
            accountId: 'acc-purchase-expense-5000',
            accountCode: '5000',
            debit: savedBill.subtotal,
            credit: 0,
            description: `Purchase cost for ${savedBill.supplierBillNumber}`,
          },
          {
            accountId: 'acc-input-vat-2160',
            accountCode: '2160',
            debit: savedBill.vatTotal,
            credit: 0,
            description: `Recoverable Input VAT (5%) for ${savedBill.supplierBillNumber}`,
          },
          {
            accountId: 'acc-payable-2100',
            accountCode: '2100',
            debit: 0,
            credit: savedBill.grandTotal,
            description: `Accounts Payable to supplier ${supplier.name}`,
          },
        ],
      });

      return {
        billId: savedBill.id,
        billNumber: savedBill.billNumber,
        supplierBillNumber: savedBill.supplierBillNumber,
        subtotal: savedBill.subtotal,
        inputVatTotal: savedBill.vatTotal,
        grandTotal: savedBill.grandTotal,
        postedJournalId: journalResult.journalId,
        status: 'POSTED',
      };
    });
  }
}
