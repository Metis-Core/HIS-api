import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { AuditAction } from '../enums/audit-action.enum';

export class AuditLogQueryDTO extends BaseFilterDTO {
  @IsOptional()
  @IsString({ message: 'entityType must be a string' })
  @MaxLength(64)
  entityType?: string;

  @IsOptional()
  @IsString({ message: 'entityId must be a string' })
  @MaxLength(64)
  entityId?: string;

  @IsOptional()
  @IsUUID(undefined, { message: 'actorId must be a valid UUID' })
  actorId?: string;

  @IsOptional()
  @IsEnum(AuditAction, { message: 'action is not a valid audit action' })
  action?: AuditAction;

  @IsOptional()
  @IsDateString({}, { message: 'from must be an ISO 8601 date' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be an ISO 8601 date' })
  to?: string;
}
