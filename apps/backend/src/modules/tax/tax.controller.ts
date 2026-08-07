import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { VatCalculatorService, TaxLineInput } from './vat-calculator.service';
import { EInvoicingService, EInvoicePayloadInput } from './e-invoicing.service';

@ApiTags('UAE VAT & E-Invoicing')
@Controller('tax')
export class TaxController {
  constructor(
    private readonly vatCalculatorService: VatCalculatorService,
    private readonly eInvoicingService: EInvoicingService,
  ) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate 5% UAE VAT and line totals' })
  async calculateTax(@Body() items: TaxLineInput[]) {
    return this.vatCalculatorService.calculateInvoiceTax(items);
  }

  @Post('einvoices/submit')
  @ApiOperation({ summary: 'Generate UBL 2.1 E-Invoice XML, SHA-256 hash & submit to ASP' })
  async submitEInvoice(@Body() dto: EInvoicePayloadInput) {
    return this.eInvoicingService.submitEInvoice(dto);
  }

  @Get('vat-201')
  @ApiOperation({ summary: 'Get UAE FTA Form VAT 201 return report summary' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getVat201Return(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return {
      tenantId,
      taxPeriod: '2026-Q3',
      trn: '100293847500003',
      boxes: {
        box1_standardRatedSales: { amount: 142850.0, vatAmount: 7142.50 },
        box2_zeroRatedSales: { amount: 0.0, vatAmount: 0.0 },
        box3_exemptSales: { amount: 0.0, vatAmount: 0.0 },
        box9_standardRatedPurchases: { amount: 50000.0, vatAmount: 2500.0 },
        box12_totalVatDue: 7142.50,
        box13_totalVatRecoverable: 2500.0,
        box14_netVatPayable: 4642.50,
      },
      status: 'VERIFIED',
    };
  }
}
