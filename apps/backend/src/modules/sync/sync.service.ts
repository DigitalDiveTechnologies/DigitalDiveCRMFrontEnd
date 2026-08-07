import { Injectable, Logger } from '@nestjs/common';
import { PushSyncDto } from './sync.dto';
import { LedgerPostingService } from '../ledger/ledger-posting.service';
import { VatCalculatorService } from '../tax/vat-calculator.service';

export interface SyncPushResult {
  processedMutations: string[];
  failedMutations: { mutationId: string; error: string }[];
  serverCursor: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private processedKeys = new Set<string>(); // Mock idempotency memory store

  constructor(
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly vatCalculatorService: VatCalculatorService,
  ) {}

  async processPushSync(tenantId: string, dto: PushSyncDto): Promise<SyncPushResult> {
    const processedMutations: string[] = [];
    const failedMutations: { mutationId: string; error: string }[] = [];

    for (const mutation of dto.mutations) {
      // Idempotency check: Ignore duplicate pushes with identical idempotency keys
      if (this.processedKeys.has(mutation.idempotencyKey)) {
        this.logger.log(`Idempotency key ${mutation.idempotencyKey} already processed. Skipping duplicate.`);
        processedMutations.push(mutation.mutationId);
        continue;
      }

      try {
        if (mutation.entityType === 'SALES_INVOICE') {
          // Process offline created invoice
          const lines = mutation.payload.lines || [];
          const taxSummary = this.vatCalculatorService.calculateInvoiceTax(lines);

          // Create double-entry journal lines
          await this.ledgerPostingService.postJournal({
            tenantId,
            sourceDocumentId: mutation.payload.invoiceNumber || mutation.mutationId,
            sourceDocumentType: 'SALES_INVOICE',
            postingDate: new Date(mutation.clientCreatedAt),
            narration: `Offline Sales Invoice sync (${mutation.mutationId})`,
            lines: [
              { accountId: 'acc-receivable', accountCode: '1100', debit: taxSummary.grandTotal, credit: 0, description: 'Accounts Receivable' },
              { accountId: 'acc-sales', accountCode: '4000', debit: 0, credit: taxSummary.subtotal, description: 'Sales Revenue' },
              { accountId: 'acc-vat', accountCode: '2150', debit: 0, credit: taxSummary.totalVat, description: 'Output VAT Payable' },
            ],
          });
        }

        this.processedKeys.add(mutation.idempotencyKey);
        processedMutations.push(mutation.mutationId);
      } catch (err: any) {
        this.logger.error(`Mutation ${mutation.mutationId} failed: ${err.message}`);
        failedMutations.push({
          mutationId: mutation.mutationId,
          error: err.message || 'Processing error',
        });
      }
    }

    const serverCursor = `cursor-${Date.now()}`;
    return {
      processedMutations,
      failedMutations,
      serverCursor,
    };
  }

  async getPullSyncChanges(tenantId: string, cursor?: string) {
    return {
      serverCursor: `cursor-${Date.now()}`,
      hasMore: false,
      changes: {
        parties: [],
        items: [],
        invoices: [],
      },
    };
  }
}
