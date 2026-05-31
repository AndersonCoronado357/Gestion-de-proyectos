import type { SubmoduleData } from '../domain/module.entity.js';

export interface UpdateModuleInput {
  id?: string;
  name?: string;
  iconSvg?: string | null;
  submodules?: SubmoduleData[];
}

export interface UpdateModuleDto {
  id: string | undefined;
  name: string | undefined;
  iconSvg: string | null;
  submodules: SubmoduleData[];
}

export const toUpdateDto = ({
  id,
  name,
  iconSvg,
  submodules
}: UpdateModuleInput = {}): UpdateModuleDto => ({
  id,
  name,
  iconSvg: iconSvg ?? null,
  submodules: submodules ?? []
});
