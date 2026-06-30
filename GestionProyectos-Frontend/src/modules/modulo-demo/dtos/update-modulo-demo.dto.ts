export interface UpdateModuloDemoInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateModuloDemoDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateModuloDemoInput): UpdateModuloDemoDto => {
  const dto: UpdateModuloDemoDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
