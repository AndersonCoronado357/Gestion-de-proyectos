import { http } from '../../../../shared/utils/http.js';
import { AuthRepository } from '../../ports/auth.repository.js';
import type {
  AccessTokenData,
  LoginResponse,
  MeResponse
} from '../../domain/token.entity.js';
import type { LoginInput } from '../../dtos/login.dto.js';

export class AuthHttpAdapter extends AuthRepository {
  async login(credentials: LoginInput): Promise<LoginResponse> {
    const data = await http<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuthRefresh: true
    });
    if (!data) throw new Error('Empty login response');
    return data;
  }

  async googleLogin(credential: string): Promise<LoginResponse> {
    const data = await http<LoginResponse>('/auth/google', {
      method: 'POST',
      body: { credential },
      skipAuthRefresh: true
    });
    if (!data) throw new Error('Empty Google login response');
    return data;
  }

  async logout(): Promise<void> {
    await http('/auth/logout', { method: 'POST', skipAuthRefresh: true });
  }

  async refresh(): Promise<AccessTokenData> {
    const data = await http<AccessTokenData>('/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true
    });
    if (!data) throw new Error('Empty refresh response');
    return data;
  }

  async me(): Promise<MeResponse> {
    const data = await http<MeResponse>('/auth/me', { method: 'GET' });
    if (!data) throw new Error('Empty me response');
    return data;
  }
}
