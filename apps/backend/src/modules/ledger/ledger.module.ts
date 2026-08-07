import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerPostingService } from './ledger-posting.service';

@Module({
  controllers: [LedgerController],
  providers: [LedgerPostingService],
  exports: [LedgerPostingService],
})
export class LedgerModule {}
