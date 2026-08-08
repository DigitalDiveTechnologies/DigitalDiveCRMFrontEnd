import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsEmail, IsOptional, IsArray } from 'class-validator';

export class SmtpConfigDto {
  @ApiProperty({ description: 'SMTP server host', example: 'smtp.mailtrap.io' })
  @IsString()
  host: string;

  @ApiProperty({ description: 'SMTP server port', example: 587 })
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'SMTP server login username', example: 'user123' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'SMTP server login password', example: 'pass123' })
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Use secure connection (SSL/TLS)', example: false })
  @IsBoolean()
  secure: boolean;

  @ApiProperty({ description: 'Default sender address', example: 'noreply@filsdesk.ae' })
  @IsEmail()
  fromEmail: string;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Array of recipient email addresses', example: ['employee@company.ae'] })
  @IsArray()
  @IsString({ each: true })
  to: string[];

  @ApiProperty({ description: 'Subject line of email', example: 'Monthly Pay Slip - August 2026' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email HTML content body', example: '<p>Please find attached...</p>' })
  @IsString()
  body: string;
}
