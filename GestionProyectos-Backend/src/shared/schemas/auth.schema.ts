// Schemas OpenAPI del módulo de autenticación.
//
// El refresh token vive en una cookie HttpOnly — no aparece en el body.

module.exports = {
  LoginRequest: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string', example: 'admin' },
      password: { type: 'string', example: 'admin123' }
    }
  },
  LoginResponse: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/PublicUser' },
      accessToken: { type: 'string' },
      expiresIn: { type: 'number', description: 'TTL del access token (segundos)' }
    }
  },
  RefreshResponse: {
    type: 'object',
    properties: {
      accessToken: { type: 'string' },
      expiresIn: { type: 'number' }
    }
  },
  PublicUser: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      username: { type: 'string' },
      email: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      phone: { type: 'string', nullable: true },
      status: { type: 'number', description: '0=pending · 1=active · 2=inactive · 3=suspended' },
      lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
      roles: { type: 'array', items: { type: 'string' } },
      permissions: { type: 'array', items: { type: 'string' } },
      isSuper: {
        type: 'boolean',
        description: 'True si alguno de sus roles tiene is_super=1 (bypass de acceso).'
      }
    }
  }
};
