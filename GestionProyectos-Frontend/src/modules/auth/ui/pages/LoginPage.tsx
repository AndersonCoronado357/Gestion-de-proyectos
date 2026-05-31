import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import { HttpError } from '../../../../shared/utils/http.js';
import LoginForm, { type LoginFormCredentials } from '../components/LoginForm.jsx';
import ForgotPasswordForm from '../components/ForgotPasswordForm.jsx';
import ImagePanel from '../components/ImagePanel.jsx';
import { useAuth } from '../AuthContext.js';
import { defaultPath } from '../../../../shared/components/Sidebar/sidebar.config.js';
import './LoginPage.css';

type Mode = 'login' | 'forgot';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn } = useAuth();

  // Si ya tenemos sesión cuando la página se monta (o cuando vuelve a
  // tener foco), saltamos directo al destino.
  useEffect(() => {
    if (user) {
      const dest = (location.state as LocationState | null)?.from ?? defaultPath;
      navigate(dest, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async ({ username, password, remember }: LoginFormCredentials) => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ username, password, remember });
      const dest = (location.state as LocationState | null)?.from ?? defaultPath;
      navigate(dest, { replace: true });
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.status === 401) {
          setError('Usuario o contraseña incorrectos.');
        } else if (e.status === 403) {
          setError('Tu cuenta no está activa. Contacta a un administrador.');
        } else {
          setError(e.message || 'No se pudo iniciar sesión.');
        }
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formOnLeft = mode === 'login';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary-50 px-4 py-6 md:py-4">
      <div className="w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-[28px] bg-bg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] md:h-[540px]">
          <div className="md:hidden">
            {mode === 'login' ? (
              <LoginForm
                onSubmit={handleSubmit}
                onForgot={() => setMode('forgot')}
                submitting={submitting}
                errorMessage={error}
              />
            ) : (
              <ForgotPasswordForm
                onSubmit={() => setMode('login')}
                onBack={() => setMode('login')}
              />
            )}
          </div>

          <div className="hidden md:block">
            <div
              className={cn(
                'absolute inset-y-3 w-[calc(50%-12px)] transition-[left] duration-700 ease-smooth',
                formOnLeft ? 'left-3' : 'left-1/2'
              )}
            >
              <FormSlot active={mode === 'login'}>
                <LoginForm
                  onSubmit={handleSubmit}
                  onForgot={() => setMode('forgot')}
                  submitting={submitting}
                  errorMessage={error}
                />
              </FormSlot>
              <FormSlot active={mode === 'forgot'}>
                <ForgotPasswordForm
                  onSubmit={() => setMode('login')}
                  onBack={() => setMode('login')}
                />
              </FormSlot>
            </div>

            <div
              className={cn(
                'absolute inset-y-3 w-[calc(50%-12px)] transition-[left] duration-700 ease-smooth',
                formOnLeft ? 'left-1/2' : 'left-3'
              )}
            >
              <ImagePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormSlotProps {
  active: boolean;
  children: React.ReactNode;
}

function FormSlot({ active, children }: FormSlotProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-[400ms] ease-smooth',
        active ? 'opacity-100 delay-[400ms]' : 'pointer-events-none opacity-0'
      )}
    >
      {children}
    </div>
  );
}
