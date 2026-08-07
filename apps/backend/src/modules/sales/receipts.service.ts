import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

export interface CreateReceiptInput {
  tenantId: string;
  branchId?: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotalAmount: number;
  existingPaidAmount: number;
  paymentAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHEQUE';
  paymentDate: Date;
  referenceNumber?: string;
}

export interface ReceiptResult {
  receiptId: string;
  invoiceId: string;
  paymentAmount: number;
  remainingBalance: number;
  newInvoiceStatus: 'PARTIALLY_PAID' | 'PAID';
  postedJournalId: string;
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly ledgerPostingService: LedgerPostingService) {}

  /**
   * Process customer payment receipt and allocate to sales invoice.
   * Generates balanced journal entry: Debit Cash/Bank, Credit Accounts Receivable.
   */
  async processPaymentReceipt(input: CreateReceiptInput): Promise<ReceiptResult> {
    if (input.paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const currentBalance = Number((input.invoiceTotalAmount - input.existingPaidAmount).toFixed(2));

    if (input.paymentAmount > currentBalance) {
      throw new BadRequestException(
        `Payment amount (${input.paymentAmount} AED) exceeds outstanding invoice balance (${currentBalance} AED).`,
      );
    }

    const newPaidTotal = Number((input.existingPaidAmount + input.paymentAmount).toFixed(2));
    const remainingBalance = Number((input.invoiceTotalAmount - newPaidTotal).toFixed(2));
    const newInvoiceStatus = remainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const receiptId = `RCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Post double-entry journal entry for payment receipt
    const journalResult = await this.ledgerPostingService.postJournal({
      tenantId: input.tenantId,
      branchId: input.branchId,
      sourceDocumentId: receiptId,
      sourceDocumentType: 'RECEIPT',
      postingDate: input.paymentDate,
      narration: `Payment receipt allocated to invoice ${input.invoiceNumber} via ${input.paymentMethod}`,
      lines: [
        {
          accountId: input.paymentMethod === 'CASH' ? 'acc-cash-101' : 'acc-bank-102',
          accountCode: input.paymentMethod === 'CASH' ? '1010' : '1020',
          debit: input.paymentAmount,
          credit: 0,
          description: `Cash/Bank received for ${input.invoiceNumber}`,
        },
        {
          accountId: 'acc-receivable-110',
          accountCode: '1100',
          debit: 0,
          credit: input.paymentAmount,
          description: `Accounts Receivable allocation for ${input.invoiceNumber}`,
        },
      ],
    });

    return {
      receiptId,
      invoiceId: input.invoiceId,
      paymentAmount: input.paymentAmount,
      remainingBalance,
      newInvoiceStatus,
      postedJournalId: journalResult.journalId,
    };
  }
}
