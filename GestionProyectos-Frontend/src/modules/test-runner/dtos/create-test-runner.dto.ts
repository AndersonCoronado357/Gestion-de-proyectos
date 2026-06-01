export interface CreateTestRunnerInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateTestRunnerDto {
  name: string;
  description: string | null;
  isActive: boolean;
}

export const toCreateDto = (input: CreateTestRunnerInput): CreateTestRunnerDto => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
