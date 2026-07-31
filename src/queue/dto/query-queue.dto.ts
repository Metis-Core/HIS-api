import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { QueueEntryStatus } from 'src/queue/enums/queue-entry-status.enum';
import { VisitStatus } from 'src/queue/enums/visit-status.enum';
import { VisitType } from 'src/queue/enums/visit-type.enum';

export class QueryQueueDto {
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsEnum(QueueEntryStatus)
  status?: QueueEntryStatus;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @IsOptional()
  @IsEnum(VisitStatus)
  visitStatus?: VisitStatus;

  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
