import { SyncService } from './sync.service';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService, VatCategory } from '../tax/vat-calculator.service';

describe('SyncService', () => {
  let syncService: SyncService;
  let ledgerPostingService: LedgerPostingService;
  let vatCalculatorService: VatCalculatorService;

  beforeEach(() => {
    ledgerPostingService = new LedgerPostingService();
    vatCalculatorService = new VatCalculatorService();
    syncService = new SyncService(ledgerPostingService, vatCalculatorService);
  });

  it('should process offline sales invoice mutation and post balanced double-entry journals', async () => {
    const result = await syncService.processPushSync('tenant-dxb', {
      deviceId: 'pos-terminal-01',
      mutations: [
        {
          mutationId: 'mut-001',
          idempotencyKey: 'idemp-unique-1001',
          entityType: 'SALES_INVOICE',
          operation: 'CREATE',
          clientCreatedAt: new Date().toISOString(),
          payload: {
            invoiceNumber: 'INV-2026-0001',
            lines: [
              { unitPrice: 1000, quantity: 1, vatCategory: VatCategory.STANDARD }, // Subtotal: 1000, VAT: 50
            ],
          },
        },
      ],
    });

    expect(result.processedMutations).toContain('mut-001');
    expect(result.failedMutations.length).toBe(0);
    expect(result.serverCursor).toBeDefined();
  });

  it('should deduplicate offline mutations sent with the same idempotency key', async () => {
    const mutationPayload = {
      mutationId: 'mut-002',
      idempotencyKey: 'idemp-duplicate-2002',
      entityType: 'SALES_INVOICE',
      operation: 'CREATE',
      clientCreatedAt: new Date().toISOString(),
      payload: {
        invoiceNumber: 'INV-2026-0002',
        lines: [{ unitPrice: 500, quantity: 1, vatCategory: VatCategory.STANDARD }],
      },
    };

    // First push
    await syncService.processPushSync('tenant-dxb', {
      deviceId: 'pos-terminal-01',
      mutations: [mutationPayload],
    });

    // Duplicate push (retry)
    const secondResult = await syncService.processPushSync('tenant-dxb', {
      deviceId: 'pos-terminal-01',
      mutations: [mutationPayload],
    });

    expect(secondResult.processedMutations).toContain('mut-002');
    expect(secondResult.failedMutations.length).toBe(0);
  });
});
