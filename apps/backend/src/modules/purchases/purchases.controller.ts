import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PurchasesService, CreatePurchaseBillInput } from './purchases.service';

@ApiTags('Purchases & Supplier Payables')
@Controller('purchase-bills')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Post a purchase bill from supplier with input VAT' })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant UUID' })
  async postPurchaseBill(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: any,
  ) {
    return this.purchasesService.postPurchaseBill({
      ...dto,
      tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List purchase bills' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getPurchaseBills(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.purchasesService.getPurchaseBills(tenantId);
  }
}
