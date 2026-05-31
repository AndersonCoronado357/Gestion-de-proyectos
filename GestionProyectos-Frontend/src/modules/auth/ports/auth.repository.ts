import type {
  AccessTokenData,
  LoginResponse,
  MeResponse
} from '../domain/token.entity.js';
import type { LoginInput } from '../dtos/login.dto.js';

export abstract class AuthRepository {
  abstract login(credentials: LoginInput): Promise<LoginResponse>;
  abstract googleLogin(credential: string): Promise<LoginResponse>;
  abstract logout(): Promise<void>;
  abstract refresh(): Promise<AccessTokenData>;
  abstract me(): Promise<MeResponse>;
}
