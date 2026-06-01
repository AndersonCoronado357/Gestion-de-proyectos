export interface UpdateTestRunnerInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateTestRunnerDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export const toUpdateDto = (input: UpdateTestRunnerInput): UpdateTestRunnerDto => {
  const dto: UpdateTestRunnerDto = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
