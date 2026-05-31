import { useState, type FormEvent } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import { ChevronRightIcon } from '../../../../shared/components/icons/index.jsx';
import Input from '../../../../shared/components/Input/index.js';

export interface ForgotPasswordFormProps {
  onSubmit?: (email: string) => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onSubmit, onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(email);
  };

  return (
    <div className="flex flex-col px-6 py-6 sm:px-8 sm:py-7 lg:px-12 md:h-full md:justify-center">
      <div className="mx-auto w-full max-w-[320px]">
        <div className="space-y-1 text-center">
          <h2 className="text-[24px] font-semibold tracking-tight text-fg">
            Recuperar contraseña
          </h2>
          <p className="text-[12.5px] text-fg-subtle">
            Te enviaremos un enlace a tu correo para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input
            id="forgot-email"
            label="Correo"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className={cn(
              'mt-1 flex h-10 w-full items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-on-primary outline-none',
              'transition-colors duration-150 hover:bg-primary-700',
              'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2',
              'active:scale-[0.99]'
            )}
          >
            Enviar enlace
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className={cn(
            'mt-5 flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-fg-muted',
            'transition-colors hover:text-primary-700'
          )}
        >
          <ChevronRightIcon width={13} height={13} className="rotate-180" />
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}
