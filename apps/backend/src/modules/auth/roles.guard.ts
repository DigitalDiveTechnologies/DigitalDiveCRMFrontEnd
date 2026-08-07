import { Injectable, CanActivate, ExecutionContext, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from './roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.headers['x-user-role'] || request.user?.role;

    if (!userRole) {
      throw new ForbiddenException('Missing user role context in request.');
    }

    const hasRole = requiredRoles.includes(userRole as UserRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Role authorization failure! Role [${userRole}] does not have required permissions: [${requiredRoles.join(', ')}].`,
      );
    }

    return true;
  }
}
