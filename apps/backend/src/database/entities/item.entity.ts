import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { VatCategory } from '../../modules/tax/vat-calculator.service';

@Entity('items')
@Index(['tenantId', 'sku'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 50, default: 'PCS' })
  unit: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  salesPrice: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  purchasePrice: number;

  @Column({ type: 'enum', enum: VatCategory, default: VatCategory.STANDARD })
  vatCategory: VatCategory;

  @Column({ type: 'boolean', default: true })
  isInventoryItem: boolean;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  currentStock: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  reorderLevel: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
