// Helper genérico de encriptación simétrica para secretos a nivel de
// aplicación (credenciales de APIs externas, etc.).
//
// AES-256-GCM autenticado.  El valor cifrado incluye IV y auth tag — si
// se tampera, `decrypt` tira un error.
//
// Formato:   enc:v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
//
// Convención: en `.env` aceptamos valores en plano y los devolvemos tal
// cual.  Sólo intentamos descifrar si empieza con `enc:v1:`.  Eso permite
// usar credenciales planas en dev y cifradas en prod sin cambiar código.
//
// Generar un valor cifrado para `.env` desde un script Node:
//   const { encrypt } = require('./src/shared/crypto/encryption');
//   console.log(encrypt('mi-password', process.env.APP_ENCRYPTION_KEY));

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'enc:v1:';

function deriveKey(masterKey: string): Buffer {
  // Si la master key viene como 32 bytes base64, la usamos tal cual.
  // Sino la derivamos con SHA-256 para tener siempre 32 bytes — útil
  // cuando alguien la tipea a mano en dev.
  try {
    const b = Buffer.from(masterKey, 'base64');
    if (b.length === 32) return b;
  } catch {
    // ignore
  }
  return crypto.createHash('sha256').update(masterKey).digest();
}

export function encrypt(plain: string, masterKey: string): string {
  const key = deriveKey(masterKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    iv.toString('base64') +
    ':' +
    tag.toString('base64') +
    ':' +
    ct.toString('base64')
  );
}

export function decrypt(value: string, masterKey: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const rest = value.slice(PREFIX.length);
  const [ivB64, tagB64, ctB64] = rest.split(':');
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error('Cifrado mal formado: se esperaba enc:v1:<iv>:<tag>:<ct>');
  }
  const key = deriveKey(masterKey);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
