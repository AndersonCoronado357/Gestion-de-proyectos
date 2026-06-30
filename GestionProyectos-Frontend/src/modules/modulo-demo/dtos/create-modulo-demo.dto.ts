export interface CreateModuloDemoInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateModuloDemoDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateModuloDemoInput): CreateModuloDemoDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
