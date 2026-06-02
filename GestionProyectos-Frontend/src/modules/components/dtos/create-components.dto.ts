export interface CreateComponentsInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateComponentsDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateComponentsInput): CreateComponentsDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
