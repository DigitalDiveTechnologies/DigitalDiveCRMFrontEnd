import { Controller, Post, Get, Body, Headers, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ReceiptsService, CreateReceiptInput } from './receipts.service';
import { CreditNoteService, CreateCreditNoteInput } from './credit-note.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

export interface CreateInvoiceDto {
  customerName: string;
  customerTrn?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    vatCategory: VatCategory;
  }[];
}

@ApiTags('Sales Invoices & Receipts')
@Controller('sales-invoices')
export class SalesController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly creditNoteService: CreditNoteService,
    private readonly vatCalculatorService: VatCalculatorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create and post a new Sales Invoice with 5% UAE VAT' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async createSalesInvoice(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreateInvoiceDto,
  ) {
    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(dto.items);
    const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return {
      invoiceId,
      tenantId,
      customerName: dto.customerName,
      customerTrn: dto.customerTrn,
      subtotal: taxSummary.subtotal,
      totalVat: taxSummary.totalVat,
      grandTotal: taxSummary.grandTotal,
      status: 'POSTED',
      issueDate: new Date().toISOString(),
      lines: taxSummary.lines,
    };
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Receive payment receipt and allocate to sales invoice' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async receivePayment(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') invoiceId: string,
    @Body() dto: Omit<CreateReceiptInput, 'tenantId' | 'invoiceId'>,
  ) {
    return this.receiptsService.processPaymentReceipt({
      ...dto,
      tenantId,
      invoiceId,
    });
  }

  @Post(':id/credit-note')
  @ApiOperation({ summary: 'Issue credit note against posted sales invoice' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async issueCreditNote(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') invoiceId: string,
    @Body() dto: Omit<CreateCreditNoteInput, 'tenantId' | 'originalInvoiceId'>,
  ) {
    return this.creditNoteService.issueCreditNote({
      ...dto,
      tenantId,
      originalInvoiceId: invoiceId,
    });
  }
}
