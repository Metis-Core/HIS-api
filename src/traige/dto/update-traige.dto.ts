import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { ConsciousnessLevel } from 'src/traige/enums/consciousness-level.enum';
import { TriageAcuity } from 'src/traige/enums/triage-acuity.enum';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';

export class UpdateTriageDto {
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
  @IsString()
  @MaxLength(500)
  chiefComplaint?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  assessmentNotes?: string | null;

  @IsOptional()
  @IsEnum(ConsciousnessLevel)
  consciousness?: ConsciousnessLevel;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(30)
  @Max(45)
  temperatureC?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(300)
  heartRate?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(80)
  respiratoryRate?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(300)
  bloodPressureSystolic?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(200)
  bloodPressureDiastolic?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(100)
  oxygenSaturation?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(500)
  weightKg?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(300)
  heightCm?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  painScore?: number | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  allergiesNoted?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsEnum(Department)
  referredToDepartment?: Department | null;

  @IsOptional()
  @IsDateString()
  arrivedAt?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsDateString()
  triagedAt?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsDateString()
  completedAt?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(32)
  queueNumber?: string | null;
}
