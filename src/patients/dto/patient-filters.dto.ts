import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender } from 'common/enums/gender.enum';
import { BloodType } from 'src/patients/enums/blood-type.enum';
import { MaritalStatus } from 'src/patients/enums/marital-status.enum';
import { PatientStatus } from 'src/patients/enums/patient-status.enum';
import { PatientType } from 'src/patients/enums/patient-type.enum';
import { BaseFilterDTO } from '../../../common/dto/filter.dto';

export class PatientFiltersDto extends BaseFilterDTO {

  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @IsOptional()
  @IsEnum(PatientType)
  type?: PatientType;

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
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirthFrom?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirthTo?: string;
}
