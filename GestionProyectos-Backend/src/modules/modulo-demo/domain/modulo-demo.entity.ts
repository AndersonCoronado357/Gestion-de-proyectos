// Entidad de dominio ModuloDemo.

export interface ModuloDemoProps {
  id?: number | null;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

class ModuloDemo {
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
  }: ModuloDemoProps = {}) {
    this.id = id ?? null;
    this.name = name ?? '';
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}

module.exports = ModuloDemo;
module.exports.default = ModuloDemo;
