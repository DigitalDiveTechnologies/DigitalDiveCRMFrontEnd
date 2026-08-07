import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EInvoicePayloadInput {
  invoiceNumber: string;
  issueDate: string;
  sellerTrn: string;
  sellerName: string;
  buyerTrn: string;
  buyerName: string;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  items: { description: string; quantity: number; unitPrice: number; vatAmount: number }[];
}

export interface EInvoiceSubmissionResult {
  eInvoiceUuid: string;
  xmlHash: string;
  qrCodePayload: string;
  aspStatus: 'CLEARED' | 'REPORTED' | 'REJECTED';
  submissionTimestamp: string;
}

@Injectable()
export class EInvoicingService {
  /**
   * Generates UBL 2.1 E-Invoice XML, cryptographic hash, and simulates ASP Gateway clearance.
   */
  async submitEInvoice(input: EInvoicePayloadInput): Promise<EInvoiceSubmissionResult> {
    if (!input.sellerTrn || input.sellerTrn.length !== 15) {
      throw new BadRequestException('Seller TRN must be a valid 15-digit UAE tax number.');
    }

    const eInvoiceUuid = crypto.randomUUID();
    const rawXmlPayload = `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><cbc:ID>${input.invoiceNumber}</cbc:ID><cbc:UUID>${eInvoiceUuid}</cbc:UUID><cbc:IssueDate>${input.issueDate}</cbc:IssueDate><cac:AccountingSupplierParty><cac:Party><cbc:CompanyID>${input.sellerTrn}</cbc:CompanyID></cac:Party></cac:AccountingSupplierParty></Invoice>`;
    
    // Cryptographic SHA-256 Hash of XML Payload
    const xmlHash = crypto.createHash('sha256').update(rawXmlPayload).digest('hex');

    // Simulate FTA / ASP QR Code Base64 Payload
    const qrCodePayload = Buffer.from(
      `Seller:${input.sellerName}|TRN:${input.sellerTrn}|Time:${input.issueDate}|Total:${input.grandTotal}|VAT:${input.vatTotal}|Hash:${xmlHash.substring(0, 16)}`,
    ).toString('base64');

    return {
      eInvoiceUuid,
      xmlHash,
      qrCodePayload,
      aspStatus: 'CLEARED',
      submissionTimestamp: new Date().toISOString(),
    };
  }
}
