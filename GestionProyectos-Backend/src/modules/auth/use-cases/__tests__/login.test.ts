import bcrypt from 'bcryptjs';

const buildUseCase = require('../login');

// Helpers para construir un user row "mínimo" listo para los tests.
const baseUser = (overrides: Record<string, unknown> = {}) => ({
  id: 42,
  username: 'admin',
  email: 'admin@test.local',
  password_hash: bcrypt.hashSync('admin123', 4),
  first_name: 'Admin',
  last_name: 'Test',
  phone: null,
  status: 1,
  last_login_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides
});

describe('login use case', () => {
  let userRepository: {
    findByUsername: jest.Mock;
    findById: jest.Mock;
    findWithAccessById: jest.Mock;
    updateLastLogin: jest.Mock;
  };
  let tokenRepository: {
    save: jest.Mock;
    findActiveByHash: jest.Mock;
    revoke: jest.Mock;
    revokeAllForUser: jest.Mock;
  };

  beforeEach(() => {
    userRepository = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findWithAccessById: jest.fn().mockResolvedValue({
        ...baseUser(),
        roles: ['Super admin'],
        permissions: ['users:read'],
        isSuper: true
      }),
      updateLastLogin: jest.fn().mockResolvedValue(undefined)
    };
    tokenRepository = {
      save: jest.fn().mockResolvedValue({}),
      findActiveByHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn()
    };
  });

  it('rechaza credenciales cuando el usuario no existe', async () => {
    userRepository.findByUsername.mockResolvedValue(undefined);
    await expect(
      buildUseCase({ userRepository, tokenRepository })({
        username: 'x',
        password: 'y'
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(tokenRepository.save).not.toHaveBeenCalled();
  });

  it('rechaza contraseña incorrecta', async () => {
    userRepository.findByUsername.mockResolvedValue(baseUser());
    await expect(
      buildUseCase({ userRepository, tokenRepository })({
        username: 'admin',
        password: 'wrong'
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('rechaza usuarios inactivos', async () => {
    userRepository.findByUsername.mockResolvedValue(baseUser({ status: 2 }));
    await expect(
      buildUseCase({ userRepository, tokenRepository })({
        username: 'admin',
        password: 'admin123'
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('emite tokens y actualiza last_login_at para credenciales válidas', async () => {
    userRepository.findByUsername.mockResolvedValue(baseUser());
    const result = await buildUseCase({ userRepository, tokenRepository })({
      username: 'admin',
      password: 'admin123'
    });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.tokens.expiresIn).toBeGreaterThan(0);
    expect(result.tokens.refreshExpiresIn).toBeGreaterThan(0);

    expect(result.user.username).toBe('admin');
    expect(result.user.roles).toContain('Super admin');

    // Sin preferencesRepository → debe devolver defaults.
    expect(result.preferences).toEqual({
      mode: 'light',
      accentHex: '#295072',
      fontFamily: 'inter',
      fontSize: 'md'
    });

    expect(tokenRepository.save).toHaveBeenCalledTimes(1);
    expect(userRepository.updateLastLogin).toHaveBeenCalledWith(42, expect.any(Date));

    // La sesión guarda SHA-256(refreshToken), no el token plano.
    const savedArg = tokenRepository.save.mock.calls[0][0];
    expect(savedArg.userId).toBe(42);
    expect(savedArg.tokenHash).toHaveLength(64);
    expect(savedArg.tokenHash).not.toBe(result.tokens.refreshToken);
  });

  it('devuelve las preferencias guardadas cuando el preferences repo está', async () => {
    userRepository.findByUsername.mockResolvedValue(baseUser());
    const preferencesRepository = {
      findByUserId: jest.fn().mockResolvedValue({
        mode: 'dark',
        accentHex: '#123456',
        fontFamily: 'mono',
        fontSize: 'lg'
      }),
      upsert: jest.fn()
    };

    const result = await buildUseCase({
      userRepository,
      tokenRepository,
      preferencesRepository
    })({ username: 'admin', password: 'admin123' });

    expect(preferencesRepository.findByUserId).toHaveBeenCalledWith(42);
    expect(result.preferences).toEqual({
      mode: 'dark',
      accentHex: '#123456',
      fontFamily: 'mono',
      fontSize: 'lg'
    });
  });
});
