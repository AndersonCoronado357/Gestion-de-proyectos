// Entidad de dominio Anderson3.

export interface Anderson3Props {
  id?: number | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

class Anderson3 {
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
  }: Anderson3Props = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}

module.exports = Anderson3;
module.exports.default = Anderson3;
