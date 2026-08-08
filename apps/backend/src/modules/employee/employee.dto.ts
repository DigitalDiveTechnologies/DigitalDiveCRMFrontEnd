import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsOptional, IsEnum, IsArray } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Full name of employee', example: 'Hamdan Al Maktoum' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email address of employee', example: 'hamdan@company.ae' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+971 50 123 4567' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Designation / job title', example: 'Senior Accountant' })
  @IsString()
  designation: string;

  @ApiProperty({ description: 'Department', example: 'Finance' })
  @IsString()
  department: string;

  @ApiProperty({ description: 'Basic Salary in AED', example: 12000 })
  @IsNumber()
  basicSalary: number;

  @ApiProperty({ description: 'Allowances in AED', example: 1500 })
  @IsNumber()
  allowances: number;

  @ApiProperty({ description: 'Deductions in AED', example: 500 })
  @IsNumber()
  deductions: number;

  @ApiProperty({ description: 'Join Date', example: '2025-01-15' })
  @IsString()
  joinDate: string;
}

export class UpdateEmployeeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  basicSalary?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  allowances?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deductions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  joinDate?: string;
}

export class SendPayslipDto {
  @ApiProperty({ description: 'Month name', example: 'August' })
  @IsString()
  month: string;

  @ApiProperty({ description: 'Year value', example: 2026 })
  @IsNumber()
  year: number;
}

export class BulkPayslipDto {
  @ApiProperty({ description: 'Array of employee IDs', example: ['emp-1'] })
  @IsArray()
  @IsString({ each: true })
  employeeIds: string[];

  @ApiProperty({ description: 'Month name', example: 'August' })
  @IsString()
  month: string;

  @ApiProperty({ description: 'Year value', example: 2026 })
  @IsNumber()
  year: number;
}
