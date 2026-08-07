import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { SalesInvoiceLine } from './sales-invoice-line.entity';
import { Party } from './party.entity';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  READY_TO_POST = 'READY_TO_POST',
  POSTED = 'POSTED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('sales_invoices')
@Index(['tenantId', 'invoiceNumber'])
@Index(['tenantId', 'idempotencyKey'], { unique: true })
export class SalesInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'customerId' })
  customer: Party;

  @Column({ type: 'timestamp' })
  invoiceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 10, default: 'AED' })
  currency: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  vatTotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  idempotencyKey: string;

  @OneToMany(() => SalesInvoiceLine, (line) => line.invoice, { cascade: true })
  lines: SalesInvoiceLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
