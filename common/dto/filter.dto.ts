import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDTO } from '../pagination';

export class BaseFilterDTO extends PaginationQueryDTO {
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortOrder must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  createdAt?: Date;
}
