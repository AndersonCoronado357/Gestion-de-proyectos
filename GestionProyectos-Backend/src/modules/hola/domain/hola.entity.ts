// Entidad de dominio Hola.

export interface HolaProps {
  id?: number | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

class Hola {
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
  }: HolaProps = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}

module.exports = Hola;
module.exports.default = Hola;
