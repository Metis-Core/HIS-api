import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { Department } from 'common/enums/department.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role: UserRole;

  @Column({ type: 'enum', enum: Department })
  department: Department;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Column({ type: 'timestamp', nullable: true })
  passwordLastChangedAt: Date | null;
}
