import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'common/pagination';

export class QueryAdmissionsDTO extends PaginationQueryDTO {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;
}
