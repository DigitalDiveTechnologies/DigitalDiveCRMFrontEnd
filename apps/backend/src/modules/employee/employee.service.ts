import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto, UpdateEmployeeDto } from './employee.dto';
import { EmailService } from '../email/email.service';
import { Employee } from '../../database/entities/employee.entity';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly emailService: EmailService,
  ) {}

  private async seedDefaultEmployees(tenantId: string): Promise<void> {
    const count = await this.employeeRepository.count({ where: { tenantId } });
    if (count === 0) {
      this.logger.log(`Seeding default employees for tenant: ${tenantId}`);
      const seeds = [
        {
          tenantId,
          name: 'Amir Al-Mansoori',
          email: 'amir.mansoori@company.ae',
          phone: '+971 50 111 2233',
          designation: 'Senior Accountant',
          department: 'Finance & Accounts',
          basicSalary: 14500,
          allowances: 2500,
          deductions: 800,
          joinDate: new Date('2024-03-15'),
          status: 'ACTIVE' as const,
        },
        {
          tenantId,
          name: 'Fatima Al-Suwaidi',
          email: 'fatima.suwaidi@company.ae',
          phone: '+971 52 333 4455',
          designation: 'Biller / Cashier',
          department: 'Sales & Front Office',
          basicSalary: 7200,
          allowances: 1000,
          deductions: 350,
          joinDate: new Date('2025-01-10'),
          status: 'ACTIVE' as const,
        },
        {
          tenantId,
          name: 'Ziad Haddad',
          email: 'ziad.haddad@company.ae',
          phone: '+971 55 555 6677',
          designation: 'Inventory & Operations Manager',
          department: 'Logistics',
          basicSalary: 9500,
          allowances: 1800,
          deductions: 500,
          joinDate: new Date('2024-09-01'),
          status: 'ACTIVE' as const,
        },
      ];

      for (const s of seeds) {
        const emp = this.employeeRepository.create(s);
        await this.employeeRepository.save(emp);
      }
    }
  }

  async findAll(tenantId: string): Promise<Employee[]> {
    await this.seedDefaultEmployees(tenantId);
    return this.employeeRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, tenantId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found under this tenant.`);
    }
    return employee;
  }

  async create(dto: CreateEmployeeDto, tenantId: string): Promise<Employee> {
    const employee = this.employeeRepository.create({
      tenantId,
      ...dto,
      joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(),
      status: 'ACTIVE',
    });
    return this.employeeRepository.save(employee);
  }

  async update(id: string, dto: UpdateEmployeeDto, tenantId: string): Promise<Employee> {
    const employee = await this.findOne(id, tenantId);
    
    const basicSalary = dto.basicSalary !== undefined ? Number(dto.basicSalary) : Number(employee.basicSalary);
    const allowances = dto.allowances !== undefined ? Number(dto.allowances) : Number(employee.allowances);
    const deductions = dto.deductions !== undefined ? Number(dto.deductions) : Number(employee.deductions);
    const joinDate = dto.joinDate ? new Date(dto.joinDate) : employee.joinDate;

    const updated = Object.assign(employee, {
      ...dto,
      basicSalary,
      allowances,
      deductions,
      joinDate,
    });

    return this.employeeRepository.save(updated);
  }

  async remove(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.findOne(id, tenantId);
    employee.status = 'INACTIVE';
    return this.employeeRepository.save(employee);
  }

  async sendPayslip(id: string, month: string, year: number, tenantId: string): Promise<{ success: boolean; mode: string; details: any }> {
    const employee = await this.findOne(id, tenantId);
    if (employee.status !== 'ACTIVE') {
      throw new Error(`Cannot send pay slip to inactive employee: ${employee.name}`);
    }

    const basicSalary = Number(employee.basicSalary);
    const allowances = Number(employee.allowances);
    const deductions = Number(employee.deductions);

    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    // Create a beautiful premium HTML pay slip template
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FilsDesk Payslip</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
          .meta-info { display: grid; grid-template-columns: 1fr 1fr; padding: 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .meta-info div { margin-bottom: 4px; }
          .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .salary-table th { background: #f8fafc; font-weight: 600; text-align: left; padding: 10px 16px; border-bottom: 2px solid #e2e8f0; }
          .salary-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
          .total-row { font-weight: 700; background: #f8fafc; }
          .net-salary-box { margin: 24px 20px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; text-align: center; }
          .net-salary-box h2 { margin: 0; font-size: 22px; color: #1e3a8a; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FilsDesk Accounting Platform</h1>
            <p>EMPLOYEE PAY SLIP - ${month.toUpperCase()} ${year}</p>
          </div>
          
          <div class="meta-info">
            <div><strong>Employee:</strong> ${employee.name}</div>
            <div><strong>Employee ID:</strong> ${employee.id}</div>
            <div><strong>Designation:</strong> ${employee.designation}</div>
            <div><strong>Department:</strong> ${employee.department}</div>
            <div><strong>Issue Date:</strong> ${new Date().toLocaleDateString('en-AE')}</div>
            <div><strong>Base Currency:</strong> AED</div>
          </div>
          
          <table class="salary-table">
            <thead>
              <tr>
                <th>Earnings & Deductions</th>
                <th style="text-align: right;">Amount (AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td style="text-align: right;">${basicSalary.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Allowances (Housing, Transport, etc.)</td>
                <td style="text-align: right; color: #059669;">+ ${allowances.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Deductions (Absences, Taxes, etc.)</td>
                <td style="text-align: right; color: #dc2626;">- ${deductions.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Gross Salary</td>
                <td style="text-align: right;">${grossSalary.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="net-salary-box">
            <div style="font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Net Salary Credited</div>
            <h2>AED ${netSalary.toFixed(2)}</h2>
          </div>
          
          <div class="footer">
            <p>This is a system-generated electronic pay slip managed via FilsDesk.</p>
            <p>&copy; ${year} FilsDesk Technologies. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const subject = `FilsDesk Pay Slip - ${month} ${year} (${employee.name})`;
    const result = await this.emailService.sendMail([employee.email], subject, htmlBody, tenantId);

    return {
      success: result.success,
      mode: result.mode,
      details: {
        employeeId: employee.id,
        name: employee.name,
        email: employee.email,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        month,
        year,
        sentAt: new Date().toISOString(),
        mailDetails: result.details,
      },
    };
  }

  async sendBulkPayslips(employeeIds: string[], month: string, year: number, tenantId: string): Promise<any[]> {
    const results = [];
    for (const id of employeeIds) {
      try {
        const res = await this.sendPayslip(id, month, year, tenantId);
        results.push({ employeeId: id, success: res.success, error: null });
      } catch (err) {
        results.push({ employeeId: id, success: false, error: err.message });
      }
    }
    return results;
  }
}
