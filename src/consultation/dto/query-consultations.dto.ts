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
  MaxLength,
  Min,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { ConsultationStatus } from 'src/consultation/enums/consultation-status.enum';
import { ConsultationType } from 'src/consultation/enums/consultation-type.enum';

export class QueryConsultationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsUUID()
  triageId?: string;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsDateString()
  startedFrom?: string;

  @IsOptional()
  @IsDateString()
  startedTo?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsIn(['createdAt', 'startedAt', 'completedAt', 'followUpDate'])
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt' | 'followUpDate' =
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
