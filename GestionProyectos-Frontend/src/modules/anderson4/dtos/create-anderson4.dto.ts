export interface CreateAnderson4Input {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateAnderson4Dto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateAnderson4Input): CreateAnderson4Dto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
