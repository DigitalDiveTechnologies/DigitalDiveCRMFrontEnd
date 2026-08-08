import { Controller, Get, Post, Patch, Delete, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto, UpdateEmployeeDto, SendPayslipDto, BulkPayslipDto } from './employee.dto';

@ApiTags('Employee & Payroll Management')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve full list of company employees' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getEmployees(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.employeeService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new employee record' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createEmployee(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.create(dto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee parameters' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async updateEmployee(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate / mark employee as inactive' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async deleteEmployee(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') id: string,
  ) {
    return this.employeeService.remove(id, tenantId);
  }

  @Post(':id/payslip')
  @ApiOperation({ summary: 'Generate and email monthly payslip to a specific employee' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async sendPayslip(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') id: string,
    @Body() dto: SendPayslipDto,
  ) {
    return this.employeeService.sendPayslip(id, dto.month, dto.year, tenantId);
  }

  @Post('payslips/bulk')
  @ApiOperation({ summary: 'Send payslips to multiple selected employees' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async sendBulkPayslips(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: BulkPayslipDto,
  ) {
    return this.employeeService.sendBulkPayslips(dto.employeeIds, dto.month, dto.year, tenantId);
  }
}
