// DTO de actualización: sólo incluye campos definidos para no pisar valores
// nulos accidentalmente.

interface UpdateHolaInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

module.exports = (input: UpdateHolaInput) => {
  const dto: UpdateHolaInput = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.description !== undefined) dto.description = input.description;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
};
