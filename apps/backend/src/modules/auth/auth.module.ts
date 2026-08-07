import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PolicyService } from './policy.service';
import { AuditService } from './audit.service';
import { TenantIsolationGuard } from './tenant-isolation.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PolicyService, AuditService, TenantIsolationGuard],
  exports: [AuthService, PolicyService, AuditService, TenantIsolationGuard],
})
export class AuthModule {}
