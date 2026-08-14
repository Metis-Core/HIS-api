import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender } from 'common/enums/gender.enum';
import { BloodType } from 'src/patients/enums/blood-type.enum';
import { MaritalStatus } from 'src/patients/enums/marital-status.enum';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { PatientType } from 'src/patients/enums/patient-type.enum';
import { CreateContactDTO } from '../../contacts/dto/create-contact.dto';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsDateString()
  dateOfBirth: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  insurancePolicyNumber?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  emergencyContact: CreateContactDTO
}
