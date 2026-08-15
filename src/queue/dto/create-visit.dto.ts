import { IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { VisitIntenentsEnum, VisitTypeEnum } from 'src/queue/enums/visit-type.enum';

export class CreateVisitDTO {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsEnum(VisitTypeEnum)
  visitType?: VisitTypeEnum;

  @IsArray()
  @IsEnum(VisitIntenentsEnum, { each: true })
  intent: VisitIntenentsEnum[];
}
