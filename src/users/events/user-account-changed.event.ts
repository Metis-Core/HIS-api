export class UserAccountChangedEvent {
  static readonly channel = 'user.account_changed';

  constructor(readonly userId: string) {}
}
