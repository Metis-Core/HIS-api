import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { UserRole } from 'common/enums/userRoles.enum';

export class QueryStaffAvailabilityDto extends BaseFilterDTO {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  /** Administrators only: also list accounts that are not active yet or are suspended. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  includeInactive?: boolean;
}
