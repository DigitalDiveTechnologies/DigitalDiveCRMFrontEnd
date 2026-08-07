import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { PartiesController } from './parties.controller';
import { ReceiptsService } from './receipts.service';
import { CreditNoteService } from './credit-note.service';
import { LedgerModule } from '../ledger/ledger.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [LedgerModule, TaxModule],
  controllers: [SalesController, PartiesController],
  providers: [ReceiptsService, CreditNoteService],
  exports: [ReceiptsService, CreditNoteService],
})
export class SalesModule {}
