import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';

@ApiTags('Item Catalogue')
@Controller('api/items')
export class ItemsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get catalogue of inventory items with UAE VAT categories' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getItems(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    const items = await this.inventoryService.getItems(tenantId);
    return {
      statusCode: 200,
      tenantId,
      data: items,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item in catalogue' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createItem(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() body: any,
  ) {
    const item = await this.inventoryService.createItem(tenantId, body);
    return {
      statusCode: 201,
      message: 'Catalogue item successfully created.',
      tenantId,
      item,
    };
  }
}
