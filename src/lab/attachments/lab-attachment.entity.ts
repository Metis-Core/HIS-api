import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { LabOrderItem } from '../entities/lab-order-item.entity';

/** A report or image attached to a lab result (L8). The bytes live in FileStorage under storageKey. */
@Entity('lab_attachments')
export class LabAttachment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => LabOrderItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: LabOrderItem;

  @Column({ type: 'varchar', length: 160 })
  fileName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  @Column({ type: 'char', length: 64 })
  sha256: string;

  @Column({ type: 'varchar', length: 255, unique: true, select: false })
  storageKey: string;

  @Column({ type: 'uuid' })
  uploadedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;
}
