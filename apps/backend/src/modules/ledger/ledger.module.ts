import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerController } from './ledger.controller';
import { LedgerPostingService } from './ledger-posting.service';
import { SequenceService } from './sequence.service';
import { Sequence } from '../../database/entities/sequence.entity';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { JournalLine } from '../../database/entities/journal-line.entity';
import { Account } from '../../database/entities/account.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sequence, JournalEntry, JournalLine, Account]),
  ],
  controllers: [LedgerController],
  providers: [LedgerPostingService, SequenceService],
  exports: [LedgerPostingService, SequenceService],
})
export class LedgerModule {}
