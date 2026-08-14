import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { PasswordService } from 'common/services/password.service';
import { IPagination } from 'common/response-format';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.persistUser({
      email: createUserDto.email,
      username: createUserDto.username,
      password: createUserDto.password,
      role: createUserDto.role ?? UserRole.PATIENT,
      department: createUserDto.department,
      status: createUserDto.status ?? AccountStatus.PENDING_RESET,
      passwordLastChangedAt: null,
    });
  }

  async registerPatient(signupDto: SignupDto): Promise<User> {
    return this.persistUser({
      email: signupDto.email,
      username: signupDto.username,
      password: signupDto.password,
      role: UserRole.PATIENT,
      department: Department.RECEPTION,
      status: AccountStatus.ACTIVE,
      passwordLastChangedAt: new Date(),
    });
  }

  async findAll(query: QueryUsersDto): Promise<IPagination<User>> {
    const { page = 1, limit = 20, sortOrder = 'DESC' } = query;
    const qb = this.usersRepository.createQueryBuilder('user');

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query.department) {
      qb.andWhere('user.department = :department', {
        department: query.department,
      });
    }
    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.username) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('user.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      user.passwordHash = await this.passwordService.hash(
        updateUserDto.password,
      );
      user.passwordLastChangedAt = new Date();
      if (user.status === AccountStatus.PENDING_RESET) {
        user.status = AccountStatus.ACTIVE;
      }
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
    if (updateUserDto.status) {
      user.status = updateUserDto.status;
    }

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
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
