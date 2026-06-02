export interface UpdatePreferencesInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdatePreferencesDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdatePreferencesInput): UpdatePreferencesDto => {
  const dto: UpdatePreferencesDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
