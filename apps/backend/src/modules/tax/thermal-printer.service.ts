import { Injectable } from '@nestjs/common';
import { InvoiceTaxSummary } from './vat-calculator.service';

export interface ThermalReceiptInput {
  storeName: string;
  branchName: string;
  sellerTrn: string;
  receiptNumber: string;
  issueDate: string;
  taxSummary: InvoiceTaxSummary;
  widthMm: 58 | 80;
}

@Injectable()
export class ThermalPrinterService {
  /**
   * Generates ESC/POS thermal printer binary payload byte stream for 58mm / 80mm thermal receipt printers.
   * ESC/POS commands used:
   * - ESC @ (Initialize printer: 0x1B 0x40)
   * - ESC a 1 (Align center: 0x1B 0x61 0x01)
   * - ESC a 0 (Align left: 0x1B 0x61 0x00)
   * - GS V 66 0 (Full paper cut: 0x1D 0x56 0x42 0x00)
   */
  generateEscPosBuffer(input: ThermalReceiptInput): Buffer {
    const commands: number[] = [];

    // ESC @ Init Printer
    commands.push(0x1b, 0x40);

    // ESC a 1 Center Alignment
    commands.push(0x1b, 0x61, 0x01);

    // Header Text
    const headerText = `${input.storeName}\n${input.branchName}\nTRN: ${input.sellerTrn}\n--------------------------------\nTAX RECEIPT: ${input.receiptNumber}\nDATE: ${input.issueDate}\n--------------------------------\n`;
    for (let i = 0; i < headerText.length; i++) {
      commands.push(headerText.charCodeAt(i));
    }

    // ESC a 0 Left Alignment
    commands.push(0x1b, 0x61, 0x00);

    // Totals Text
    const bodyText = `SUBTOTAL:  AED ${input.taxSummary.subtotal.toFixed(2)}\nVAT (5%):  AED ${input.taxSummary.totalVat.toFixed(2)}\n--------------------------------\nTOTAL:     AED ${input.taxSummary.grandTotal.toFixed(2)}\n--------------------------------\n`;
    for (let i = 0; i < bodyText.length; i++) {
      commands.push(bodyText.charCodeAt(i));
    }

    // ESC a 1 Center Alignment
    commands.push(0x1b, 0x61, 0x01);
    const footerText = `THANK YOU FOR YOUR VISIT!\nPOWERED BY UAE PLATFORM\n\n\n`;
    for (let i = 0; i < footerText.length; i++) {
      commands.push(footerText.charCodeAt(i));
    }

    // GS V 66 0 Paper Cut
    commands.push(0x1d, 0x56, 0x42, 0x00);

    return Buffer.from(commands);
  }
}
