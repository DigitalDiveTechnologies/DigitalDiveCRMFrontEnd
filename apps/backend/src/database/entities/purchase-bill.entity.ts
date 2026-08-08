import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseBillLine } from './purchase-bill-line.entity';
import { Party } from './party.entity';

export enum PurchaseBillStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_bills')
@Index(['tenantId', 'billNumber'])
export class PurchaseBill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  billNumber: string; // generated sequential bill ID

  @Column({ type: 'varchar', length: 100 })
  supplierBillNumber: string; // reference bill ID from supplier

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'supplierId' })
  supplier: Party;

  @Column({ type: 'timestamp' })
  billDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 10, default: 'AED' })
  currency: string;

  @Column({ type: 'enum', enum: PurchaseBillStatus, default: PurchaseBillStatus.DRAFT })
  status: PurchaseBillStatus;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  vatTotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  grandTotal: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @OneToMany(() => PurchaseBillLine, (line) => line.bill, { cascade: true })
  lines: PurchaseBillLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
