export interface UpdateAnderInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateAnderDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateAnderInput): UpdateAnderDto => {
  const dto: UpdateAnderDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
