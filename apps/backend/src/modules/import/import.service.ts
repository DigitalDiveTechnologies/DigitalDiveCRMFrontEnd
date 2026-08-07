import { Injectable, BadRequestException } from '@nestjs/common';

export interface ImportRowInput {
  rowNumber: number;
  data: Record<string, any>;
}

export interface ImportStagingValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  errors: { rowNumber: number; field: string; message: string }[];
}

@Injectable()
export class ImportService {
  /**
   * Validate raw staging rows for Bulk Excel/CSV Imports (Parties & Items).
   */
  validateStagingRows(rows: ImportRowInput[], importType: 'PARTIES' | 'ITEMS'): ImportStagingValidationResult {
    if (!rows || rows.length === 0) {
      throw new BadRequestException('Import file contains no data rows.');
    }

    const errors: { rowNumber: number; field: string; message: string }[] = [];
    let validCount = 0;

    for (const row of rows) {
      let isValid = true;
      if (importType === 'PARTIES') {
        if (!row.data.name) {
          errors.push({ rowNumber: row.rowNumber, field: 'name', message: 'Party Name is required.' });
          isValid = false;
        }
        if (row.data.trn && String(row.data.trn).length !== 15) {
          errors.push({ rowNumber: row.rowNumber, field: 'trn', message: 'UAE TRN must be exactly 15 digits.' });
          isValid = false;
        }
      } else if (importType === 'ITEMS') {
        if (!row.data.name) {
          errors.push({ rowNumber: row.rowNumber, field: 'name', message: 'Item Name is required.' });
          isValid = false;
        }
        if (!row.data.sku) {
          errors.push({ rowNumber: row.rowNumber, field: 'sku', message: 'SKU code is required.' });
          isValid = false;
        }
      }

      if (isValid) validCount++;
    }

    return {
      totalRows: rows.length,
      validRowsCount: validCount,
      invalidRowsCount: errors.length,
      errors,
    };
  }
}
