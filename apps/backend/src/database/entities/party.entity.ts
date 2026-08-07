import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PartyType {
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  BOTH = 'BOTH',
}

@Entity('parties')
@Index(['tenantId', 'partyType'])
export class Party {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'enum', enum: PartyType, default: PartyType.CUSTOMER })
  partyType: PartyType;

  @Column({ type: 'varchar', length: 15, nullable: true })
  trn: string; // UAE Tax Registration Number

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  openingBalance: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
