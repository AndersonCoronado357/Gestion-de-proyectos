export interface CreateHolaInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateHolaDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateHolaInput): CreateHolaDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
