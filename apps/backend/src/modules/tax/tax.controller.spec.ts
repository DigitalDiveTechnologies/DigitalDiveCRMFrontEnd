import { Test, TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { VatCalculatorService } from './vat-calculator.service';
import { EInvoicingService } from './e-invoicing.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';

describe('TaxController', () => {
  let controller: TaxController;

  const mockLedgerPostingService = {
    getProfitLoss: jest.fn().mockResolvedValue({ grossSalesRevenue: 142850.0 }),
    getTrialBalance: jest.fn().mockResolvedValue({
      accounts: [
        { code: '2150', credit: 7142.50, debit: 0 },
        { code: '2160', credit: 0, debit: 2500 },
        { code: '4000', credit: 142850.0, debit: 0 },
        { code: '5000', credit: 0, debit: 50000.0 }
      ]
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [
        VatCalculatorService,
        EInvoicingService,
        {
          provide: LedgerPostingService,
          useValue: mockLedgerPostingService,
        },
      ],
    }).compile();

    controller = module.get<TaxController>(TaxController);
  });

  it('should calculate 5% VAT', async () => {
    const res = await controller.calculateTax([
      { unitPrice: 100, quantity: 1, vatCategory: 'STANDARD_5' as any },
    ]);
    expect(res.subtotal).toBe(100);
    expect(res.totalVat).toBe(5);
    expect(res.grandTotal).toBe(105);
  });

  it('should return UAE Form VAT 201 report summary', async () => {
    const res = await controller.getVat201Return('tenant-default');
    expect(res.trn).toBe('100293847500003');
    expect(res.boxes.box14_netVatPayable).toBe(4642.50);
  });
});
