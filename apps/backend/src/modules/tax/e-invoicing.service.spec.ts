import { EInvoicingService } from './e-invoicing.service';

describe('EInvoicingService (Phase 4 Compliance & UBL 2.1 Serializer)', () => {
  let eInvoicingService: EInvoicingService;

  beforeEach(() => {
    eInvoicingService = new EInvoicingService();
  });

  it('should generate UBL 2.1 E-Invoice UUID, SHA-256 hash, and CLEARED ASP status', async () => {
    const result = await eInvoicingService.submitEInvoice({
      invoiceNumber: 'INV-2026-9001',
      issueDate: '2026-08-06',
      sellerTrn: '100293847500003',
      sellerName: 'Al Futtaim Trading LLC',
      buyerTrn: '100384759200003',
      buyerName: 'Emaar Properties PJSC',
      subtotal: 10000,
      vatTotal: 500,
      grandTotal: 10500,
      items: [{ description: 'ESC/POS Thermal Printers Bulk', quantity: 20, unitPrice: 500, vatAmount: 500 }],
    });

    expect(result.eInvoiceUuid).toBeDefined();
    expect(result.xmlHash).toHaveLength(64);
    expect(result.qrCodePayload).toBeDefined();
    expect(result.aspStatus).toBe('CLEARED');
  });
});
