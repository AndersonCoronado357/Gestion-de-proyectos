export interface UpdateHolaInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateHolaDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateHolaInput): UpdateHolaDto => {
  const dto: UpdateHolaDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
