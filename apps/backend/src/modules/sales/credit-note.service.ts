import { Injectable, BadRequestException } from '@nestjs/common';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

export interface CreateCreditNoteInput {
  tenantId: string;
  branchId?: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  reason: string;
  returnedItems: {
    unitPrice: number;
    quantity: number;
    vatCategory: VatCategory;
  }[];
}

export interface CreditNoteResult {
  creditNoteId: string;
  originalInvoiceId: string;
  subtotal: number;
  vatAmount: number;
  totalRefundAmount: number;
  postedReversalJournalId: string;
}

@Injectable()
export class CreditNoteService {
  constructor(
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly vatCalculatorService: VatCalculatorService,
  ) {}

  /**
   * Issue a Credit Note against a posted Sales Invoice and post reversal journal.
   */
  async issueCreditNote(input: CreateCreditNoteInput): Promise<CreditNoteResult> {
    if (!input.returnedItems || input.returnedItems.length === 0) {
      throw new BadRequestException('Credit Note must contain at least one returned item.');
    }

    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(input.returnedItems);
    const creditNoteId = `CN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Reversal journal lines:
    // Debit: Sales Returns (4010) + Output VAT Adjustment (2150)
    // Credit: Accounts Receivable (1100)
    const journalResult = await this.ledgerPostingService.postJournal({
      tenantId: input.tenantId,
      branchId: input.branchId,
      sourceDocumentId: creditNoteId,
      sourceDocumentType: 'CREDIT_NOTE',
      postingDate: new Date(),
      narration: `Credit Note ${creditNoteId} issued for Invoice ${input.originalInvoiceNumber}. Reason: ${input.reason}`,
      lines: [
        {
          accountId: 'acc-sales-returns-4010',
          accountCode: '4010',
          debit: taxSummary.subtotal,
          credit: 0,
          description: `Sales Return adjustment for ${input.originalInvoiceNumber}`,
        },
        {
          accountId: 'acc-vat-adjustment-2150',
          accountCode: '2150',
          debit: taxSummary.totalVat,
          credit: 0,
          description: `Output VAT adjustment for ${input.originalInvoiceNumber}`,
        },
        {
          accountId: 'acc-receivable-1100',
          accountCode: '1100',
          debit: 0,
          credit: taxSummary.grandTotal,
          description: `Accounts Receivable credit adjustment for ${input.originalInvoiceNumber}`,
        },
      ],
    });

    return {
      creditNoteId,
      originalInvoiceId: input.originalInvoiceId,
      subtotal: taxSummary.subtotal,
      vatAmount: taxSummary.totalVat,
      totalRefundAmount: taxSummary.grandTotal,
      postedReversalJournalId: journalResult.journalId,
    };
  }
}
