import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PurchaseBill } from './purchase-bill.entity';
import { Item } from './item.entity';
import { VatCategory } from '../../modules/tax/vat-calculator.service';

@Entity('purchase_bill_lines')
export class PurchaseBillLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  billId: string;

  @ManyToOne(() => PurchaseBill, (bill) => bill.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billId' })
  bill: PurchaseBill;

  @Column({ type: 'uuid', nullable: true })
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ type: 'varchar', length: 250 })
  description: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ type: 'enum', enum: VatCategory, default: VatCategory.STANDARD })
  vatCategory: VatCategory;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  taxableAmount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  vatAmount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  lineTotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
