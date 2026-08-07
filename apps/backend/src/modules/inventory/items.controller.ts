import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

@ApiTags('Item Catalogue')
@Controller('api/items')
export class ItemsController {
  @Get()
  @ApiOperation({ summary: 'Get catalogue of inventory items with UAE VAT categories' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getItems(@Headers('x-tenant-id') tenantId: string) {
    return {
      statusCode: 200,
      tenantId: tenantId || 'tenant-dxb-90210',
      data: [
        { id: '1', sku: 'PRN-80-ESC', name: 'POS Thermal Printer 80mm ESC/POS', category: 'Hardware', vatCategory: 'STANDARD_5', unitPrice: 450.00, stockOnHand: 142 },
        { id: '2', sku: 'SCN-BT-2D', name: 'Barcode Scanner Handheld USB/BT', category: 'Hardware', vatCategory: 'STANDARD_5', unitPrice: 220.00, stockOnHand: 89 },
        { id: '3', sku: 'PPR-8080-BOX', name: 'Paper Thermal Roll 80x80 Box', category: 'Supplies', vatCategory: 'STANDARD_5', unitPrice: 120.00, stockOnHand: 510 },
        { id: '4', sku: 'LIC-SW-INT', name: 'International Software Export License', category: 'Software', vatCategory: 'ZERO_0', unitPrice: 2500.00, stockOnHand: 999 },
      ],
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item in catalogue' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createItem(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { sku: string; name: string; category: string; vatCategory: 'STANDARD_5' | 'ZERO_0' | 'EXEMPT'; unitPrice: number; initialStock?: number },
  ) {
    return {
      statusCode: 201,
      message: 'Catalogue item successfully created.',
      tenantId: tenantId || 'tenant-dxb-90210',
      item: {
        id: `itm-${Date.now()}`,
        sku: body.sku,
        name: body.name,
        category: body.category || 'General',
        vatCategory: body.vatCategory || 'STANDARD_5',
        unitPrice: body.unitPrice,
        stockOnHand: body.initialStock || 0,
      },
    };
  }
}
