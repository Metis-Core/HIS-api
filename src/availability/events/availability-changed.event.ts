export class AvailabilityChangedEvent {
  static readonly channel = 'availability.changed';

  constructor(readonly userId: string) {}
}
