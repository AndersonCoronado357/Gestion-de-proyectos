export interface SubmoduleData {
  id?: string;
  folderId?: string;
  name?: string;
  iconSvg?: string | null;
}

export interface ModuleData {
  id?: string;
  name?: string;
  iconSvg?: string | null;
  submodules?: SubmoduleData[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export class Module {
  id: string | undefined;
  name: string | undefined;
  iconSvg: string | null;
  submodules: SubmoduleData[];
  createdAt: string | null;
  updatedAt: string | null;

  constructor({
    id,
    name,
    iconSvg,
    submodules,
    createdAt,
    updatedAt
  }: ModuleData = {}) {
    this.id = id;
    this.name = name;
    this.iconSvg = iconSvg ?? null;
    this.submodules = submodules ?? [];
    this.createdAt = createdAt ?? null;
    this.updatedAt = updatedAt ?? null;
  }
}
