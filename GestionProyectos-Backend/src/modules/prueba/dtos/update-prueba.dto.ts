// DTO de actualización: sólo incluye campos definidos para no pisar valores
// nulos accidentalmente.

interface UpdatePruebaInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

module.exports = (input: UpdatePruebaInput) => {
  const dto: UpdatePruebaInput = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
