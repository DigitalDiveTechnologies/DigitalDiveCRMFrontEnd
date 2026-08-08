import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { JournalLine } from '../../database/entities/journal-line.entity';
import { Account, AccountType } from '../../database/entities/account.entity';
import { SequenceService } from './sequence.service';

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
  constructor(
    @InjectRepository(JournalEntry)
    private readonly journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly journalLineRepository: Repository<JournalLine>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly sequenceService: SequenceService,
  ) {}

  /**
   * Validate and post balanced double-entry journal records in the database.
   * Enforces sum(debit) === sum(credit) with exact decimal rounding.
   * Updates associated account balances dynamically.
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

      totalDebit += Number(line.debit);
      totalCredit += Number(line.credit);
    }

    totalDebit = Number(totalDebit.toFixed(2));
    totalCredit = Number(totalCredit.toFixed(2));

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    if (!isBalanced) {
      throw new BadRequestException(
        `Journal entry is out of balance! Total Debits (${totalDebit} AED) must equal Total Credits (${totalCredit} AED).`,
      );
    }

    // Run within a transaction to maintain consistency
    return this.journalEntryRepository.manager.transaction(async (transactionalEntityManager) => {
      // Generate sequential journal number
      const sequenceNumber = await this.sequenceService.getNextSequence(input.tenantId, 'JOURNAL_ENTRY', 'JRN');

      // Create and save entry
      const entry = this.journalEntryRepository.create({
        tenantId: input.tenantId,
        branchId: input.branchId || null,
        sourceDocumentId: input.sourceDocumentId,
        sourceDocumentType: input.sourceDocumentType,
        postingDate: input.postingDate ? new Date(input.postingDate) : new Date(),
        narration: input.narration,
        totalDebit,
        totalCredit,
        isPosted: true,
      });

      const savedEntry = await transactionalEntityManager.save(entry);

      // Create and save lines, update accounts
      for (const lineInput of input.lines) {
        // Find account (using repository within transaction)
        let account = await transactionalEntityManager.findOne(Account, {
          where: { tenantId: input.tenantId, code: lineInput.accountCode },
        });

        // Seed account if missing (simple auto-seeding for development/testing safety)
        if (!account) {
          let type = AccountType.EXPENSE;
          if (lineInput.accountCode.startsWith('1')) type = AccountType.ASSET;
          if (lineInput.accountCode.startsWith('2')) type = AccountType.LIABILITY;
          if (lineInput.accountCode.startsWith('3')) type = AccountType.EQUITY;
          if (lineInput.accountCode.startsWith('4')) type = AccountType.REVENUE;

          account = transactionalEntityManager.create(Account, {
            tenantId: input.tenantId,
            code: lineInput.accountCode,
            name: lineInput.description || `Account ${lineInput.accountCode}`,
            accountType: type,
            currentBalance: 0,
            isSystemAccount: true,
            isActive: true,
          });
          account = await transactionalEntityManager.save(account);
        }

        // Create line
        const journalLine = this.journalLineRepository.create({
          journalEntryId: savedEntry.id,
          accountId: account.id,
          accountCode: lineInput.accountCode,
          debit: lineInput.debit,
          credit: lineInput.credit,
          description: lineInput.description || null,
        });
        await transactionalEntityManager.save(journalLine);

        // Update balance:
        // Asset & Expense: Debit increases (+), Credit decreases (-)
        // Liability, Equity, Revenue: Credit increases (+), Debit decreases (-)
        const debitAmt = Number(lineInput.debit);
        const creditAmt = Number(lineInput.credit);
        let balanceChange = 0;

        if (account.accountType === AccountType.ASSET || account.accountType === AccountType.EXPENSE) {
          balanceChange = debitAmt - creditAmt;
        } else {
          balanceChange = creditAmt - debitAmt;
        }

        account.currentBalance = Number((Number(account.currentBalance) + balanceChange).toFixed(2));
        await transactionalEntityManager.save(account);
      }

      return {
        journalId: savedEntry.id,
        tenantId: input.tenantId,
        postingDate: savedEntry.postingDate,
        totalDebit,
        totalCredit,
        isBalanced: true,
        status: 'POSTED',
      };
    });
  }

  async getJournals(tenantId: string): Promise<JournalEntry[]> {
    return this.journalEntryRepository.find({
      where: { tenantId },
      relations: ['lines', 'lines.account'],
      order: { postingDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTrialBalance(tenantId: string) {
    const accounts = await this.accountRepository.find({
      where: { tenantId, isActive: true },
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const formattedAccounts = accounts.map((acc) => {
      const bal = Number(acc.currentBalance);
      let debit = 0;
      let credit = 0;

      if (acc.accountType === AccountType.ASSET || acc.accountType === AccountType.EXPENSE) {
        if (bal >= 0) {
          debit = bal;
        } else {
          credit = Math.abs(bal);
        }
      } else {
        if (bal >= 0) {
          credit = bal;
        } else {
          debit = Math.abs(bal);
        }
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        code: acc.code,
        name: acc.name,
        debit,
        credit,
      };
    });

    return {
      tenantId,
      asOfDate: new Date().toISOString(),
      currency: 'AED',
      accounts: formattedAccounts,
      totalDebit: Number(totalDebit.toFixed(2)),
      totalCredit: Number(totalCredit.toFixed(2)),
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  async getProfitLoss(tenantId: string) {
    const accounts = await this.accountRepository.find({
      where: { tenantId, isActive: true },
    });

    let grossSalesRevenue = 0;
    let costOfGoodsSold = 0;
    let operatingExpenses = 0;

    for (const acc of accounts) {
      const bal = Number(acc.currentBalance);
      if (acc.accountType === AccountType.REVENUE) {
        grossSalesRevenue += bal;
      } else if (acc.accountType === AccountType.EXPENSE) {
        if (acc.code === '5000' || acc.code.startsWith('505')) {
          costOfGoodsSold += bal;
        } else {
          operatingExpenses += bal;
        }
      }
    }

    const grossProfit = grossSalesRevenue - costOfGoodsSold;
    const netProfit = grossProfit - operatingExpenses;

    return {
      tenantId,
      currency: 'AED',
      grossSalesRevenue: Number(grossSalesRevenue.toFixed(2)),
      costOfGoodsSold: Number(costOfGoodsSold.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      operatingExpenses: Number(operatingExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
    };
  }

  async getBalanceSheet(tenantId: string) {
    const accounts = await this.accountRepository.find({
      where: { tenantId, isActive: true },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const acc of accounts) {
      const bal = Number(acc.currentBalance);
      if (acc.accountType === AccountType.ASSET) {
        totalAssets += bal;
      } else if (acc.accountType === AccountType.LIABILITY) {
        totalLiabilities += bal;
      } else if (acc.accountType === AccountType.EQUITY) {
        totalEquity += bal;
      }
    }

    const pl = await this.getProfitLoss(tenantId);
    const retainedEarnings = pl.netProfit;
    const finalEquity = totalEquity + retainedEarnings;

    return {
      tenantId,
      currency: 'AED',
      totalAssets: Number(totalAssets.toFixed(2)),
      totalLiabilities: Number(totalLiabilities.toFixed(2)),
      totalEquity: Number(finalEquity.toFixed(2)),
      isEquationBalanced: Math.abs(totalAssets - (totalLiabilities + finalEquity)) < 0.01,
    };
  }
}
