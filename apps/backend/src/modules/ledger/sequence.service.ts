import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sequence } from '../../database/entities/sequence.entity';

@Injectable()
export class SequenceService {
  constructor(
    @InjectRepository(Sequence)
    private readonly sequenceRepository: Repository<Sequence>,
  ) {}

  /**
   * Generates the next sequential number atomically for a document type per tenant.
   */
  async getNextSequence(tenantId: string, sequenceType: string, prefixDefault: string): Promise<string> {
    return this.sequenceRepository.manager.transaction(async (transactionalEntityManager) => {
      let seq = await transactionalEntityManager.findOne(Sequence, {
        where: { tenantId, sequenceType },
        lock: { mode: 'pessimistic_write' }, // Enforce atomic locking
      });

      if (!seq) {
        seq = transactionalEntityManager.create(Sequence, {
          tenantId,
          sequenceType,
          prefix: prefixDefault,
          lastNumber: 1000,
          padding: 4,
        });
        seq = await transactionalEntityManager.save(seq);
      }

      seq.lastNumber += 1;
      await transactionalEntityManager.save(seq);

      const paddedNumber = String(seq.lastNumber).padStart(seq.padding, '0');
      return `${seq.prefix}-${paddedNumber}`;
    });
  }
}
