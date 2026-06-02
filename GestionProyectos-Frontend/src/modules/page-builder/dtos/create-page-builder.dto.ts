export interface CreatePageBuilderInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreatePageBuilderDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreatePageBuilderInput): CreatePageBuilderDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
