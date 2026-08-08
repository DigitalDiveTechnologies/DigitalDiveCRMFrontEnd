import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('sequences')
@Unique(['tenantId', 'sequenceType'])
export class Sequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 50 })
  sequenceType: string; // e.g. 'SALES_INVOICE', 'PURCHASE_BILL', 'JOURNAL_ENTRY', 'RECEIPT', 'CREDIT_NOTE'

  @Column({ type: 'varchar', length: 10, default: 'INV' })
  prefix: string;

  @Column({ type: 'integer', default: 1000 })
  lastNumber: number;

  @Column({ type: 'integer', default: 4 })
  padding: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
