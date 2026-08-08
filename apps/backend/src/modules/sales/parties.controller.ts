import { Controller, Post, Get, Body, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PartiesService } from './parties.service';

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
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of customers and suppliers' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getParties(@Headers('x-tenant-id') tenantId: string = 'tenant-default') {
    return this.partiesService.getParties(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer or supplier party record' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async createParty(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Body() dto: CreatePartyDto,
  ) {
    return this.partiesService.createParty(tenantId, dto);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get party ledger statement' })
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async getPartyStatement(
    @Headers('x-tenant-id') tenantId: string = 'tenant-default',
    @Param('id') partyId: string,
  ) {
    return this.partiesService.getPartyStatement(tenantId, partyId);
  }
}
