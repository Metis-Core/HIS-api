import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';
import { DayClosing } from './day-closing.entity';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  receiptNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  invoiceId: string;

  @ManyToOne(() => Invoice, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.RECORDED,
  })
  status: PaymentStatus;

  @Column({ type: 'uuid' })
  receivedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'receivedById' })
  receivedBy: User;

  @Column({ type: 'timestamptz' })
  receivedAt: Date;

  @Index()
  @Column({ type: 'date' })
  businessDate: string;

  @Column({ type: 'uuid', nullable: true })
  voidedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'voidedById' })
  voidedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  voidedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  voidReason: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  closingId: string | null;

  @ManyToOne(() => DayClosing, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'closingId' })
  closing: DayClosing | null;
}
