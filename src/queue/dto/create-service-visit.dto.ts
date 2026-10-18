import { IsEnum, IsUUID } from 'class-validator';
import { ServiceVisitKind } from '../enums/service-visit.enum';

export class CreateServiceVisitDTO {
  @IsUUID('4', { message: 'patientId must be a valid patient id' })
  patientId: string;

  @IsEnum(ServiceVisitKind)
  service: ServiceVisitKind;
}
