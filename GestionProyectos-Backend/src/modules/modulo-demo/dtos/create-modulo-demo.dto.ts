module.exports = (input) => ({
  name: input.name,
  description: input.description ?? null,
  isActive: input.isActive ?? true
});
