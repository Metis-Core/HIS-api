import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { AdmitPatientDTO } from 'src/admissions/dto/admit-patient.dto';
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

  /** Admit the patient to a ward as part of signing (D6). */
  @IsOptional()
  @ValidateNested()
  @Type(() => AdmitPatientDTO)
  admission?: AdmitPatientDTO;
}
