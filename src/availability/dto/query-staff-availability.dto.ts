import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
