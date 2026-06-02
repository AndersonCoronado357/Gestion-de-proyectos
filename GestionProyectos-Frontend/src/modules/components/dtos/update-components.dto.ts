export interface UpdateComponentsInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateComponentsDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateComponentsInput): UpdateComponentsDto => {
  const dto: UpdateComponentsDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
