import { Test, TestingModule } from '@nestjs/testing';
import { TaxController } from './tax.controller';
import { VatCalculatorService } from './vat-calculator.service';
import { EInvoicingService } from './e-invoicing.service';

describe('TaxController', () => {
  let controller: TaxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxController],
      providers: [VatCalculatorService, EInvoicingService],
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
