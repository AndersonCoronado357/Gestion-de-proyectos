// Controller HTTP del módulo de autenticación.
//
// Responsabilidades:
//   - Mapear req → input de cada use-case.
//   - Setear / borrar la cookie HttpOnly del refresh token.
//   - Devolver al cliente sólo lo que necesita (access token + user).
//
// El refresh token NUNCA viaja en el body de la response: vive en una
// cookie HttpOnly para que el JavaScript del navegador no pueda leerlo.

import type { CookieOptions, NextFunction, Request, Response } from 'express';
import type { LoginOutput } from '../../use-cases/login';
import type { GetMeOutput } from '../../use-cases/getMe';
import type { TokenPair } from '../../domain/auth.types';

const loginDto = require('../../dtos/login.dto');
const env = require('../../../../config/env');
const AppError = require('../../../../shared/errors/app.error');

interface UseCases {
  login: (input: {
    username: string;
    password: string;
    remember?: boolean;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) => Promise<LoginOutput>;
  logout: (input: { refreshToken?: string | null }) => Promise<{ success: true }>;
  refresh: (input: { refreshToken: string }) => Promise<TokenPair>;
  getMe: (input: { userId: number }) => Promise<GetMeOutput>;
  loginWithGoogle: (input: {
    email: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) => Promise<LoginOutput>;
}

// Verifica un ID token de Google contra el endpoint oficial de tokeninfo.
// Devuelve el email si el token es válido y su `aud` coincide con el
// GOOGLE_CLIENT_ID configurado.
async function verifyGoogleCredential(credential: string): Promise<string> {
  if (!env.googleClientId) {
    throw AppError.internalServerError('Google login no configurado (falta GOOGLE_CLIENT_ID)');
  }
  const resp = await fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential)
  );
  if (!resp.ok) throw AppError.unauthorized('Token de Google inválido');
  const p = (await resp.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    iss?: string;
  };
  const issOk =
    p.iss === 'accounts.google.com' || p.iss === 'https://accounts.google.com';
  const verified = p.email_verified === true || p.email_verified === 'true';
  if (!issOk || p.aud !== env.googleClientId || !p.email || !verified) {
    throw AppError.unauthorized('Token de Google no válido para esta app');
  }
  return p.email;
}

function cookieOptions(maxAgeSeconds: number, remember: boolean): CookieOptions {
  // Sesión "infinita": SIEMPRE persistimos la cookie (maxAge largo), sin
  // importar `remember`. Se re-setea en cada /auth/refresh (sliding) para que
  // no caduque por tiempo ni se pierda al cerrar el navegador. La seguridad la
  // dan httpOnly + Secure (prod) + SameSite + el hash en DB (revocable).
  void remember;
  return {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.sameSite,
    domain: env.cookies.domain,
    path: '/',
    maxAge: maxAgeSeconds * 1000
  };
}

function clearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookies.secure,
    sameSite: env.cookies.sameSite,
    domain: env.cookies.domain,
    path: '/'
  };
}

function getRefreshFromRequest(req: Request): string | null {
  const fromCookie = req.cookies?.[env.cookies.refreshName];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  // Permite también enviarlo en body (útil para tests/clientes no-browser).
  if (typeof req.body?.refreshToken === 'string' && req.body.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
}

function getClientMeta(req: Request) {
  const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const ipAddress = Array.isArray(ipRaw)
    ? ipRaw[0]
    : typeof ipRaw === 'string'
      ? ipRaw.split(',')[0].trim()
      : null;
  const ua = req.headers['user-agent'];
  return {
    ipAddress: ipAddress?.slice(0, 45) ?? null,
    userAgent: typeof ua === 'string' ? ua.slice(0, 500) : null
  };
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const meta = getClientMeta(req);
      const input = { ...loginDto(req.body), ...meta };
      const remember = !!input.remember;
      const { user, tokens, preferences } = await useCases.login(input);
      res.cookie(
        env.cookies.refreshName,
        tokens.refreshToken,
        cookieOptions(tokens.refreshExpiresIn, remember)
      );
      res.json({
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        preferences,
        // Echoamos el flag para que el front sepa qué política aplicó
        // (sessionStorage vs localStorage del cache).
        remember
      });
    } catch (e) {
      next(e);
    }
  },

  google: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credential = req.body?.credential;
      if (typeof credential !== 'string' || !credential) {
        res
          .status(400)
          .json({ error: 'BAD_REQUEST', message: 'Missing Google credential' });
        return;
      }
      const email = await verifyGoogleCredential(credential);
      const meta = getClientMeta(req);
      const { user, tokens, preferences } = await useCases.loginWithGoogle({
        email,
        ...meta
      });
      res.cookie(
        env.cookies.refreshName,
        tokens.refreshToken,
        cookieOptions(tokens.refreshExpiresIn, true)
      );
      res.json({
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        preferences,
        remember: true
      });
    } catch (e) {
      next(e);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = getRefreshFromRequest(req);
      const result = await useCases.logout({ refreshToken });
      res.clearCookie(env.cookies.refreshName, clearCookieOptions());
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = getRefreshFromRequest(req);
      if (!refreshToken) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing refresh token' });
        return;
      }
      // No rotamos el refresh token (mismo token → reloads idempotentes),
      // pero RE-SETEAMOS la cookie con un maxAge fresco en cada refresh: la
      // expiración se "desliza" y sortea el tope de ~400 días del navegador
      // → sesión efectivamente infinita para un usuario activo.
      const tokens = await useCases.refresh({ refreshToken });
      res.cookie(
        env.cookies.refreshName,
        refreshToken,
        cookieOptions(tokens.refreshExpiresIn, true)
      );
      res.json({
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn
      });
    } catch (e) {
      next(e);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'No user in request' });
        return;
      }
      const { user, preferences } = await useCases.getMe({ userId });
      res.json({ user, preferences });
    } catch (e) {
      next(e);
    }
  }
});
