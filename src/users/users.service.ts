import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { IPagination } from 'common/response-format';
import { Department } from 'common/enums/department.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { PasswordService } from 'common/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { User } from './entities/user.entity';
import { assertCanDelete, assertCanManage } from './user-access.policy';
import { BaseCrudService } from '../../common/services/crud.service';

@Injectable()
export class UsersService extends BaseCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {
    super(usersRepository);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.persistUser({
      email: createUserDto.email,
      username: createUserDto.username,
      password: createUserDto.password,
      role: createUserDto.role,
      department: createUserDto.department,
      status: createUserDto.status ?? AccountStatus.PENDING_RESET,
      passwordLastChangedAt: null,
    });
  }

  async search(query: QueryUsersDto): Promise<IPagination<User>> {
    const {
      page = 1,
      limit = 20,
      sortOrder = 'DESC',
      role,
      department,
      status,
    } = query;
    const base: FindOptionsWhere<User> = {
      ...(role ? { role } : {}),
      ...(department ? { department } : {}),
      ...(status ? { status } : {}),
    };
    const term = query.search?.trim();
    const where = term
      ? [
          { ...base, username: ILike(`%${term}%`) },
          { ...base, email: ILike(`%${term}%`) },
        ]
      : base;

    return this.findManyWithPagination({
      where,
      order: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email OR user.username = :username', {
        email: identifier.toLowerCase(),
        username: identifier,
      })
      .getOne();
  }

  async updateAsActor(
    id: string,
    updateUserDto: UpdateUserDto,
    actor: AuthenticatedUser,
  ): Promise<User> {
    const user = await this.findOne(id);
    assertCanManage(actor, user, updateUserDto);

    if (updateUserDto.password) {
      user.passwordHash = await this.passwordService.hash(
        updateUserDto.password,
      );
      user.passwordLastChangedAt = new Date();
      // An admin-set password is temporary; the owner must choose their own.
      user.status = AccountStatus.PENDING_RESET;
    }
    if (updateUserDto.email) {
      user.email = updateUserDto.email.toLowerCase();
    }
    if (updateUserDto.username) {
      user.username = updateUserDto.username;
    }
    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }
    if (updateUserDto.department) {
      user.department = updateUserDto.department;
    }
    if (updateUserDto.status && !updateUserDto.password) {
      user.status = updateUserDto.status;
    }

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async removeAsActor(id: string, actor: AuthenticatedUser): Promise<void> {
    const user = await this.findOne(id);
    assertCanDelete(actor, user);
    await this.remove(id);
  }

  async changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();
    // 400 rather than 401 so the client does not treat it as an expired session.
    if (!user || !(await this.verifyPassword(user, currentPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }

    user.passwordHash = await this.passwordService.hash(newPassword);
    user.passwordLastChangedAt = new Date();
    if (user.status === AccountStatus.PENDING_RESET) {
      user.status = AccountStatus.ACTIVE;
    }
    await this.usersRepository.save(user);
  }

  async updateOwnProfile(
    userId: string,
    changes: { username: string; currentPassword: string },
  ): Promise<User> {
    const { username } = changes;
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user || !(await this.verifyPassword(user, changes.currentPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const clash = await this.usersRepository.findOne({ where: { username } });
    if (clash && clash.id !== userId) {
      throw new ConflictException('Username already in use');
    }
    user.username = username;
    await this.usersRepository.save(user);
    return this.findOne(userId);
  }

  assertAccountUsable(user: User): void {
    if (
      user.status === AccountStatus.SUSPENDED ||
      user.status === AccountStatus.INACTIVE
    ) {
      throw new ForbiddenException('Your account is inactive or suspended.');
    }
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.passwordService.verify(user.passwordHash, password);
  }

  private async persistUser(input: {
    email: string;
    username: string;
    password: string;
    role: UserRole;
    department: Department;
    status: AccountStatus;
    passwordLastChangedAt: Date | null;
  }): Promise<User> {
    const email = input.email.toLowerCase();
    const existing = await this.usersRepository.findOne({
      where: [{ email }, { username: input.username }],
    });

    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = this.usersRepository.create({
      email,
      username: input.username,
      passwordHash,
      role: input.role,
      department: input.department,
      status: input.status,
      passwordLastChangedAt: input.passwordLastChangedAt,
    });

    const saved = await this.usersRepository.save(user);
    return this.findOne(saved.id);
  }
}
