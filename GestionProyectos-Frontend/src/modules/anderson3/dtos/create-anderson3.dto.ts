export interface CreateAnderson3Input {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAnderson3Dto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateAnderson3Input): CreateAnderson3Dto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
