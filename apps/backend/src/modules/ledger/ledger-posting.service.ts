import { Injectable, BadRequestException } from '@nestjs/common';

export interface JournalLineInput {
  accountId: string;
  accountCode: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface PostJournalEntryInput {
  tenantId: string;
  branchId?: string;
  sourceDocumentId: string;
  sourceDocumentType: 'SALES_INVOICE' | 'RECEIPT' | 'PURCHASE_BILL' | 'SUPPLIER_PAYMENT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'INVENTORY_ADJUSTMENT' | 'MANUAL_JOURNAL';
  postingDate: Date;
  narration: string;
  lines: JournalLineInput[];
}

export interface PostedJournalResult {
  journalId: string;
  tenantId: string;
  postingDate: Date;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'POSTED';
}

@Injectable()
export class LedgerPostingService {
  /**
   * Validate and post balanced double-entry journal records.
   * Enforces sum(debit) === sum(credit) with exact decimal rounding.
   */
  async postJournal(input: PostJournalEntryInput): Promise<PostedJournalResult> {
    if (!input.lines || input.lines.length < 2) {
      throw new BadRequestException('A valid journal entry requires at least two lines (one debit, one credit).');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new BadRequestException('Debit and credit amounts cannot be negative.');
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('A journal line cannot contain both debit and credit amounts.');
      }

      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    totalDebit = Number(totalDebit.toFixed(2));
    totalCredit = Number(totalCredit.toFixed(2));

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    if (!isBalanced) {
      throw new BadRequestException(
        `Journal entry is out of balance! Total Debits (${totalDebit} AED) must equal Total Credits (${totalCredit} AED).`,
      );
    }

    const journalId = `JRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return {
      journalId,
      tenantId: input.tenantId,
      postingDate: input.postingDate,
      totalDebit,
      totalCredit,
      isBalanced: true,
      status: 'POSTED',
    };
  }
}
