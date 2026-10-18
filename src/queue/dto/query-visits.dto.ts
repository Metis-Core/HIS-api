import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { VisitStatusEnum } from '../enums/visit-status.enum';
import { VisitTypeEnum } from '../enums/visit-type.enum';

export class QueryVisitsDTO extends BaseFilterDTO {
  @IsOptional()
  @IsUUID('4', { message: 'patientId must be a valid id' })
  patientId?: string;

  @IsOptional()
  @IsEnum(VisitStatusEnum, { message: 'status is not a valid visit status' })
  status?: VisitStatusEnum;

  @IsOptional()
  @IsEnum(VisitTypeEnum, { message: 'visitType is not a valid visit type' })
  visitType?: VisitTypeEnum;
}
