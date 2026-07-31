import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { ConsciousnessLevel } from 'src/traige/enums/consciousness-level.enum';
import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';

export class CreateTriageDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  triagedById?: string;

  @IsEnum(TriageAcuity)
  acuity: TriageAcuity;

  @IsOptional()
  @IsEnum(TriageStatus)
  status?: TriageStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  chiefComplaint: string;

  @IsOptional()
  @IsString()
  assessmentNotes?: string;

  @IsOptional()
  @IsEnum(ConsciousnessLevel)
  consciousness?: ConsciousnessLevel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(30)
  @Max(45)
  temperatureC?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(300)
  heartRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(80)
  respiratoryRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(300)
  bloodPressureSystolic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(200)
  bloodPressureDiastolic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  painScore?: number;

  @IsOptional()
  @IsString()
  allergiesNoted?: string;

  @IsOptional()
  @IsEnum(Department)
  referredToDepartment?: Department;

  @IsOptional()
  @IsDateString()
  arrivedAt?: string;

  @IsOptional()
  @IsDateString()
  triagedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  queueNumber?: string;
}
