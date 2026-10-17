import { IsNotEmpty, IsString } from 'class-validator';
import { IsPassword } from 'common/decorators/password.decorator';

export class ChangePasswordDTO {
  @IsString({ message: 'currentPassword must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsPassword()
  newPassword: string;
}
