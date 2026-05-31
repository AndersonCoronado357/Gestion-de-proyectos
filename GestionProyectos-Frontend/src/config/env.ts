export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  // OAuth Client ID de Google (login con Google). Debe ser el MISMO que
  // GOOGLE_CLIENT_ID del backend. Vacío → el botón muestra un aviso.
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
};
