import { ConsultationType } from '../enums/consultation-type.enum';

export class ConsultationStartedEvent {
  static readonly channel = 'consultation.started';

  constructor(
    readonly consultationId: string,
    readonly visitId: string,
    readonly doctorId: string,
    readonly type: ConsultationType,
  ) {}
}
