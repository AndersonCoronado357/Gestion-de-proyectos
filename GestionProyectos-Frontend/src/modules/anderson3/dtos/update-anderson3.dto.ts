export interface UpdateAnderson3Input {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateAnderson3Dto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateAnderson3Input): UpdateAnderson3Dto => {
  const dto: UpdateAnderson3Dto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
