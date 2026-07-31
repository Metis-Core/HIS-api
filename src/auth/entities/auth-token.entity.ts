import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'common/entities/base.entity';
import { TokenType } from 'src/auth/enums/authToken.enum';
import { User } from 'src/users/entities/user.entity';

@Entity('auth_tokens')
export class AuthToken extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;

  @Column()
  tokenHash: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  replacedByTokenId: string | null;
}
