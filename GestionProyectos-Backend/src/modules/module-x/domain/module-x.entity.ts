// Entidad de dominio ModuleX.

export interface ModuleXProps {
  id?: number | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

class ModuleX {
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
  }: ModuleXProps = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}

module.exports = ModuleX;
module.exports.default = ModuleX;
