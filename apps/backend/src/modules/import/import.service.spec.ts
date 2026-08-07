import { ImportService } from './import.service';

describe('ImportService (Phase 2 Bulk Excel Staging Validator)', () => {
  let importService: ImportService;

  beforeEach(() => {
    importService = new ImportService();
  });

  it('should validate staging rows for Parties import and highlight invalid TRNs', () => {
    const result = importService.validateStagingRows(
      [
        { rowNumber: 1, data: { name: 'Valid Customer LLC', trn: '100293847500003' } },
        { rowNumber: 2, data: { name: 'Invalid TRN Customer', trn: '123' } }, // Invalid 3-digit TRN
      ],
      'PARTIES',
    );

    expect(result.totalRows).toBe(2);
    expect(result.validRowsCount).toBe(1);
    expect(result.invalidRowsCount).toBe(1);
    expect(result.errors[0].field).toBe('trn');
  });
});
