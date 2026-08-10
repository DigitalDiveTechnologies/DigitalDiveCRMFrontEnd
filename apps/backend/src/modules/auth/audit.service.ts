import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLogEntity } from '../../database/entities/audit-log.entity';

export interface LogAuditInput {
  tenantId: string;
  userId?: string;
  userEmail: string;
  action: AuditAction;
  correlationId: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Log an immutable security audit event and persist it to the database.
   */
  async logAuditEvent(input: LogAuditInput): Promise<{ auditId: string; correlationId: string }> {
    try {
      const entry = this.auditLogRepository.create({
        tenantId: input.tenantId,
        userId: input.userId || null,
        userEmail: input.userEmail,
        action: input.action,
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent || null,
        metadata: input.metadata || null,
      });
      const saved = await this.auditLogRepository.save(entry);
      return { auditId: saved.id, correlationId: saved.correlationId };
    } catch (e) {
      this.logger.error(`Failed to persist audit log: ${e.message}`);
      return { auditId: `ERR-${Date.now()}`, correlationId: input.correlationId };
    }
  }

  /**
   * Retrieve all audit log entries for a tenant, ordered newest-first.
   */
  async getAuditLogs(tenantId: string, limit = 200): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { tenantId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
