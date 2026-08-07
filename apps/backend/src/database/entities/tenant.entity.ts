import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Branch } from './branch.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  companyName: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  trn: string; // UAE Tax Registration Number (15 digits)

  @Column({ type: 'varchar', length: 3, default: 'AED' })
  baseCurrency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Branch, (branch) => branch.tenant)
  branches: Branch[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
