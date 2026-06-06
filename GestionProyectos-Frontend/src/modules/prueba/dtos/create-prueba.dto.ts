export interface CreatePruebaInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreatePruebaDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreatePruebaInput): CreatePruebaDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
