export class Name {
  readonly value: string;

  constructor(value: string) {
    if (typeof value !== 'string' || !value.trim() || value.length > 200) {
      throw new Error('Invalid name');
    }
    this.value = value.trim();
  }
}
