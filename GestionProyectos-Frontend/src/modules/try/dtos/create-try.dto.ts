export interface CreateTryInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateTryDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateTryInput): CreateTryDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
