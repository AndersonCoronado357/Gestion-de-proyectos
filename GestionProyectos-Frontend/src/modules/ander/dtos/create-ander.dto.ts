export interface CreateAnderInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAnderDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateAnderInput): CreateAnderDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
