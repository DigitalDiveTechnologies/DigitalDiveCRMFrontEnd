import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseBill } from './purchase-bill.entity';

@Entity('supplier_payments')
@Index(['tenantId', 'paymentNumber'])
export class SupplierPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentNumber: string;

  @Column({ type: 'uuid' })
  billId: string;

  @ManyToOne(() => PurchaseBill)
  @JoinColumn({ name: 'billId' })
  bill: PurchaseBill;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string; // CASH, BANK_TRANSFER, CHEQUE

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
