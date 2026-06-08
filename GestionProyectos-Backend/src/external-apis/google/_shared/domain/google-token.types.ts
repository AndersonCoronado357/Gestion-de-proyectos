// Tipos del dominio "conexión Google del usuario".

export interface GoogleAccountConnection {
  userId: number;
  // Email de la cuenta de Google con la que el user dio consent — útil
  // para mostrarlo en la UI ("Conectado como x@gmail.com").
  googleEmail: string | null;
  // Lista de scopes concedidos por Google al exchangear el code. Puede
  // ser distinta a la pedida si el user des-tildó alguna en el consent.
  scopes: string[];
  // Última vez que la app usó el refresh para sacar un access token.
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistTokenInput {
  userId: number;
  refreshToken: string;
  scopes: string[];
  googleEmail: string | null;
}

// Lo que devuelve el `resolveAccessToken` para que el caller llame a la
// API de Google con ese access en `Authorization: Bearer ...`.
export interface ResolvedAccessToken {
  accessToken: string;
  // Cuando expira ese access (Date). El caller no necesita renovarlo
  // dentro de un mismo request — pero si guarda el access para varios
  // segundos puede chequear.
  expiresAt: Date;
  scopes: string[];
}
