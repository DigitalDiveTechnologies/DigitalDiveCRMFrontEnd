import { Controller, Post, Get, Patch, Body, Param, Headers, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { AuthService, LoginDto } from './auth.service';
import { AuditService } from './audit.service';
import { AuditAction } from '../../database/entities/audit-log.entity';
import { Request } from 'express';

@ApiTags('Authentication & Sessions')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials and issue signed JWT session' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(dto);

    // Fire real audit log on successful login
    await this.auditService.logAuditEvent({
      tenantId: result.tenantId,
      userId: result.userId,
      userEmail: result.email,
      action: AuditAction.USER_LOGIN,
      correlationId: `login-${Date.now()}`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
      metadata: { role: result.role, loginMethod: 'PASSWORD' },
    });

    return result;
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered system users' })
  async getUsers() {
    return this.authService.getUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Register a new user login and mapping' })
  async createUser(
    @Body() body: any,
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Req() req: Request,
  ) {
    const result = await this.authService.createUser(body);

    await this.auditService.logAuditEvent({
      tenantId,
      userEmail: body.createdByEmail || 'system',
      action: AuditAction.USER_CREATED,
      correlationId: `user-create-${Date.now()}`,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
      metadata: { newUserEmail: body.email, newUserRole: body.role },
    });

    return result;
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user login details and role/tenant context' })
  async updateUser(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Req() req: Request,
  ) {
    const result = await this.authService.updateUser(id, body);

    if (body.role) {
      await this.auditService.logAuditEvent({
        tenantId,
        userEmail: body.updatedByEmail || 'system',
        action: AuditAction.ROLE_CHANGE,
        correlationId: `role-change-${Date.now()}`,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || '',
        metadata: { targetUserId: id, newRole: body.role },
      });
    }

    return result;
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Retrieve security audit log trail for tenant' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getAuditLogs(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
  ) {
    return this.auditService.getAuditLogs(tenantId);
  }
}
