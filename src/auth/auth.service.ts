import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, LessThan, Repository } from 'typeorm';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { JwtPayload } from 'common/interfaces/jwt-payload.interface';
import { PasswordService } from 'common/services/password.service';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthToken } from './entities/auth-token.entity';
import { TokenType } from './enums/authToken.enum';

type RefreshRequestUser = JwtPayload & { refreshToken: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    @InjectRepository(AuthToken)
    private readonly authTokensRepository: Repository<AuthToken>,
  ) { }

  async signup(dto: SignupDto): Promise<AuthTokensDto> {
    const user = await this.usersService.registerPatient(dto);
    const { tokens } = await this.issueTokens(user);
    return tokens;
  }

  async login(dto: LoginDto): Promise<Record<string, any>> {
    const user = await this.usersService.findByEmailOrUsername(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.verifyPassword(
      user,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.usersService.assertAccountUsable(user);
    const { tokens } = await this.issueTokens(user);
    return { tokens, user: user };
  }

  async refresh(requestUser: RefreshRequestUser): Promise<AuthTokensDto> {
    const user = await this.usersService.findById(requestUser.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    this.usersService.assertAccountUsable(user);

    const tokenHash = this.hashToken(requestUser.refreshToken);
    const storedToken = await this.authTokensRepository.findOne({
      where: {
        userId: user.id,
        type: TokenType.REFRESH,
        tokenHash,
        revokedAt: IsNull(),
      },
    });

    if (!storedToken) {
      await this.revokeAllRefreshTokens(user.id);
      throw new ForbiddenException('Refresh token reuse detected');
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      storedToken.revokedAt = new Date();
      await this.authTokensRepository.save(storedToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const { tokens, refreshTokenId } = await this.issueTokens(user);
    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenId = refreshTokenId;
    await this.authTokensRepository.save(storedToken);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      const storedToken = await this.authTokensRepository.findOne({
        where: {
          userId,
          type: TokenType.REFRESH,
          tokenHash,
          revokedAt: IsNull(),
        },
      });

      if (storedToken) {
        storedToken.revokedAt = new Date();
        await this.authTokensRepository.save(storedToken);
      }
      return;
    }

    await this.revokeAllRefreshTokens(userId);
  }

  async me(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  generateOpaqueToken(): string {
    return randomBytes(32).toString('hex');
  }

  async createHashedOpaqueToken(
    userId: string,
    type: TokenType,
    expiresAt: Date,
  ): Promise<string> {
    const token = this.generateOpaqueToken();
    const authToken = this.authTokensRepository.create({
      type,
      tokenHash: await this.passwordService.hash(token),
      userId,
      expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    });
    await this.authTokensRepository.save(authToken);
    return token;
  }

  private async issueTokens(
    user: User,
  ): Promise<{ tokens: AuthTokensDto; refreshTokenId: string }> {
    await this.purgeExpiredTokens(user.id);

    const payload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
    };

    const accessExpiresIn = this.configService.getOrThrow<string>(
      'jwt.accessExpiresIn',
    );
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      'jwt.refreshExpiresIn',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' as const },
        {
          secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
          expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' as const },
        {
          secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
          expiresIn: refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      ),
    ]);

    const authToken = this.authTokensRepository.create({
      type: TokenType.REFRESH,
      tokenHash: this.hashToken(refreshToken),
      userId: user.id,
      expiresAt: this.resolveExpiryDate(refreshExpiresIn),
      revokedAt: null,
      replacedByTokenId: null,
    });
    const savedToken = await this.authTokensRepository.save(authToken);

    return {
      tokens: {
        accessToken,
        refreshToken,
        mustResetPassword: user.status === AccountStatus.PENDING_RESET,
      },
      refreshTokenId: savedToken.id,
    };
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.authTokensRepository.update(
      {
        userId,
        type: TokenType.REFRESH,
        revokedAt: IsNull(),
      },
      { revokedAt: new Date() },
    );
  }

  private async purgeExpiredTokens(userId: string): Promise<void> {
    await this.authTokensRepository.delete({
      userId,
      expiresAt: LessThan(new Date()),
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private resolveExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + amount * multipliers[unit]);
  }
}
