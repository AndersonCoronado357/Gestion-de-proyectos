export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  // OAuth Client ID de Google (login con Google). Debe ser el MISMO que
  // GOOGLE_CLIENT_ID del backend. Vacío → el botón muestra un aviso.
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  // Callback del flujo de redirección de Google (igual que el resto de apps de
  // acmsy). En build se hornea https://gestion.acmsy.com/auth/callback; en local
  // cae al origin actual.
  googleRedirectUri:
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    (typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '')
};
