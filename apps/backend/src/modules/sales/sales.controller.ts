import { Controller, Post, Get, Body, Headers, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { SalesInvoicesService } from './sales-invoices.service';
import { ReceiptsService, CreateReceiptInput } from './receipts.service';
import { CreditNoteService, CreateCreditNoteInput } from './credit-note.service';

@ApiTags('Sales Invoices & Receipts')
@Controller('sales-invoices')
export class SalesController {
  constructor(
    private readonly invoicesService: SalesInvoicesService,
    private readonly receiptsService: ReceiptsService,
    private readonly creditNoteService: CreditNoteService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all posted sales tax invoices' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getSalesInvoices(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.invoicesService.getSalesInvoices(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales tax invoice by ID' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getInvoiceById(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') id: string,
  ) {
    return this.invoicesService.getInvoiceById(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and post a new Sales Invoice with 5% UAE VAT' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async createSalesInvoice(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: any,
  ) {
    return this.invoicesService.createSalesInvoice(tenantId, dto);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Receive payment receipt and allocate to sales invoice' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async receivePayment(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') invoiceId: string,
    @Body() dto: any,
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
    @Body() dto: any,
  ) {
    return this.creditNoteService.issueCreditNote({
      ...dto,
      tenantId,
      originalInvoiceId: invoiceId,
    });
  }
}
