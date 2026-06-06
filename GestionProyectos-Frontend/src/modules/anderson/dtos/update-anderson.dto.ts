export interface UpdateAndersonInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateAndersonDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateAndersonInput): UpdateAndersonDto => {
  const dto: UpdateAndersonDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
