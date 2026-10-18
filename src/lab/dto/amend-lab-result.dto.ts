import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { LabResultData } from '../results/result-schema.types';

export class AmendLabResultDTO {
  @IsObject({ message: 'resultData must be an object of field values' })
  resultData: LabResultData;

  @IsOptional()
  @IsString({ message: 'resultNotes must be text' })
  @MaxLength(2000, { message: 'resultNotes must be at most 2000 characters' })
  resultNotes?: string;

  @IsString({ message: 'reason must be text' })
  @IsNotEmpty({ message: 'A reason is required to amend a verified result' })
  @MinLength(5, { message: 'reason must be at least 5 characters' })
  @MaxLength(500, { message: 'reason must be at most 500 characters' })
  reason: string;
}
