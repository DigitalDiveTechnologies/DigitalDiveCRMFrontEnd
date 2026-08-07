import { Injectable, BadRequestException } from '@nestjs/common';

export enum VatCategory {
  STANDARD = 'STANDARD_5',   // 5% UAE Standard VAT
  ZERO_RATED = 'ZERO_0',     // 0% Zero-rated (exports, certain education/healthcare)
  EXEMPT = 'EXEMPT',         // Exempt (residential real estate, financial services)
}

export interface TaxLineInput {
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  vatCategory: VatCategory;
}

export interface CalculatedTaxLine {
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  lineTotal: number;
}

export interface InvoiceTaxSummary {
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  lines: CalculatedTaxLine[];
}

@Injectable()
export class VatCalculatorService {
  private readonly STANDARD_RATE = 0.05; // 5% UAE VAT

  /**
   * Calculate UAE VAT for an array of line items with exact decimal rounding.
   */
  calculateInvoiceTax(items: TaxLineInput[]): InvoiceTaxSummary {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cannot calculate tax for empty invoice lines');
    }

    let subtotal = 0;
    let totalVat = 0;

    const calculatedLines: CalculatedTaxLine[] = items.map((item) => {
      const discount = item.discountAmount || 0;
      const taxableAmount = Math.max(0, Number((item.unitPrice * item.quantity - discount).toFixed(2)));

      let vatRate = 0;
      if (item.vatCategory === VatCategory.STANDARD) {
        vatRate = this.STANDARD_RATE;
      }

      const vatAmount = Number((taxableAmount * vatRate).toFixed(2));
      const lineTotal = Number((taxableAmount + vatAmount).toFixed(2));

      subtotal += taxableAmount;
      totalVat += vatAmount;

      return {
        taxableAmount,
        vatRate,
        vatAmount,
        lineTotal,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    totalVat = Number(totalVat.toFixed(2));
    const grandTotal = Number((subtotal + totalVat).toFixed(2));

    return {
      subtotal,
      totalVat,
      grandTotal,
      lines: calculatedLines,
    };
  }
}
