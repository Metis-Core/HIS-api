import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from 'common/enums/gender.enum';
import { BloodType } from 'src/patients/enums/blood-type.enum';
import { MaritalStatus } from 'src/patients/enums/marital-status.enum';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { PatientType } from 'src/patients/enums/patient-type.enum';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Z0-9-]+$/)
  mrn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @IsOptional()
  @IsEnum(PatientType)
  type?: PatientType;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationalId?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  allergies?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  userId?: string | null;
}
