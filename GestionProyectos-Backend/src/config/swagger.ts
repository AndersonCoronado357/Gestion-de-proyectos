const moduleXSchemas = require('../shared/schemas/module-x.schema');
const authSchemas = require('../shared/schemas/auth.schema');

module.exports = {
  openapi: '3.0.0',
  info: { title: 'API', version: '0.1.0' },
  components: {
    schemas: { ...moduleXSchemas, ...authSchemas },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {}
};
