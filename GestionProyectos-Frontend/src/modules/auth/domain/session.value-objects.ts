export class UserId {
  readonly value: string;

  constructor(value: string | number) {
    if (!value) throw new Error('Invalid userId');
    this.value = String(value);
  }
}
