export interface CreatePreferencesInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreatePreferencesDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreatePreferencesInput): CreatePreferencesDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
