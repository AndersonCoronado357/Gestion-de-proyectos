export interface UpdateNavigationInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateNavigationDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateNavigationInput): UpdateNavigationDto => {
  const dto: UpdateNavigationDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
