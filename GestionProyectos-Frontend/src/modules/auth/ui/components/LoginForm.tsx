import { useState, type FormEvent } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import Input from '../../../../shared/components/Input/index.js';
import Checkbox from '../../../../shared/components/Checkbox/index.js';
import GoogleSignInButton from './GoogleSignInButton.js';

export interface LoginFormCredentials {
  username: string;
  password: string;
  remember: boolean;
}

export interface LoginFormProps {
  onSubmit?: (credentials: LoginFormCredentials) => Promise<void> | void;
  onForgot?: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export default function LoginForm({
  onSubmit,
  onForgot,
  submitting = false,
  errorMessage = null
}: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    await onSubmit?.({ username: username.trim(), password, remember });
  };

  return (
    <div className="flex flex-col px-6 py-6 sm:px-8 sm:py-7 lg:px-12 md:h-full md:justify-center">
      <div className="mx-auto w-full max-w-[320px]">
        <div className="space-y-1 text-center">
          <h2 className="text-[24px] font-semibold tracking-tight text-fg">
            Bienvenido de vuelta
          </h2>
          <p className="text-[12.5px] text-fg-subtle">
            Accede a tu panel para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 md:mt-6">
          <Input
            id="login-username"
            label="Usuario"
            type="text"
            autoComplete="username"
            placeholder="usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Input
            id="login-password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between">
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label="Recordar sesión"
            />
            <button
              type="button"
              onClick={onForgot}
              className="text-[11px] font-medium text-primary-700 transition-colors hover:text-primary-800"
            >
              ¿Olvidaste?
            </button>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-[11.5px] font-medium text-red-700"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'mt-1 flex h-10 w-full items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-on-primary outline-none',
              'transition-colors duration-150 hover:bg-primary-700',
              'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
              'active:scale-[0.99]',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary'
            )}
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="my-3 flex items-center gap-3 md:my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-fg-faint">
            o continúa con
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton />
      </div>
    </div>
  );
}
