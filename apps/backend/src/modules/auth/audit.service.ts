import { Injectable } from '@nestjs/common';
import { AuditAction } from '../../database/entities/audit-log.entity';

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

export interface UserDeviceSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  deviceType: string;
  ipAddress: string;
  lastActive: Date;
  isRevoked: boolean;
}

@Injectable()
export class AuditService {
  private auditLogsStore: LogAuditInput[] = [];
  private activeSessionsStore: UserDeviceSession[] = [];

  /**
   * Log an immutable security audit event with correlationId.
   */
  async logAuditEvent(input: LogAuditInput): Promise<{ auditId: string; correlationId: string }> {
    const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.auditLogsStore.unshift({ ...input });
    return { auditId, correlationId: input.correlationId };
  }

  /**
   * Get all active device sessions for session tracking.
   */
  async getActiveSessions(): Promise<UserDeviceSession[]> {
    return this.activeSessionsStore;
  }

  /**
   * Revoke an active device session.
   */
  async revokeDeviceSession(sessionId: string, adminEmail: string): Promise<{ success: boolean; revokedSessionId: string }> {
    const session = this.activeSessionsStore.find((s) => s.sessionId === sessionId);
    if (session) {
      session.isRevoked = true;
    }

    await this.logAuditEvent({
      tenantId: 'tenant-dxb-90210',
      userEmail: adminEmail,
      action: AuditAction.SESSION_REVOKED,
      correlationId: `corr-rev-${Date.now()}`,
      ipAddress: '194.170.92.1',
      metadata: { revokedSessionId: sessionId },
    });

    return { success: true, revokedSessionId: sessionId };
  }
}
