export interface CreateNavigationInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateNavigationDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateNavigationInput): CreateNavigationDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
