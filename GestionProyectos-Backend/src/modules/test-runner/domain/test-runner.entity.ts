// Entidad de dominio TestRunner.

export interface TestRunnerProps {
  id?: number | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

class TestRunner {
  id: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;

  constructor({
    id,
    name,
    description,
    isActive,
    createdAt,
    updatedAt
  }: TestRunnerProps = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}

module.exports = TestRunner;
module.exports.default = TestRunner;
