import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from '../../database/entities/receipt.entity';
import { SalesInvoice, InvoiceStatus } from '../../database/entities/sales-invoice.entity';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { SequenceService } from '../ledger/sequence.service';

export interface CreateReceiptInput {
  tenantId: string;
  branchId?: string;
  invoiceId: string;
  paymentAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHEQUE';
  paymentDate: Date;
  referenceNumber?: string;
  narration?: string;
}

export interface ReceiptResult {
  receiptId: string;
  receiptNumber: string;
  invoiceId: string;
  paymentAmount: number;
  remainingBalance: number;
  newInvoiceStatus: 'PARTIALLY_PAID' | 'PAID';
  postedJournalId: string;
}

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(SalesInvoice)
    private readonly invoiceRepository: Repository<SalesInvoice>,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly sequenceService: SequenceService,
  ) {}

  async getReceipts(tenantId: string): Promise<Receipt[]> {
    return this.receiptRepository.find({
      where: { tenantId },
      relations: ['invoice'],
      order: { createdAt: 'DESC' },
    });
  }

  async processPaymentReceipt(input: CreateReceiptInput): Promise<ReceiptResult> {
    if (input.paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    // Wrap in transaction for database consistency
    return this.receiptRepository.manager.transaction(async (transactionalEntityManager) => {
      const invoice = await transactionalEntityManager.findOne(SalesInvoice, {
        where: { tenantId: input.tenantId, id: input.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${input.invoiceId} not found.`);
      }

      const existingPaidAmount = Number(invoice.paidAmount || 0);
      const invoiceTotalAmount = Number(invoice.grandTotal);
      const currentBalance = Number((invoiceTotalAmount - existingPaidAmount).toFixed(2));

      if (input.paymentAmount > currentBalance) {
        throw new BadRequestException(
          `Payment amount (${input.paymentAmount} AED) exceeds outstanding invoice balance (${currentBalance} AED).`,
        );
      }

      const newPaidTotal = Number((existingPaidAmount + input.paymentAmount).toFixed(2));
      const remainingBalance = Number((invoiceTotalAmount - newPaidTotal).toFixed(2));
      const newInvoiceStatus = remainingBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      // Update invoice
      invoice.paidAmount = newPaidTotal;
      invoice.status = newInvoiceStatus;
      await transactionalEntityManager.save(invoice);

      // Generate receipt sequential number
      const receiptNumber = await this.sequenceService.getNextSequence(input.tenantId, 'RECEIPT', 'RCT');

      // Create Receipt
      const receipt = this.receiptRepository.create({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        receiptNumber,
        invoiceId: input.invoiceId,
        amount: input.paymentAmount,
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
        referenceNumber: input.referenceNumber || null,
        narration: input.narration || `Payment allocated to invoice ${invoice.invoiceNumber}`,
      });

      const savedReceipt = await transactionalEntityManager.save(receipt);

      // Post journal entry
      const journalResult = await this.ledgerPostingService.postJournal({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        sourceDocumentId: savedReceipt.id,
        sourceDocumentType: 'RECEIPT',
        postingDate: savedReceipt.paymentDate,
        narration: savedReceipt.narration,
        lines: [
          {
            accountId: input.paymentMethod === 'CASH' ? 'acc-cash-1010' : 'acc-bank-1020',
            accountCode: input.paymentMethod === 'CASH' ? '1010' : '1020',
            debit: input.paymentAmount,
            credit: 0,
            description: `Payment received for invoice ${invoice.invoiceNumber} via ${input.paymentMethod}`,
          },
          {
            accountId: 'acc-receivable-1100',
            accountCode: '1100',
            debit: 0,
            credit: input.paymentAmount,
            description: `Outstanding A/R reduction for invoice ${invoice.invoiceNumber}`,
          },
        ],
      });

      return {
        receiptId: savedReceipt.id,
        receiptNumber: savedReceipt.receiptNumber,
        invoiceId: savedReceipt.invoiceId,
        paymentAmount: savedReceipt.amount,
        remainingBalance,
        newInvoiceStatus: newInvoiceStatus as any,
        postedJournalId: journalResult.journalId,
      };
    });
  }
}
