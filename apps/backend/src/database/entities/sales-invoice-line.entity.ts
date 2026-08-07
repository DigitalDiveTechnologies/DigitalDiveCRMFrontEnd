import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesInvoice } from './sales-invoice.entity';
import { Item } from './item.entity';
import { VatCategory } from '../../modules/tax/vat-calculator.service';

@Entity('sales_invoice_lines')
export class SalesInvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => SalesInvoice, (inv) => inv.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: SalesInvoice;

  @Column({ type: 'uuid', nullable: true })
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  taxableAmount: number;

  @Column({ type: 'enum', enum: VatCategory, default: VatCategory.STANDARD })
  vatCategory: VatCategory;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0.05 })
  vatRate: number; // 0.05 for 5%

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  vatAmount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  lineTotal: number;

  @CreateDateColumn()
  createdAt: Date;
}
