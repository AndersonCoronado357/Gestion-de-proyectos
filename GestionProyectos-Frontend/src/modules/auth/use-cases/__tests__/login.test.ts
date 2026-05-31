import { login } from '../login';
import type { AuthRepository } from '../../ports/auth.repository.js';
import type { AuthPreferences, AuthUser } from '../../domain/user.js';
import type { LoginInput } from '../../dtos/login.dto.js';
import type {
  AccessTokenData,
  LoginResponse,
  MeResponse
} from '../../domain/token.entity.js';

const fakeUser: AuthUser = {
  id: 1,
  username: 'admin',
  email: 'a@b.com',
  firstName: 'Admin',
  lastName: 'Test',
  phone: null,
  status: 1,
  lastLoginAt: null,
  roles: ['Super admin'],
  permissions: [],
  isSuper: true
};

const fakePrefs: AuthPreferences = {
  mode: 'light',
  accentHex: '#295072',
  fontFamily: 'inter',
  fontSize: 'md'
};

test('login passes mapped dto to repository and returns user + token + prefs', async () => {
  const calls: LoginInput[] = [];
  const repository: AuthRepository = {
    login: (dto) => {
      calls.push(dto);
      const res: LoginResponse = {
        accessToken: 'tok',
        expiresIn: 900,
        user: fakeUser,
        preferences: fakePrefs,
        remember: true
      };
      return Promise.resolve(res);
    },
    googleLogin: () =>
      Promise.resolve({
        accessToken: 'tok',
        expiresIn: 900,
        user: fakeUser,
        preferences: fakePrefs,
        remember: true
      } as LoginResponse),
    logout: () => Promise.resolve(),
    refresh: () =>
      Promise.resolve({ accessToken: 'r', expiresIn: 900 } as AccessTokenData),
    me: () => Promise.resolve({ user: fakeUser, preferences: fakePrefs } as MeResponse)
  };

  const result = await login({ repository })({
    username: 'admin',
    password: 'admin'
  });

  expect(calls).toEqual([{ username: 'admin', password: 'admin' }]);
  expect(result.accessToken).toBe('tok');
  expect(result.user.username).toBe('admin');
  expect(result.preferences.mode).toBe('light');
});
