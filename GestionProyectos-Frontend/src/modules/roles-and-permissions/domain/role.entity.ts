export type PermissionMap = Record<string, Record<string, boolean>>;

export interface RoleData {
  id?: string;
  name?: string;
  description?: string;
  permissions?: PermissionMap;
  cargos?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export class Role {
  id: string | undefined;
  name: string | undefined;
  description: string;
  permissions: PermissionMap;
  cargos: string[];
  createdAt: string | null;
  updatedAt: string | null;

  constructor({
    id,
    name,
    description,
    permissions,
    cargos,
    createdAt,
    updatedAt
  }: RoleData = {}) {
    this.id = id;
    this.name = name;
    this.description = description ?? '';
    this.permissions = permissions ?? {};
    this.cargos = cargos ?? [];
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}
