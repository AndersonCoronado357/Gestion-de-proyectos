export interface CreateHomeInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateHomeDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateHomeInput): CreateHomeDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
