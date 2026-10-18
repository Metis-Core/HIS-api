import { AuthThrottlerGuard } from 'core/security/auth-throttler.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Public } from 'common/decorators/public.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import type { JwtPayload } from 'common/interfaces/jwt-payload.interface';
import { passwordPolicy } from 'common/security/password-policy';
import { JwtRefreshGuard } from 'core/guards/jwt-refresh.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDTO } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('password-policy')
  policy() {
    return passwordPolicy();
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(AuthThrottlerGuard)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(
    @Req()
    req: {
      user: JwtPayload & { refreshToken: string };
    },
  ) {
    return this.authService.refresh(req.user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(user.id, body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @UseGuards(AuthThrottlerGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDTO,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Patch('me')
  @UseGuards(AuthThrottlerGuard)
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDTO,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
