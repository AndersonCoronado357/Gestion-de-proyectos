// Guarda de rutas. El AuthProvider ya bloqueó la app con el Loader global
// mientras se resolvía la sesión, así que cuando este componente renderiza
// `user` ya está en su valor final (autenticado o null).

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
