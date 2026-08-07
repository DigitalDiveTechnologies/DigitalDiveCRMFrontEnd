import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { JournalLine } from './journal-line.entity';

@Entity('journal_entries')
@Index(['tenantId', 'postingDate'])
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'varchar', length: 100 })
  sourceDocumentId: string;

  @Column({ type: 'varchar', length: 50 })
  sourceDocumentType: string;

  @Column({ type: 'timestamp' })
  postingDate: Date;

  @Column({ type: 'text' })
  narration: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalDebit: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalCredit: number;

  @Column({ type: 'boolean', default: true })
  isPosted: boolean;

  @OneToMany(() => JournalLine, (line) => line.journalEntry, { cascade: true })
  lines: JournalLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
