import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { VatCalculatorService } from './vat-calculator.service';
import { EInvoicingService } from './e-invoicing.service';
import { PdfInvoiceService } from './pdf-invoice.service';
import { ThermalPrinterService } from './thermal-printer.service';

@Module({
  controllers: [TaxController],
  providers: [VatCalculatorService, EInvoicingService, PdfInvoiceService, ThermalPrinterService],
  exports: [VatCalculatorService, EInvoicingService, PdfInvoiceService, ThermalPrinterService],
})
export class TaxModule {}

