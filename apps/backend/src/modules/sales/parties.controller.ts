import { Controller, Post, Get, Body, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';

export interface CreatePartyDto {
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  trn?: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
}

@ApiTags('Parties (Customers & Suppliers)')
@Controller('parties')
export class PartiesController {
  private partiesStore: any[] = [];

  @Get()
  @ApiOperation({ summary: 'Get list of customers and suppliers' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getParties(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.partiesStore.filter((p) => p.tenantId === tenantId || tenantId === 'tenant-default');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer or supplier party record' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createParty(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreatePartyDto,
  ) {
    const newParty = {
      id: `pty-${Date.now()}`,
      tenantId,
      ...dto,
      createdAt: new Date().toISOString(),
    };
    this.partiesStore.push(newParty);
    return newParty;
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get party ledger statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getPartyStatement(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') partyId: string,
  ) {
    return {
      partyId,
      tenantId,
      openingBalance: 0.0,
      totalSales: 0.0,
      totalReceipts: 0.0,
      currentBalance: 0.0,
      currency: 'AED',
    };
  }
}
