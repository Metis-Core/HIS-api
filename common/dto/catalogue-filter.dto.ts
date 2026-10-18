import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDTO } from '../pagination';

/** Reference lists (services, lab tests, stock items) read best A→Z by name, so they default to ASC. */
export class CatalogueFilterDTO extends PaginationQueryDTO {
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortOrder must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
