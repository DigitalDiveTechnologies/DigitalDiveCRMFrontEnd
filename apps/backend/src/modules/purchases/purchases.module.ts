import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { LedgerModule } from '../ledger/ledger.module';
import { TaxModule } from '../tax/tax.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchaseBill } from '../../database/entities/purchase-bill.entity';
import { PurchaseBillLine } from '../../database/entities/purchase-bill-line.entity';
import { Party } from '../../database/entities/party.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseBill, PurchaseBillLine, Party]),
    LedgerModule,
    TaxModule,
    InventoryModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
