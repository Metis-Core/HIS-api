import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';

export class QueryTriageDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  triagedById?: string;

  @IsOptional()
  @IsEnum(TriageAcuity)
  acuity?: TriageAcuity;

  @IsOptional()
  @IsEnum(TriageStatus)
  status?: TriageStatus;

  @IsOptional()
  @IsEnum(Department)
  referredToDepartment?: Department;

  @IsOptional()
  @IsDateString()
  arrivedFrom?: string;

  @IsOptional()
  @IsDateString()
  arrivedTo?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsIn(['createdAt', 'arrivedAt', 'acuity', 'status', 'triagedAt'])
  sortBy?: 'createdAt' | 'arrivedAt' | 'acuity' | 'status' | 'triagedAt' =
    'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

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
  limit?: number = 20;
}
