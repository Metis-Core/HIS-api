import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'common/pagination';
import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';

export class QueryClinicRecordsDto extends PaginationQueryDTO {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsEnum(ClinicRecordKind)
  kind?: ClinicRecordKind;
}
