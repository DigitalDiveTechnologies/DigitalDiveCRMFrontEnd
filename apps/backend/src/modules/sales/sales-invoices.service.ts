import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesInvoice, InvoiceStatus } from '../../database/entities/sales-invoice.entity';
import { SalesInvoiceLine } from '../../database/entities/sales-invoice-line.entity';
import { Party } from '../../database/entities/party.entity';
import { SequenceService } from '../ledger/sequence.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';
import { EmailService } from '../email/email.service';
import { InventoryService } from '../inventory/inventory.service';
import { ReceiptsService } from './receipts.service';
import { StockMovementType } from '../../database/entities/stock-movement.entity';

@Injectable()
export class SalesInvoicesService {
  private readonly logger = new Logger(SalesInvoicesService.name);

  constructor(
    @InjectRepository(SalesInvoice)
    private readonly invoiceRepository: Repository<SalesInvoice>,
    @InjectRepository(SalesInvoiceLine)
    private readonly invoiceLineRepository: Repository<SalesInvoiceLine>,
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
    private readonly sequenceService: SequenceService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly vatCalculatorService: VatCalculatorService,
    private readonly emailService: EmailService,
    private readonly inventoryService: InventoryService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  async getSalesInvoices(tenantId: string): Promise<SalesInvoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      relations: ['lines', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoiceById(tenantId: string, id: string): Promise<SalesInvoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { tenantId, id },
      relations: ['lines', 'customer'],
    });
    if (!invoice) {
      throw new NotFoundException(`Sales Invoice with ID ${id} not found.`);
    }
    return invoice;
  }

  async createSalesInvoice(tenantId: string, dto: any): Promise<SalesInvoice> {
    // Validate customer
    const customer = await this.partyRepository.findOne({
      where: { tenantId, id: dto.customerId },
    });
    if (!customer) {
      throw new BadRequestException(`Customer with ID ${dto.customerId} not found.`);
    }

    // Calculate tax summaries
    const taxLineInputs = dto.items.map((item: any) => ({
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      discountAmount: Number(item.discountAmount || 0),
      vatCategory: item.vatCategory as VatCategory,
    }));

    const taxSummary = this.vatCalculatorService.calculateInvoiceTax(taxLineInputs);

    // Generate atomic sequence number
    const invoiceNumber = await this.sequenceService.getNextSequence(tenantId, 'SALES_INVOICE', 'INV');

    // Create invoice record
    const invoice = this.invoiceRepository.create({
      tenantId,
      branchId: dto.branchId || null,
      invoiceNumber,
      customerId: dto.customerId,
      invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      currency: dto.currency || 'AED',
      status: dto.status || InvoiceStatus.POSTED,
      subtotal: taxSummary.subtotal,
      vatTotal: taxSummary.totalVat,
      grandTotal: taxSummary.grandTotal,
      paidAmount: 0, // Will be updated by receipt process if paid
      idempotencyKey: dto.idempotencyKey || `key-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Create lines
    const lines = dto.items.map((item: any, idx: number) => {
      const calcLine = taxSummary.lines[idx];
      return this.invoiceLineRepository.create({
        invoiceId: savedInvoice.id,
        itemId: item.itemId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0,
        vatCategory: item.vatCategory as VatCategory,
        taxableAmount: calcLine.taxableAmount,
        vatAmount: calcLine.vatAmount,
        lineTotal: calcLine.lineTotal,
      });
    });

    await this.invoiceLineRepository.save(lines);
    savedInvoice.lines = lines;
    savedInvoice.customer = customer;

    // Deduct stock for inventory items sold
    for (const line of lines) {
      if (line.itemId) {
        try {
          // If no warehouseId is specified, fetch first active warehouse or use null
          let warehouseId = dto.warehouseId;
          if (!warehouseId) {
            const warehouses = await this.inventoryService.getWarehouses(tenantId);
            if (warehouses && warehouses.length > 0) {
              warehouseId = warehouses[0].id;
            }
          }

          await this.inventoryService.recordStockMovement(
            tenantId,
            line.itemId,
            warehouseId,
            -Number(line.quantity), // negative quantity for sale deduction
            StockMovementType.SALE,
            savedInvoice.id,
            'SALES_INVOICE',
          );
        } catch (stockError) {
          this.logger.warn(`Failed to deduct stock for item [${line.itemId}]: ${stockError.message}`);
        }
      }
    }

    // Post to General Ledger
    await this.ledgerPostingService.postJournal({
      tenantId,
      branchId: dto.branchId || null,
      sourceDocumentId: savedInvoice.id,
      sourceDocumentType: 'SALES_INVOICE',
      postingDate: savedInvoice.invoiceDate,
      narration: `Sales Invoice ${savedInvoice.invoiceNumber} for ${customer.name}`,
      lines: [
        {
          accountId: 'acc-receivable-1100',
          accountCode: '1100',
          debit: savedInvoice.grandTotal,
          credit: 0,
          description: `Accounts Receivable for invoice ${savedInvoice.invoiceNumber}`,
        },
        {
          accountId: 'acc-sales-revenue-4000',
          accountCode: '4000',
          debit: 0,
          credit: savedInvoice.subtotal,
          description: `Sales Revenue for invoice ${savedInvoice.invoiceNumber}`,
        },
        {
          accountId: 'acc-output-vat-2150',
          accountCode: '2150',
          debit: 0,
          credit: savedInvoice.vatTotal,
          description: `VAT Output Tax for invoice ${savedInvoice.invoiceNumber}`,
        },
      ],
    });

    // If invoice is fully or partially paid (e.g. POS cashier payment), process payment receipt
    if (dto.paidAmount && Number(dto.paidAmount) > 0) {
      try {
        await this.receiptsService.processPaymentReceipt({
          tenantId,
          branchId: dto.branchId || null,
          invoiceId: savedInvoice.id,
          paymentAmount: Number(dto.paidAmount),
          paymentMethod: dto.paymentMethod || 'CASH',
          paymentDate: savedInvoice.invoiceDate,
          narration: `POS Cashier payment for invoice ${savedInvoice.invoiceNumber}`,
        });
      } catch (receiptError) {
        this.logger.error(`Failed to process cashier payment for invoice ${savedInvoice.invoiceNumber}: ${receiptError.message}`);
      }
    }

    // Send Email Notification
    if (customer.email) {
      const emailSubject = `Tax Invoice Posted: ${savedInvoice.invoiceNumber}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Tax Invoice ${savedInvoice.invoiceNumber}</h2>
          <p>Dear ${customer.name},</p>
          <p>We are pleased to inform you that a new tax invoice has been posted for your account.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Invoice Date</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a;">${savedInvoice.invoiceDate.toISOString().substring(0, 10)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Subtotal</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a;">${Number(savedInvoice.subtotal).toFixed(2)} AED</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">VAT Total (5%)</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a;">${Number(savedInvoice.vatTotal).toFixed(2)} AED</td>
            </tr>
            <tr style="font-size: 1.1rem; font-weight: bold;">
              <td style="padding: 12px 0; color: #0f172a;">Total Payable</td>
              <td style="padding: 12px 0; text-align: right; color: #059669;">${Number(savedInvoice.grandTotal).toFixed(2)} AED</td>
            </tr>
          </table>
          <p style="margin-top: 24px; color: #64748b; font-size: 0.9rem;">Thank you for your business!</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">This is an automated message sent by FilsDesk ERP.</p>
        </div>
      `;

      this.emailService.sendMail([customer.email], emailSubject, emailBody, tenantId)
        .catch(err => this.logger.error(`Failed to send invoice notification to ${customer.email}: ${err.message}`));
    }

    return savedInvoice;
  }
}
