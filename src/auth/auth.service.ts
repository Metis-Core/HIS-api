import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUserCredentials(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      user.status === AccountStatus.SUSPENDED ||
      user.status === AccountStatus.INACTIVE
    ) {
      throw new ForbiddenException('Your account is inactive or suspended.');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      mustResetPassword: user.status === AccountStatus.PENDING_RESET,
    };
  }
}
