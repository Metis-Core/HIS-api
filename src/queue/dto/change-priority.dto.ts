import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TriageCategory } from '../enums/triage-category.enum';

export class ChangePriorityDTO {
  @IsEnum(TriageCategory, {
    message: `triageCategory must be one of: ${Object.values(TriageCategory).join(', ')}`,
  })
  triageCategory: TriageCategory;

  @IsString({ message: 'reason must be text' })
  @IsNotEmpty({ message: 'reason is required' })
  @MinLength(3, { message: 'reason must be at least 3 characters' })
  @MaxLength(255, { message: 'reason must be at most 255 characters' })
  reason: string;
}
