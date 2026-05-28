/// <reference types="vite/client" />

// Permite imports de CSS, imágenes, etc. y tipa import.meta.env de Vite.
// Las definiciones específicas de variables de entorno van abajo.

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LOGIN_IMAGE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Módulo virtual provisto por modulesFoldersPlugin en vite.config.ts.
declare module 'virtual:modules-folders' {
  const folders: string[];
  export default folders;
}
