export interface UpdatePageBuilderInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdatePageBuilderDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdatePageBuilderInput): UpdatePageBuilderDto => {
  const dto: UpdatePageBuilderDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
