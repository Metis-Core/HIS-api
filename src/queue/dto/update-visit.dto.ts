import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { VisitStatusEnum } from 'src/queue/enums/visit-status.enum';
import { VisitTypeEnum } from 'src/queue/enums/visit-type.enum';

export class UpdateVisitDTO {
  @IsOptional()
  @IsEnum(VisitTypeEnum)
  visitType?: VisitTypeEnum;

  @IsOptional()
  @IsEnum(VisitStatusEnum)
  status?: VisitStatusEnum;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
