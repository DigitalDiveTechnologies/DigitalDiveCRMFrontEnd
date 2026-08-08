import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
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

  @Get('journals')
  @ApiOperation({ summary: 'Get list of all posted journal entries' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getJournals(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.ledgerPostingService.getJournals(tenantId);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance financial report' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getTrialBalance(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.ledgerPostingService.getTrialBalance(tenantId);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Get Profit & Loss financial statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getProfitLoss(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.ledgerPostingService.getProfitLoss(tenantId);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get Balance Sheet financial statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getBalanceSheet(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.ledgerPostingService.getBalanceSheet(tenantId);
  }
}
