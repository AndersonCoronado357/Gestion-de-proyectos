export interface UpdateTryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateTryDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateTryInput): UpdateTryDto => {
  const dto: UpdateTryDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
