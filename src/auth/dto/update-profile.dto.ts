import { IsNotEmpty, IsString, Matches } from 'class-validator';

// Email stays admin-managed until there is a mail provider to verify a new address.
export class UpdateProfileDTO {
  @IsString({ message: 'username must be text' })
  @Matches(/^[a-zA-Z0-9._-]{3,32}$/, {
    message:
      'username must be 3-32 characters: letters, digits, dot, underscore or dash',
  })
  username: string;

  // Changing a sign-in identifier is sensitive, so the owner re-confirms their password.
  @IsString({ message: 'currentPassword must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;
}
