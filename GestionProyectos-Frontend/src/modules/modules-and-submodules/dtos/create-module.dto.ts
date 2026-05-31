import type { SubmoduleData } from '../domain/module.entity.js';

export interface CreateModuleInput {
  name?: string;
  iconSvg?: string | null;
  submodules?: SubmoduleData[];
}

export interface CreateModuleDto {
  name: string | undefined;
  iconSvg: string | null;
  submodules: SubmoduleData[];
}

export const toCreateDto = ({
  name,
  iconSvg,
  submodules
}: CreateModuleInput = {}): CreateModuleDto => ({
  name,
  iconSvg: iconSvg ?? null,
  submodules: submodules ?? []
});
