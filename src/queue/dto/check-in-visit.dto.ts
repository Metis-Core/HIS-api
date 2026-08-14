import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { VisitType } from 'src/queue/enums/visit-type.enum';

export class CheckInVisitDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
