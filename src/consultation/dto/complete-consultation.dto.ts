import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Department } from 'common/enums/department.enum';

export class CompleteConsultationDto {
  @IsOptional()
  @IsEnum(Department)
  nextDepartment?: Department;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
