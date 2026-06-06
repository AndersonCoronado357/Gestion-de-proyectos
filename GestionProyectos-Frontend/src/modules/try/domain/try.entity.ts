export interface TryData {
  id?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export class Try {
  id: string | undefined;
  name: string | undefined;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;

  constructor({
    id,
    name,
    description,
    isActive,
    createdAt,
    updatedAt
  }: TryData = {}) {
    this.id = id;
    this.name = name;
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}
