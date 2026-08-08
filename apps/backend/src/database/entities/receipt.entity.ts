import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { SalesInvoice } from './sales-invoice.entity';

@Entity('receipts')
@Index(['tenantId', 'receiptNumber'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => SalesInvoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: SalesInvoice;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // CASH, BANK_TRANSFER, CREDIT_CARD, CHEQUE

  @Column({ type: 'timestamp' })
  paymentDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string;

  @Column({ type: 'text', nullable: true })
  narration: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
