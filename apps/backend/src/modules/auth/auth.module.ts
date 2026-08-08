import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { TenantController } from './tenant.controller';
import { AuthService } from './auth.service';
import { PolicyService } from './policy.service';
import { AuditService } from './audit.service';
import { TenantIsolationGuard } from './tenant-isolation.guard';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Branch]),
  ],
  controllers: [AuthController, TenantController],
  providers: [AuthService, PolicyService, AuditService, TenantIsolationGuard],
  exports: [AuthService, PolicyService, AuditService, TenantIsolationGuard],
})
export class AuthModule {}
