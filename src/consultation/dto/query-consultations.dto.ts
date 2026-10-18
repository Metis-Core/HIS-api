import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDTO } from 'common/pagination';
import { Department } from 'common/enums/department.enum';
import { ConsultationStatus } from 'src/consultation/enums/consultation-status.enum';
import { ConsultationType } from 'src/consultation/enums/consultation-type.enum';

export class QueryConsultationsDto extends PaginationQueryDTO {
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
}
