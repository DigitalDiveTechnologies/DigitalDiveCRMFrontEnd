import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { LedgerModule } from '../ledger/ledger.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [LedgerModule, TaxModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
