import { cn } from '../../../../shared/lib/cn.js';
import { HeartPulseIcon } from '../../../../shared/components/icons/index.jsx';

const content = {
  login: {
    title: 'Salud, ordenada y al alcance.',
    description:
      'Pacientes, citas e historias en una sola plataforma diseñada para tu equipo.',
    helper: '¿Olvidaste tu contraseña?',
    cta: 'Recuperar acceso',
    next: 'forgot'
  },
  forgot: {
    title: 'Recupera tu acceso en minutos.',
    description: 'Te ayudamos a volver al panel sin perder tu información.',
    helper: '¿Recordaste tu contraseña?',
    cta: 'Iniciar sesión',
    next: 'login'
  }
};

export default function InfoPanel({ mode, setMode }) {
  const c = content[mode] ?? content.login;

  return (
    <div className="flex h-full flex-col justify-between p-8 text-white lg:p-10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
          <HeartPulseIcon width={18} height={18} className="text-white" />
        </div>
        <span className="text-[13.5px] font-semibold tracking-tight">GestionProyectos</span>
      </div>

      <div className="space-y-3">
        <h2 className="max-w-[280px] text-[26px] font-semibold leading-[1.15] tracking-tight lg:text-[30px]">
          {c.title}
        </h2>
        <p className="max-w-[280px] text-[12.5px] leading-relaxed text-white/80">
          {c.description}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[11.5px] text-white/70">{c.helper}</p>
        <button
          type="button"
          onClick={() => setMode(c.next)}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-lg border-2 border-white/85 bg-transparent px-5 text-[12px] font-semibold text-white outline-none',
            'transition-colors duration-150 hover:bg-white hover:text-primary-700',
            'focus-visible:ring-2 focus-visible:ring-white/50'
          )}
        >
          {c.cta}
        </button>
      </div>
    </div>
  );
}
