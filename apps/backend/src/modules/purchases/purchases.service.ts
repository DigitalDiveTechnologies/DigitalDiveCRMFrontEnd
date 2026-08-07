import { Injectable, BadRequestException } from '@nestjs/common';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

export interface PurchaseBillLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatCategory: VatCategory;
}

export interface CreatePurchaseBillInput {
  tenantId: string;
  branchId?: string;
  supplierId: string;
  supplierName: string;
  supplierBillNumber: string;
  billDate: Date;
  dueDate?: Date;
  lines: PurchaseBillLineInput[];
}

export interface PurchaseBillResult {
  billId: string;
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
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly vatCalculatorService: VatCalculatorService,
  ) {}

  /**
   * Post Purchase Bill from Supplier with Input VAT calculation and double-entry ledger posting.
   * Debit: Inventory / Expense (5000) + Input VAT Recoverable (2160)
   * Credit: Accounts Payable (2100)
   */
  async postPurchaseBill(input: CreatePurchaseBillInput): Promise<PurchaseBillResult> {
    if (!input.lines || input.lines.length === 0) {
      throw new BadRequestException('Purchase Bill must contain at least one line item.');
    }

    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(input.lines);
    const billId = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const journalResult = await this.ledgerPostingService.postJournal({
      tenantId: input.tenantId,
      branchId: input.branchId,
      sourceDocumentId: billId,
      sourceDocumentType: 'PURCHASE_BILL',
      postingDate: input.billDate,
      narration: `Purchase Bill ${input.supplierBillNumber} from ${input.supplierName}`,
      lines: [
        {
          accountId: 'acc-purchase-expense-5000',
          accountCode: '5000',
          debit: taxSummary.subtotal,
          credit: 0,
          description: `Purchase Cost for ${input.supplierBillNumber}`,
        },
        {
          accountId: 'acc-input-vat-2160',
          accountCode: '2160',
          debit: taxSummary.totalVat,
          credit: 0,
          description: `Recoverable Input VAT (5%) for ${input.supplierBillNumber}`,
        },
        {
          accountId: 'acc-payable-2100',
          accountCode: '2100',
          debit: 0,
          credit: taxSummary.grandTotal,
          description: `Accounts Payable to ${input.supplierName}`,
        },
      ],
    });

    return {
      billId,
      supplierBillNumber: input.supplierBillNumber,
      subtotal: taxSummary.subtotal,
      inputVatTotal: taxSummary.totalVat,
      grandTotal: taxSummary.grandTotal,
      postedJournalId: journalResult.journalId,
      status: 'POSTED',
    };
  }
}
