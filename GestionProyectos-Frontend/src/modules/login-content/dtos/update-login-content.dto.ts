export interface UpdateLoginContentInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateLoginContentDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateLoginContentInput): UpdateLoginContentDto => {
  const dto: UpdateLoginContentDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
