import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { ItemsController } from './items.controller';
import { InventoryService } from './inventory.service';
import { LedgerModule } from '../ledger/ledger.module';
import { Item } from '../../database/entities/item.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { StockMovement } from '../../database/entities/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, Warehouse, StockMovement]),
    LedgerModule,
  ],
  controllers: [InventoryController, ItemsController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
