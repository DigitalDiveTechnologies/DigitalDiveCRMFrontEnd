import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { User } from '../../database/entities/user.entity';

@ApiTags('Organizations & Branches Management')
@Controller('auth')
export class TenantController {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('tenants')
  @ApiOperation({ summary: 'List all corporate organizations / tenants' })
  async getTenants() {
    return this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new corporate tenant (Organization)' })
  async createTenant(@Body() body: any) {
    const tenant = this.tenantRepository.create({
      companyName: body.companyName,
      trn: body.trn || 'N/A',
      baseCurrency: body.baseCurrency || 'AED',
      isActive: true,
    });
    return this.tenantRepository.save(tenant);
  }

  @Delete('tenants/:id')
  @ApiOperation({ summary: 'Delete a corporate tenant and its branches/users context' })
  async deleteTenant(@Param('id') tenantId: string) {
    // Delete users associated with this tenant
    await this.userRepository.delete({ tenantId });
    // Delete branches (cascade will delete them, but explicitly clean up if needed)
    await this.branchRepository.delete({ tenantId });
    // Delete tenant
    await this.tenantRepository.delete(tenantId);
    return { success: true };
  }

  @Get('tenants/:id/branches')
  @ApiOperation({ summary: 'List all operational branches under a tenant' })
  async getBranches(@Param('id') tenantId: string) {
    return this.branchRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
  }

  @Post('tenants/:id/branches')
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  async createBranch(@Param('id') tenantId: string, @Body() body: any) {
    const branch = this.branchRepository.create({
      tenantId,
      name: body.name,
      code: body.code,
      address: body.location || body.address || 'UAE',
      isActive: true,
    });
    return this.branchRepository.save(branch);
  }

  @Delete('branches/:id')
  @ApiOperation({ summary: 'Delete an operational branch' })
  async deleteBranch(@Param('id') branchId: string) {
    await this.branchRepository.delete(branchId);
    return { success: true };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user access mapping' })
  async deleteUser(@Param('id') userId: string) {
    await this.userRepository.delete(userId);
    return { success: true };
  }
}
