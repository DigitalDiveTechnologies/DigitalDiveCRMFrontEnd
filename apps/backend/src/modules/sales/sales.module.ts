import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { PartiesController } from './parties.controller';
import { ReceiptsService } from './receipts.service';
import { CreditNoteService } from './credit-note.service';
import { PartiesService } from './parties.service';
import { SalesInvoicesService } from './sales-invoices.service';
import { LedgerModule } from '../ledger/ledger.module';
import { TaxModule } from '../tax/tax.module';
import { EmailModule } from '../email/email.module';
import { InventoryModule } from '../inventory/inventory.module';
import { Party } from '../../database/entities/party.entity';
import { SalesInvoice } from '../../database/entities/sales-invoice.entity';
import { SalesInvoiceLine } from '../../database/entities/sales-invoice-line.entity';
import { Receipt } from '../../database/entities/receipt.entity';
import { CreditNote } from '../../database/entities/credit-note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Party, SalesInvoice, SalesInvoiceLine, Receipt, CreditNote]),
    LedgerModule,
    TaxModule,
    EmailModule,
    InventoryModule,
  ],
  controllers: [SalesController, PartiesController],
  providers: [ReceiptsService, CreditNoteService, PartiesService, SalesInvoicesService],
  exports: [ReceiptsService, CreditNoteService, PartiesService, SalesInvoicesService],
})
export class SalesModule {}
