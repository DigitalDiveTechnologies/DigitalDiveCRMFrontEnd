import { Injectable } from '@nestjs/common';
import { InvoiceTaxSummary } from './vat-calculator.service';

export interface TaxInvoiceDocumentInput {
  invoiceNumber: string;
  issueDate: string;
  sellerName: string;
  sellerTrn: string;
  sellerAddress: string;
  buyerName: string;
  buyerTrn?: string;
  buyerAddress?: string;
  taxSummary: InvoiceTaxSummary;
  qrCodePayload: string;
}

@Injectable()
export class PdfInvoiceService {
  /**
   * Render HTML string for UAE Tax Invoice PDF rendering (Puppeteer/PDFKit ready).
   * Compliant with UAE FTA requirements: Bilingual headers, 5% VAT breakup, Seller/Buyer TRN, and QR code.
   */
  generateInvoiceHtml(input: TaxInvoiceDocumentInput): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice - ${input.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 40px; color: #0f172a; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
    .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
    .party-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
    th { background: #0f172a; color: #ffffff; }
    .totals { margin-top: 20px; float: right; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .grand-total { border-top: 2px solid #0f172a; font-weight: bold; font-size: 16px; padding-top: 8px; }
    .qr-container { margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Tax Invoice / فاتورة ضريبية</div>
      <div class="subtitle">Invoice No: <strong>${input.invoiceNumber}</strong></div>
      <div class="subtitle">Date of Supply: <strong>${input.issueDate}</strong></div>
    </div>
    <div style="text-align: right;">
      <strong>${input.sellerName}</strong><br />
      <span style="font-size: 12px; color: #64748b;">${input.sellerAddress}</span><br />
      <strong style="color: #2563eb;">TRN: ${input.sellerTrn}</strong>
    </div>
  </div>

  <div class="party-box">
    <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billed To / المشتري</div>
    <strong>${input.buyerName}</strong><br />
    ${input.buyerTrn ? `<span style="font-size: 12px;">Customer TRN: ${input.buyerTrn}</span><br />` : ''}
    ${input.buyerAddress ? `<span style="font-size: 12px; color: #64748b;">${input.buyerAddress}</span>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Line Item</th>
        <th style="text-align: center;">VAT Rate</th>
        <th style="text-align: right;">Taxable Amount (AED)</th>
        <th style="text-align: right;">VAT Amount (AED)</th>
        <th style="text-align: right;">Total (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${input.taxSummary.lines.map((l, i) => `
        <tr>
          <td>Line Item #${i + 1}</td>
          <td style="text-align: center;">${(l.vatRate * 100).toFixed(0)}%</td>
          <td style="text-align: right;">${l.taxableAmount.toFixed(2)}</td>
          <td style="text-align: right; color: #059669; font-weight: bold;">${l.vatAmount.toFixed(2)}</td>
          <td style="text-align: right; font-weight: bold;">${l.lineTotal.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal (Excl. VAT):</span>
      <span>AED ${input.taxSummary.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row" style="color: #059669; font-weight: bold;">
      <span>Total UAE VAT (5%):</span>
      <span>AED ${input.taxSummary.totalVat.toFixed(2)}</span>
    </div>
    <div class="totals-row grand-total">
      <span>Grand Total:</span>
      <span>AED ${input.taxSummary.grandTotal.toFixed(2)}</span>
    </div>
  </div>

  <div class="qr-container">
    <div style="font-size: 11px; color: #64748b;">FTA Cryptographic QR Code Base64 Payload:</div>
    <code style="font-size: 10px; word-break: break-all; background: #f1f5f9; padding: 8px; display: block; margin-top: 4px; border-radius: 4px;">${input.qrCodePayload}</code>
  </div>
</body>
</html>`;
  }
}
