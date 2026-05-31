export interface UpdateModuleXInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateModuleXDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateModuleXInput): UpdateModuleXDto => {
  const dto: UpdateModuleXDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
