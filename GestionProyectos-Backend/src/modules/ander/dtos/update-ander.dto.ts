// DTO de actualización: sólo incluye campos definidos para no pisar valores
// nulos accidentalmente.

interface UpdateAnderInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

module.exports = (input: UpdateAnderInput) => {
  const dto: UpdateAnderInput = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
