// DTO de actualización: sólo incluye campos definidos para no pisar valores
// nulos accidentalmente.

interface UpdateTryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

module.exports = (input: UpdateTryInput) => {
  const dto: UpdateTryInput = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
