import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { VatCalculatorService } from './vat-calculator.service';
import { EInvoicingService } from './e-invoicing.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

@ApiTags('Tax & E-Invoicing')
@Controller('tax')
export class TaxController {
  constructor(
    private readonly vatCalculatorService: VatCalculatorService,
    private readonly eInvoicingService: EInvoicingService,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate 5% UAE VAT and line totals' })
  async calculateTax(@Body() items: any[]) {
    return this.vatCalculatorService.calculateInvoiceTax(items);
  }

  @Post('einvoices/submit')
  @ApiOperation({ summary: 'Generate UBL 2.1 E-Invoice XML, SHA-256 hash & submit to ASP' })
  async submitEInvoice(@Body() dto: any) {
    return this.eInvoicingService.submitEInvoice(dto);
  }

  @Get('vat-201')
  @ApiOperation({ summary: 'Get UAE FTA Form VAT 201 return report summary dynamically from ledger' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getVat201Return(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    const pl = await this.ledgerPostingService.getProfitLoss(tenantId);
    
    // Output VAT is naturally credited, so let's find Output VAT (2150) and Input VAT (2160) balances
    const trialBalance = await this.ledgerPostingService.getTrialBalance(tenantId);
    
    const outputVatAccount = trialBalance.accounts.find(a => a.code === '2150');
    const inputVatAccount = trialBalance.accounts.find(a => a.code === '2160');
    const salesAccount = trialBalance.accounts.find(a => a.code === '4000');
    const purchaseAccount = trialBalance.accounts.find(a => a.code === '5000');

    const outputVatVal = outputVatAccount ? Number(outputVatAccount.credit - outputVatAccount.debit) : 0;
    const inputVatVal = inputVatAccount ? Number(inputVatAccount.debit - inputVatAccount.credit) : 0;
    const salesVal = salesAccount ? Number(salesAccount.credit - salesAccount.debit) : 0;
    const purchaseVal = purchaseAccount ? Number(purchaseAccount.debit - purchaseAccount.credit) : 0;

    const totalVatDue = Number(outputVatVal.toFixed(2));
    const totalVatRecoverable = Number(inputVatVal.toFixed(2));
    const netVatPayable = Number((totalVatDue - totalVatRecoverable).toFixed(2));

    return {
      tenantId,
      taxPeriod: '2026-Q3',
      trn: '100293847500003',
      boxes: {
        box1_standardRatedSales: { amount: Number(salesVal.toFixed(2)), vatAmount: totalVatDue },
        box2_zeroRatedSales: { amount: 0.0, vatAmount: 0.0 },
        box3_exemptSales: { amount: 0.0, vatAmount: 0.0 },
        box9_standardRatedPurchases: { amount: Number(purchaseVal.toFixed(2)), vatAmount: totalVatRecoverable },
        box12_totalVatDue: totalVatDue,
        box13_totalVatRecoverable: totalVatRecoverable,
        box14_netVatPayable: netVatPayable,
      },
      status: 'VERIFIED',
    };
  }
}
