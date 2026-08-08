import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditNote } from '../../database/entities/credit-note.entity';
import { SalesInvoice } from '../../database/entities/sales-invoice.entity';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { SequenceService } from '../ledger/sequence.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

export interface CreateCreditNoteInput {
  tenantId: string;
  branchId?: string;
  originalInvoiceId: string;
  reason: string;
  returnedItems: {
    unitPrice: number;
    quantity: number;
    vatCategory: VatCategory;
  }[];
}

export interface CreditNoteResult {
  creditNoteId: string;
  creditNoteNumber: string;
  originalInvoiceId: string;
  subtotal: number;
  vatAmount: number;
  totalRefundAmount: number;
  postedReversalJournalId: string;
}

@Injectable()
export class CreditNoteService {
  constructor(
    @InjectRepository(CreditNote)
    private readonly creditNoteRepository: Repository<CreditNote>,
    @InjectRepository(SalesInvoice)
    private readonly invoiceRepository: Repository<SalesInvoice>,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly sequenceService: SequenceService,
    private readonly vatCalculatorService: VatCalculatorService,
  ) {}

  async getCreditNotes(tenantId: string): Promise<CreditNote[]> {
    return this.creditNoteRepository.find({
      where: { tenantId },
      relations: ['originalInvoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async issueCreditNote(input: CreateCreditNoteInput): Promise<CreditNoteResult> {
    if (!input.returnedItems || input.returnedItems.length === 0) {
      throw new BadRequestException('Credit Note must contain at least one returned item.');
    }

    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(input.returnedItems);

    return this.creditNoteRepository.manager.transaction(async (transactionalEntityManager) => {
      const invoice = await transactionalEntityManager.findOne(SalesInvoice, {
        where: { tenantId: input.tenantId, id: input.originalInvoiceId },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${input.originalInvoiceId} not found.`);
      }

      // Generate sequence number
      const creditNoteNumber = await this.sequenceService.getNextSequence(input.tenantId, 'CREDIT_NOTE', 'CN');

      // Create credit note
      const creditNote = this.creditNoteRepository.create({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        creditNoteNumber,
        originalInvoiceId: input.originalInvoiceId,
        reason: input.reason,
        subtotal: taxSummary.subtotal,
        vatTotal: taxSummary.totalVat,
        grandTotal: taxSummary.grandTotal,
        status: 'POSTED',
      });

      const savedCreditNote = await transactionalEntityManager.save(creditNote);

      // Reversal journal lines:
      // Debit: Sales Returns (4010) + Output VAT Adjustment (2150)
      // Credit: Accounts Receivable (1100)
      const journalResult = await this.ledgerPostingService.postJournal({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        sourceDocumentId: savedCreditNote.id,
        sourceDocumentType: 'CREDIT_NOTE',
        postingDate: new Date(),
        narration: `Credit Note ${savedCreditNote.creditNoteNumber} issued for Invoice ${invoice.invoiceNumber}. Reason: ${input.reason}`,
        lines: [
          {
            accountId: 'acc-sales-returns-4010',
            accountCode: '4010',
            debit: taxSummary.subtotal,
            credit: 0,
            description: `Sales Return adjustment for invoice ${invoice.invoiceNumber}`,
          },
          {
            accountId: 'acc-output-vat-2150',
            accountCode: '2150',
            debit: taxSummary.totalVat,
            credit: 0,
            description: `VAT Output adjustment for invoice ${invoice.invoiceNumber}`,
          },
          {
            accountId: 'acc-receivable-1100',
            accountCode: '1100',
            debit: 0,
            credit: taxSummary.grandTotal,
            description: `Accounts Receivable reduction for invoice ${invoice.invoiceNumber}`,
          },
        ],
      });

      return {
        creditNoteId: savedCreditNote.id,
        creditNoteNumber: savedCreditNote.creditNoteNumber,
        originalInvoiceId: savedCreditNote.originalInvoiceId,
        subtotal: taxSummary.subtotal,
        vatAmount: taxSummary.totalVat,
        totalRefundAmount: taxSummary.grandTotal,
        postedReversalJournalId: journalResult.journalId,
      };
    });
  }
}
