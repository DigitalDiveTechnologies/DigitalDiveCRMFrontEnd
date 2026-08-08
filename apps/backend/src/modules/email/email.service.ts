import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SmtpConfigDto } from './email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  
  // Map of tenantId -> SMTP settings
  private smtpConfigs = new Map<string, SmtpConfigDto>();

  private getDefaultSettings(): SmtpConfigDto {
    return {
      host: 'smtp.gmail.com',
      port: 465,
      username: 'digitaldive03@gmail.com',
      password: 'xdhjguwypngazjtj',
      secure: true,
      fromEmail: 'digitaldive03@gmail.com',
    };
  }

  getSettings(tenantId: string): SmtpConfigDto {
    const config = this.smtpConfigs.get(tenantId) || this.getDefaultSettings();
    // Mask password before returning
    return {
      ...config,
      password: config.password ? '••••••••••••' : '',
    };
  }

  saveSettings(tenantId: string, config: SmtpConfigDto): SmtpConfigDto {
    const current = this.smtpConfigs.get(tenantId) || this.getDefaultSettings();
    // If password is not provided or masked, keep old password
    const password = (config.password === '••••••••••••' || !config.password)
      ? current.password
      : config.password;

    const updated = {
      ...config,
      password,
    };
    this.smtpConfigs.set(tenantId, updated);
    this.logger.log(`SMTP Settings updated for tenant [${tenantId}]: ${config.host}:${config.port}`);
    return this.getSettings(tenantId);
  }

  async sendMail(to: string[], subject: string, htmlContent: string, tenantId: string = 'tenant-default'): Promise<{ success: boolean; mode: 'REAL' | 'SIMULATED'; details?: any }> {
    const config = this.smtpConfigs.get(tenantId) || this.getDefaultSettings();
    const isMock = 
      config.host.includes('mock') || 
      config.username.includes('mock') ||
      config.host === 'smtp.mailtrap.io'; // Treat mailtrap as simulated unless they put real details

    this.logger.log(`Initiating email dispatch for tenant [${tenantId}] to ${to.length} recipients...`);

    if (isMock) {
      this.logSimulatedMail(to, subject, htmlContent, config);
      return { success: true, mode: 'SIMULATED' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password,
        },
      });

      const info = await transporter.sendMail({
        from: `"FilsDesk ERP" <${config.fromEmail}>`,
        to: to.join(', '),
        subject: subject,
        html: htmlContent,
      });

      this.logger.log(`Email sent successfully via SMTP for tenant [${tenantId}]! Message ID: ${info.messageId}`);
      return { success: true, mode: 'REAL', details: info };
    } catch (error) {
      this.logger.warn(`SMTP transmission failed for tenant [${tenantId}], falling back to simulator mode. Error: ${error.message}`);
      this.logSimulatedMail(to, subject, htmlContent, config);
      return { success: true, mode: 'SIMULATED', details: error.message };
    }
  }

  private logSimulatedMail(to: string[], subject: string, htmlContent: string, config: SmtpConfigDto) {
    console.log('\n=================== SMTP EMAIL SIMULATOR ===================');
    console.log(`FROM: FilsDesk ERP <${config.fromEmail}>`);
    console.log(`TO: ${to.join(', ')}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('------------------------- HTML BODY ------------------------');
    // Remove HTML tags for clean console printing
    const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(plainText.length > 500 ? plainText.slice(0, 500) + '...' : plainText);
    console.log('============================================================\n');
  }
}
