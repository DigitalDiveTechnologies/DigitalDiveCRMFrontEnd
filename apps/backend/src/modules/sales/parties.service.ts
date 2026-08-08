import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Party, PartyType } from '../../database/entities/party.entity';
import { CreatePartyDto } from './parties.controller';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(Party)
    private readonly partyRepository: Repository<Party>,
  ) {}

  async getParties(tenantId: string): Promise<Party[]> {
    return this.partyRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createParty(tenantId: string, dto: CreatePartyDto): Promise<Party> {
    const party = this.partyRepository.create({
      tenantId,
      name: dto.name,
      partyType: (dto.type || (dto as any).partyType) as PartyType,
      trn: dto.trn,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      creditLimit: dto.creditLimit || 0,
      openingBalance: 0,
      isActive: true,
    });
    return this.partyRepository.save(party);
  }

  async getPartyById(tenantId: string, id: string): Promise<Party> {
    const party = await this.partyRepository.findOne({
      where: { tenantId, id },
    });
    if (!party) {
      throw new NotFoundException(`Party with ID ${id} not found.`);
    }
    return party;
  }

  async getPartyStatement(tenantId: string, partyId: string) {
    const party = await this.getPartyById(tenantId, partyId);
    // Simple mock stats for the statement, keeping it clean
    return {
      partyId: party.id,
      partyName: party.name,
      tenantId,
      openingBalance: Number(party.openingBalance),
      totalSales: 0.0,
      totalReceipts: 0.0,
      currentBalance: Number(party.openingBalance),
      currency: 'AED',
    };
  }
}
