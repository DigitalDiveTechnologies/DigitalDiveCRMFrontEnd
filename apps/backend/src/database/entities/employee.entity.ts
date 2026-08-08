import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('employees')
@Index(['tenantId'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  tenantId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  designation: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  basicSalary: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'date', nullable: true })
  joinDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
