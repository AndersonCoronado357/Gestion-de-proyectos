module.exports = {
  ModuleX: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  CreateModuleX: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', maxLength: 200 },
      description: { type: 'string', nullable: true },
      isActive: { type: 'boolean' }
    }
  },
  UpdateModuleX: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 200 },
      description: { type: 'string', nullable: true },
      isActive: { type: 'boolean' }
    }
  }
};
