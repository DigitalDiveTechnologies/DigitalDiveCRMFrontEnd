import { VatCalculatorService, VatCategory } from './vat-calculator.service';

describe('VatCalculatorService', () => {
  let service: VatCalculatorService;

  beforeEach(() => {
    service = new VatCalculatorService();
  });

  it('should correctly calculate 5% UAE VAT for standard line items', () => {
    const result = service.calculateInvoiceTax([
      { unitPrice: 100, quantity: 2, vatCategory: VatCategory.STANDARD }, // Subtotal: 200, VAT: 10
      { unitPrice: 50, quantity: 1, vatCategory: VatCategory.STANDARD },  // Subtotal: 50, VAT: 2.5
    ]);

    expect(result.subtotal).toBe(250);
    expect(result.totalVat).toBe(12.5);
    expect(result.grandTotal).toBe(262.5);
  });

  it('should handle zero-rated and exempt items without VAT', () => {
    const result = service.calculateInvoiceTax([
      { unitPrice: 500, quantity: 1, vatCategory: VatCategory.ZERO_RATED },
      { unitPrice: 300, quantity: 1, vatCategory: VatCategory.EXEMPT },
    ]);

    expect(result.subtotal).toBe(800);
    expect(result.totalVat).toBe(0);
    expect(result.grandTotal).toBe(800);
  });
});
