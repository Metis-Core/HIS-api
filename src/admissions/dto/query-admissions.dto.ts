import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'common/pagination';

export class QueryAdmissionsDTO extends PaginationQueryDTO {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  /** true = discharged stays only, false = patients still in the ward. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  discharged?: boolean;
}
