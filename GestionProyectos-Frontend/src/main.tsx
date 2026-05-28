import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.js';
import { ThemeProvider } from './shared/theme/ThemeContext.js';
import { ToastProvider } from './shared/components/Toast/index.js';
import { AuthProvider } from './modules/auth/ui/AuthContext.js';
import { NavigationProvider } from './modules/navigation/NavigationContext.js';
import { SearchProvider } from './shared/search/SearchContext.js';
import { PreferencesSync } from './modules/preferences/PreferencesSync.js';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No #root element found in index.html');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter
          basename="/"
          future={{
            // Opt-in a comportamientos de v7 — silencia los warnings y
            // nos deja preparados para el upgrade futuro:
            //   - v7_startTransition: envuelve los state updates de
            //     navegación en React.startTransition para que la
            //     transición pueda ser interrumpida por inputs.
            //   - v7_relativeSplatPath: cambia la resolución de paths
            //     relativos dentro de splat routes para ser más intuitiva.
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <SearchProvider>
            <AuthProvider>
              <PreferencesSync />
              <NavigationProvider>
                <App />
              </NavigationProvider>
            </AuthProvider>
          </SearchProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
