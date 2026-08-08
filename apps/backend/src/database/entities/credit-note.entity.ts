import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { SalesInvoice } from './sales-invoice.entity';

@Entity('credit_notes')
@Index(['tenantId', 'creditNoteNumber'])
export class CreditNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  creditNoteNumber: string;

  @Column({ type: 'uuid' })
  originalInvoiceId: string;

  @ManyToOne(() => SalesInvoice)
  @JoinColumn({ name: 'originalInvoiceId' })
  originalInvoice: SalesInvoice;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  vatTotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  grandTotal: number;

  @Column({ type: 'varchar', length: 50, default: 'POSTED' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
