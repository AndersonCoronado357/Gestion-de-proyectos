export interface UpdateAnderson4Input {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateAnderson4Dto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateAnderson4Input): UpdateAnderson4Dto => {
  const dto: UpdateAnderson4Dto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
