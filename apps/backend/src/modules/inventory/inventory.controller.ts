import { Controller, Post, Get, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { InventoryService, StockTransferInput, StockAdjustmentInput } from './inventory.service';
import { VatCategory } from '../tax/vat-calculator.service';

export interface CreateItemDto {
  name: string;
  sku: string;
  barcode?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  vatCategory: VatCategory;
}

@ApiTags('Inventory Management & Items')
@Controller('inventory')
export class InventoryController {
  private itemsStore: any[] = [];

  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: 'List item catalogue & stock levels' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getItems(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.itemsStore.filter((i) => i.tenantId === tenantId || tenantId === 'tenant-default');
  }

  @Post('items')
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createItem(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreateItemDto,
  ) {
    const newItem = {
      id: `itm-${Date.now()}`,
      tenantId,
      ...dto,
      createdAt: new Date().toISOString(),
    };
    this.itemsStore.push(newItem);
    return newItem;
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async transferStock(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: Omit<StockTransferInput, 'tenantId'>,
  ) {
    return this.inventoryService.transferStock({
      ...dto,
      tenantId,
    });
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Record inventory adjustment loss & post journal' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async adjustStock(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: Omit<StockAdjustmentInput, 'tenantId'>,
  ) {
    return this.inventoryService.adjustStockLoss({
      ...dto,
      tenantId,
    });
  }
}
