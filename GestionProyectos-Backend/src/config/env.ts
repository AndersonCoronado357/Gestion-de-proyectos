const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const num = (v: string | undefined, def: number): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
};
const bool = (v: string | undefined, def = false): boolean =>
  v === undefined ? def : ['true', '1', 'yes'].includes(String(v).toLowerCase());

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 3000),
  db: {
    client: process.env.DB_CLIENT || 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: num(process.env.DB_PORT, 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    encrypt: bool(process.env.DB_ENCRYPT, false),
    trustServerCertificate: bool(process.env.DB_TRUST_CERT, true)
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    // Access token corto → si la cookie se filtra, la ventana de abuso es chica.
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    // Refresh largo → mantiene la sesión activa durante 30 días.
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  cookies: {
    // Nombre de la cookie del refresh token.
    refreshName: process.env.COOKIE_REFRESH_NAME || 'sm_refresh',
    // En producción la cookie viaja sólo por HTTPS.
    secure: bool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
    // 'lax' funciona para flujos same-site típicos. 'none' si el front
    // vive en otro dominio (requiere secure=true).
    sameSite: (process.env.COOKIE_SAMESITE || 'lax') as 'lax' | 'strict' | 'none',
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: num(process.env.REDIS_PORT, 6379)
  },
  cors: {
    // Soporta una lista separada por comas: el cors() acepta string[] y
    // valida que el Origin del request esté incluido.  Vacío o '*' deja
    // pasar todo (sólo dev — incompatible con credentials:true real).
    origin: ((): string | string[] => {
      const raw = (process.env.CORS_ORIGIN || '').trim();
      if (!raw) return '*';
      if (raw.includes(',')) {
        return raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return raw;
    })()
  },
  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: num(process.env.RATE_LIMIT_MAX, 100)
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  // OAuth Client ID de Google (login con Google). Se valida que el
  // `aud` del ID token coincida con este valor.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // Master key para encriptar credenciales de APIs externas en .env.
  // Formato: 32 bytes en base64 (`openssl rand -base64 32`).
  // Si no se setea, se usa una key fija de DEV — NO usar en prod.
  appEncryptionKey:
    process.env.APP_ENCRYPTION_KEY ||
    'c2FsdWRtb2QtZGV2LW9ubHkta2V5LW5vdC1mb3Itcw==',
  // Credenciales de la API APPINTERNOS (SAP-PO).  Mismo usuario para
  // todos los ambientes; DEV y QAS comparten password, PRD usa otra.
  // Las passwords pueden venir cifradas (prefijo `enc:v1:`).
  appinternos: {
    username: process.env.API_USER || '',
    passwordDevQa: process.env.API_PASS_DEVQA || '',
    passwordPrd: process.env.API_PASS_PRD || ''
  },
  // Credenciales de la API INTEGRA (SAP-PO, canal distinto al de
  // APPINTERNOS — tiene su propia ACL). Si no se setean, caen a las de
  // APPINTERNOS, pero típicamente fallan con "ACL error" — pedir las
  // credenciales reales del Anexo01 y meterlas acá.
  integra: {
    username: process.env.INTEGRA_USER || process.env.API_USER || '',
    passwordDevQa:
      process.env.INTEGRA_PASS_DEVQA || process.env.API_PASS_DEVQA || '',
    passwordPrd: process.env.INTEGRA_PASS_PRD || process.env.API_PASS_PRD || ''
  }
};
