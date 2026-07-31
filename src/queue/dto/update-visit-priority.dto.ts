import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVisitPriorityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;
}
