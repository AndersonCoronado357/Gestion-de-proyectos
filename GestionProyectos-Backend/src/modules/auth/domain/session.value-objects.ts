// Value object: UserId.

class UserId {
  value: string;

  constructor(value: string | number) {
    if (value === undefined || value === null || value === '') {
      throw new Error('Invalid userId');
    }
    this.value = String(value);
  }
}

module.exports = { UserId };
