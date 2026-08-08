import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesInvoicesService } from './sales-invoices.service';
import { ReceiptsService } from './receipts.service';
import { CreditNoteService } from './credit-note.service';

describe('SalesController', () => {
  let controller: SalesController;

  const mockSalesInvoicesService = {
    getSalesInvoices: jest.fn().mockResolvedValue([]),
    getInvoiceById: jest.fn(),
    createSalesInvoice: jest.fn().mockImplementation((tenantId, dto) => {
      // Calculate mock total based on standard items
      const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const vatTotal = subtotal * 0.05;
      return Promise.resolve({
        id: 'mock-id',
        invoiceNumber: 'INV-1001',
        subtotal,
        vatTotal,
        grandTotal: subtotal + vatTotal,
        status: 'POSTED',
      });
    }),
  };

  const mockReceiptsService = {
    processPaymentReceipt: jest.fn(),
  };

  const mockCreditNoteService = {
    issueCreditNote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        {
          provide: SalesInvoicesService,
          useValue: mockSalesInvoicesService,
        },
        {
          provide: ReceiptsService,
          useValue: mockReceiptsService,
        },
        {
          provide: CreditNoteService,
          useValue: mockCreditNoteService,
        },
      ],
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
    expect(result.vatTotal).toBe(100);
    expect(result.grandTotal).toBe(2100);
    expect(result.status).toBe('POSTED');
  });
});
