import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { ItemsController } from './items.controller';
import { InventoryService } from './inventory.service';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [InventoryController, ItemsController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
