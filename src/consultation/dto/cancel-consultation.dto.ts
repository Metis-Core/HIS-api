import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelConsultationDTO {
  @IsOptional()
  @IsString({ message: 'The reason must be text' })
  @MaxLength(500, { message: 'The reason can be at most 500 characters' })
  reason?: string;
}
