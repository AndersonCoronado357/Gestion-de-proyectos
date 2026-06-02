export interface LoginContentData {
  id?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export class LoginContent {
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
  }: LoginContentData = {}) {
    this.id = id;
    this.name = name;
    this.description = description ?? null;
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}
