import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Organizations & Branches Management')
@Controller('auth')
export class TenantController {
  private tenantsStore = [
    {
      id: 'tenant-dxb-90210',
      companyName: 'Al Futtaim Group',
      trn: '100123456700003',
      baseCurrency: 'AED',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tenant-default',
      companyName: 'Digital Dive Technologies',
      trn: '100999888700001',
      baseCurrency: 'AED',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  private branchesStore = [
    {
      id: 'b1',
      tenantId: 'tenant-dxb-90210',
      name: 'Dubai Mall Branch',
      code: 'DXB-01',
      location: 'Dubai Mall, Downtown Dubai',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b2',
      tenantId: 'tenant-dxb-90210',
      name: 'Mall of the Emirates Branch',
      code: 'DXB-02',
      location: 'MOE, Al Barsha, Dubai',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b3',
      tenantId: 'tenant-dxb-90210',
      name: 'Sharjah City Centre Branch',
      code: 'SHJ-01',
      location: 'City Centre, Sharjah',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-default',
      tenantId: 'tenant-default',
      name: 'Corporate HQ',
      code: 'HQ-01',
      location: 'Business Bay, Dubai',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  @Get('tenants')
  @ApiOperation({ summary: 'List all corporate organizations / tenants' })
  async getTenants() {
    return this.tenantsStore;
  }

  @Post('tenants')
  @ApiOperation({ summary: 'Create a new corporate tenant (Organization)' })
  async createTenant(@Body() body: any) {
    const newTenant = {
      id: `tenant-${Date.now()}`,
      companyName: body.companyName,
      trn: body.trn || 'N/A',
      baseCurrency: body.baseCurrency || 'AED',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.tenantsStore.push(newTenant);
    return newTenant;
  }

  @Get('tenants/:id/branches')
  @ApiOperation({ summary: 'List all operational branches under a tenant' })
  async getBranches(@Param('id') tenantId: string) {
    return this.branchesStore.filter((b) => b.tenantId === tenantId);
  }

  @Post('tenants/:id/branches')
  @ApiOperation({ summary: 'Create a new branch under a tenant' })
  async createBranch(@Param('id') tenantId: string, @Body() body: any) {
    const newBranch = {
      id: `br-${Date.now()}`,
      tenantId,
      name: body.name,
      code: body.code,
      location: body.location || 'UAE',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.branchesStore.push(newBranch);
    return newBranch;
  }
}
