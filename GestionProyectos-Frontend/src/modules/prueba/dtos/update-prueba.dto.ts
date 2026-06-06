export interface UpdatePruebaInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdatePruebaDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdatePruebaInput): UpdatePruebaDto => {
  const dto: UpdatePruebaDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
