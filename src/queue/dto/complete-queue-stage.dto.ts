import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Department } from 'common/enums/department.enum';

export class CompleteQueueStageDto {
  @IsOptional()
  @IsEnum(Department)
  nextDepartment?: Department;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUUID()
  triageId?: string;
}
