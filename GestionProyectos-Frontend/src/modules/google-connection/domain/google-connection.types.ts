// Tipos del dominio "conexión de Google de un usuario".

export interface GoogleConnection {
  userId: number;
  googleEmail: string | null;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleConnectionStatus {
  connected: boolean;
  connection: GoogleConnection | null;
  // Si es false, el backend ni siquiera tiene Client ID/Secret seteados
  // — la UI muestra un mensaje "configurá las env vars" en vez del
  // botón de conectar.
  oauthConfigured: boolean;
}
