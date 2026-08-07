import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userTenantId = request.headers['x-tenant-id'] || request.user?.tenantId;
    const targetTenantId = request.params?.tenantId || request.body?.tenantId || request.query?.tenantId;

    if (!userTenantId) {
      throw new UnauthorizedException('Missing tenant context in request headers or auth payload.');
    }

    if (targetTenantId && userTenantId !== targetTenantId) {
      throw new ForbiddenException(
        `Cross-tenant access violation! Tenant [${userTenantId}] cannot access resources of Tenant [${targetTenantId}].`,
      );
    }

    return true;
  }
}
