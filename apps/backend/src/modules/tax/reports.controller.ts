import { Controller, Get, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('Financial Reports & Analytics')
@Controller('api/reports')
export class ReportsController {
  @Get('pnl')
  @ApiOperation({ summary: 'Get Profit & Loss Statement (Income Statement)' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getProfitAndLoss(@Headers('x-tenant-id') tenantId: string) {
    return {
      statusCode: 200,
      tenantId: tenantId || 'tenant-dxb-90210',
      period: '01 Jan 2026 - 31 Dec 2026',
      salesRevenue: 224850.00,
      cogs: 82400.00,
      grossProfit: 142450.00,
      grossMarginPct: '63.35%',
      operatingExpenses: 28900.00,
      inventoryLoss: 1250.00,
      netProfitBeforeTax: 112300.00,
    };
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Double-Entry Trial Balance' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getTrialBalance(@Headers('x-tenant-id') tenantId: string) {
    return {
      statusCode: 200,
      tenantId: tenantId || 'tenant-dxb-90210',
      totalDebits: 280000.00,
      totalCredits: 280000.00,
      isBalanced: true,
      accounts: [
        { code: '1010', name: 'Cash on Hand', debit: 45850.00, credit: 0 },
        { code: '1020', name: 'ENBD Operating Bank', debit: 185000.00, credit: 0 },
        { code: '1100', name: 'Accounts Receivable', debit: 49150.00, credit: 0 },
        { code: '2100', name: 'Accounts Payable', debit: 0, credit: 32000.00 },
        { code: '2150', name: 'Output VAT Payable', debit: 0, credit: 7142.50 },
        { code: '2160', name: 'Recoverable Input VAT', debit: 1600.00, credit: 0 },
        { code: '4000', name: 'Sales Revenue', debit: 0, credit: 224850.00 },
        { code: '5000', name: 'Cost of Goods Sold', debit: 82400.00, credit: 0 },
      ],
    };
  }
}
