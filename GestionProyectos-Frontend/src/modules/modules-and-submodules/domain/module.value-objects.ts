export interface SubmoduleProps {
  id?: string;
  folderId?: string;
  name?: string;
  iconSvg?: string | null;
}

export class Submodule {
  id: string | undefined;
  folderId: string | undefined;
  name: string | undefined;
  iconSvg: string | null;

  constructor({ id, folderId, name, iconSvg }: SubmoduleProps = {}) {
    this.id = id;
    this.folderId = folderId;
    this.name = name;
    this.iconSvg = iconSvg ?? null;
  }
}
