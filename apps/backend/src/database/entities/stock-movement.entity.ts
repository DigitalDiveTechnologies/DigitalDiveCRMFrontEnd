import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from './item.entity';
import { Warehouse } from './warehouse.entity';

export enum StockMovementType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

@Entity('stock_movements')
@Index(['tenantId', 'itemId', 'warehouseId'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  quantity: number; // positive for stock-in, negative for stock-out

  @Column({ type: 'enum', enum: StockMovementType })
  movementType: StockMovementType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceDocumentId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sourceDocumentType: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  costPrice: number;

  @CreateDateColumn()
  createdAt: Date;
}
