export class VisitCheckedInEvent {
  static readonly channel = 'visit.checked_in';

  constructor(
    readonly visitId: string,
    readonly patientId: string,
    readonly checkedInById: string,
  ) {}
}
