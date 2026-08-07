import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { LedgerModule } from '../ledger/ledger.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [LedgerModule, TaxModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
