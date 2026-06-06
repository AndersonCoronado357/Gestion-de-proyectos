export interface UpdateAnderson2Input {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateAnderson2Dto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateAnderson2Input): UpdateAnderson2Dto => {
  const dto: UpdateAnderson2Dto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
