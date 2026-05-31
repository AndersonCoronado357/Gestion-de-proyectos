export interface CreateModuleXInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateModuleXDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateModuleXInput): CreateModuleXDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
