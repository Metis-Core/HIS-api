import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';

export class CompleteConsultationDto {
  @IsOptional()
  @IsEnum(Department)
  nextDepartment?: Department;

  @IsOptional()
  @IsArray()
  @IsEnum(VisitIntenentsEnum, { each: true })
  nextIntents?: VisitIntenentsEnum[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
