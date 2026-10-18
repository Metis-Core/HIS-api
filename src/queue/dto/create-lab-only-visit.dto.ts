import { IsUUID } from 'class-validator';

export class CreateLabOnlyVisitDTO {
  @IsUUID('4', { message: 'patientId must be a valid patient id' })
  patientId: string;
}
