export interface CreateLoginContentInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateLoginContentDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateLoginContentInput): CreateLoginContentDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
