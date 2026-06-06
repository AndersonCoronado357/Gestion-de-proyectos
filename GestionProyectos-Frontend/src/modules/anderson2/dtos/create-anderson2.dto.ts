export interface CreateAnderson2Input {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAnderson2Dto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateAnderson2Input): CreateAnderson2Dto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
