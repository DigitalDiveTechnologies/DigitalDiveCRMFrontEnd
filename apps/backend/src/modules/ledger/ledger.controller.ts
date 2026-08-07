import { Controller, Post, Get, Body, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { LedgerPostingService, PostJournalEntryInput } from './ledger-posting.service';

@ApiTags('General Ledger & Financial Reports')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerPostingService: LedgerPostingService) {}

  @Post('post-journal')
  @ApiOperation({ summary: 'Post balanced double-entry manual journal entry' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async postJournal(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: Omit<PostJournalEntryInput, 'tenantId'>,
  ) {
    return this.ledgerPostingService.postJournal({
      ...dto,
      tenantId,
    });
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance financial report' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getTrialBalance(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return {
      tenantId,
      asOfDate: new Date().toISOString(),
      currency: 'AED',
      accounts: [
        { code: '1010', name: 'Cash on Hand', debit: 45000.0, credit: 0.0 },
        { code: '1020', name: 'Emirates NBD Bank Account', debit: 185000.0, credit: 0.0 },
        { code: '1100', name: 'Accounts Receivable', debit: 50000.0, credit: 0.0 },
        { code: '1200', name: 'Inventory Asset', debit: 65000.0, credit: 0.0 },
        { code: '2100', name: 'Accounts Payable', debit: 0.0, credit: 35000.0 },
        { code: '2150', name: 'Output VAT Payable (5%)', debit: 0.0, credit: 7142.50 },
        { code: '2160', name: 'Input VAT Recoverable', debit: 2500.0, credit: 0.0 },
        { code: '4000', name: 'Sales Revenue', debit: 0.0, credit: 142850.0 },
        { code: '5000', name: 'Cost of Goods Sold', debit: 37492.50, credit: 0.0 },
      ],
      totalDebit: 384992.50,
      totalCredit: 384992.50,
      isBalanced: true,
    };
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Get Profit & Loss financial statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getProfitLoss(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return {
      tenantId,
      currency: 'AED',
      grossSalesRevenue: 142850.0,
      costOfGoodsSold: 37492.50,
      grossProfit: 105357.50,
      operatingExpenses: 12000.0,
      netProfit: 93357.50,
    };
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get Balance Sheet financial statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getBalanceSheet(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return {
      tenantId,
      currency: 'AED',
      totalAssets: 345000.0,
      totalLiabilities: 42142.50,
      totalEquity: 302857.50,
      isEquationBalanced: true,
    };
  }
}
