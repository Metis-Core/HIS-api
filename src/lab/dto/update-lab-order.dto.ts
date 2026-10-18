import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LabPriority } from '../enums/lab-priority.enum';

// Status follows from the tests (verification completes an order), so it cannot be set here.
export class UpdateLabOrderDto {
  @IsOptional()
  @IsEnum(LabPriority, { message: 'priority must be routine, urgent or stat' })
  priority?: LabPriority;

  @IsOptional()
  @IsString({ message: 'clinicalNotes must be text' })
  @MaxLength(500, { message: 'clinicalNotes must be at most 500 characters' })
  clinicalNotes?: string;
}
