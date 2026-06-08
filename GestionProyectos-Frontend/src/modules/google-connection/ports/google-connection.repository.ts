// Puerto: contrato del cliente HTTP del shared de Google.

import type { GoogleConnection, GoogleConnectionStatus } from '../domain/google-connection.types.js';

export interface GoogleConnectionRepository {
  getStatus(): Promise<GoogleConnectionStatus | null>;
  connect(authCode: string): Promise<{ connected: boolean; connection: GoogleConnection } | null>;
  disconnect(): Promise<void>;
}
