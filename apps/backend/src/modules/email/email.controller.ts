import { Controller, Get, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SmtpConfigDto, SendEmailDto } from './email.dto';

@ApiTags('Email & Notification Management')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Retrieve configured SMTP settings (passwords masked)' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getSettings(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.emailService.getSettings(tenantId);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Save SMTP connection settings' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async saveSettings(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: SmtpConfigDto,
  ) {
    return this.emailService.saveSettings(tenantId, dto);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send direct individual or bulk custom emails' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async sendEmail(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: SendEmailDto,
  ) {
    return this.emailService.sendMail(dto.to, dto.subject, dto.body, tenantId);
  }
}
