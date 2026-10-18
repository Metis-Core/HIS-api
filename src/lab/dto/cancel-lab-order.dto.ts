import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelLabOrderDto {
  @IsOptional()
  @IsString({ message: 'reason must be text' })
  @MaxLength(500, { message: 'reason must be at most 500 characters' })
  reason?: string;
}
