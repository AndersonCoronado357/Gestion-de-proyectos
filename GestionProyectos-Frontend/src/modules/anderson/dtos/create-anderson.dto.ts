export interface CreateAndersonInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAndersonDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateAndersonInput): CreateAndersonDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
