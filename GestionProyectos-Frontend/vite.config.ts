import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Expone `virtual:modules-folders` con la lista REAL de carpetas dentro de
// src/modules (incluidas las vacías, que `import.meta.glob` no detecta).
// Invalida en HMR cuando se agrega/quita una carpeta.
const modulesFoldersPlugin = (): Plugin => {
  const VIRTUAL_ID = 'virtual:modules-folders';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  const modulesDir = path.resolve(__dirname, 'src/modules');

  const list = (): string[] => {
    try {
      return fs
        .readdirSync(modulesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return [];
    }
  };

  return {
    name: 'modules-folders-list',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return undefined;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export default ${JSON.stringify(list())};`;
      }
      return undefined;
    },
    configureServer(server: ViteDevServer) {
      const invalidate = () => {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('addDir', (p) => {
        if (path.dirname(p) === modulesDir) invalidate();
      });
      server.watcher.on('unlinkDir', (p) => {
        if (path.dirname(p) === modulesDir) invalidate();
      });
    }
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), modulesFoldersPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true, // accesible por IP (celular)
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
