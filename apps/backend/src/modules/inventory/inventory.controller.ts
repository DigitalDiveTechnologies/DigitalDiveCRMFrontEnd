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
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('items')
  @ApiOperation({ summary: 'List item catalogue & stock levels' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getItems(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.inventoryService.getItems(tenantId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createItem(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreateItemDto,
  ) {
    return this.inventoryService.createItem(tenantId, {
      name: dto.name,
      sku: dto.sku,
      barcode: dto.barcode,
      unitPrice: dto.unitPrice,
      purchasePrice: dto.costPrice,
      initialStock: dto.stockQuantity,
      vatCategory: dto.vatCategory,
    });
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'List active warehouses' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getWarehouses(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.inventoryService.getWarehouses(tenantId);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createWarehouse(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: any,
  ) {
    return this.inventoryService.createWarehouse(tenantId, dto);
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
