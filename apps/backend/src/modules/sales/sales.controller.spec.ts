import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { ReceiptsService } from './receipts.service';
import { CreditNoteService } from './credit-note.service';
import { VatCalculatorService } from '../tax/vat-calculator.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

describe('SalesController', () => {
  let controller: SalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [ReceiptsService, CreditNoteService, VatCalculatorService, LedgerPostingService],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should post a sales invoice with 5% VAT', async () => {
    const result = await controller.createSalesInvoice('tenant-default', {
      customerName: 'Al Serkal Group LLC',
      items: [{ description: 'Consulting Services', quantity: 2, unitPrice: 1000, vatCategory: 'STANDARD_5' as any }],
    });

    expect(result.subtotal).toBe(2000);
    expect(result.totalVat).toBe(100);
    expect(result.grandTotal).toBe(2100);
    expect(result.status).toBe('POSTED');
  });
});
