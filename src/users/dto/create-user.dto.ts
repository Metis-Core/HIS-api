import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from 'common/enums/userRoles.enum';
import { AccountStatus } from 'common/enums/userStatus.enum';
import { Department } from 'common/enums/department.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]{3,32}$/)
  username: string;

  @IsString()
  @MinLength(12)
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(Department)
  department: Department;

  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}
