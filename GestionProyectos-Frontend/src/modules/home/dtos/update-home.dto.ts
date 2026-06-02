export interface UpdateHomeInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateHomeDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateHomeInput): UpdateHomeDto => {
  const dto: UpdateHomeDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
