import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '../../../../shared/lib/cn.js';

// Panel lateral del login (presentacional). Recibe los slides y los pinta:
// fondo sólido azul + círculos + puntitos + título/bajada. Si se pasa
// `activeIndex` muestra ese slide fijo (para vista previa); si no, rota solo.
// Lo usan: el login real (ImagePanel) y el editor de "Contenido del login".

export interface LoginSlide {
  title: string;
  text: string;
  /** Índice del fondo de círculos a usar (0..CIRCLE_LAYOUT_COUNT-1). */
  bg?: number;
}

const W = '#ffffff';
const LIGHT = 'rgb(var(--color-primary-300))';
const DARK = 'rgb(var(--color-primary-900))';

const fill = (s: CSSProperties): CSSProperties => s;
const ring = (s: CSSProperties): CSSProperties => ({
  border: '2px solid #ffffff',
  background: 'transparent',
  ...s
});

const circleLayouts: CSSProperties[][] = [
  [
    fill({ width: 380, height: 380, top: -120, right: -130, background: W, opacity: 0.1 }),
    fill({ width: 190, height: 190, top: '34%', left: -70, background: LIGHT, opacity: 0.24 }),
    ring({ width: 120, height: 120, top: '18%', right: '22%', opacity: 0.3 })
  ],
  [
    fill({ width: 300, height: 300, top: -90, left: -110, background: DARK, opacity: 0.4 }),
    fill({ width: 170, height: 170, top: '10%', right: -50, background: W, opacity: 0.1 }),
    fill({ width: 130, height: 130, top: '48%', right: '28%', background: LIGHT, opacity: 0.22 })
  ],
  [
    fill({ width: 240, height: 240, top: -70, right: -40, background: W, opacity: 0.1 }),
    fill({ width: 160, height: 160, top: 56, right: 96, background: LIGHT, opacity: 0.22 }),
    ring({ width: 210, height: 210, top: '38%', left: -80, opacity: 0.22 })
  ],
  [
    fill({ width: 300, height: 300, bottom: -110, right: -100, background: DARK, opacity: 0.4 }),
    fill({ width: 160, height: 160, top: '14%', right: '16%', background: W, opacity: 0.1 }),
    ring({ width: 150, height: 150, bottom: '20%', left: -40, opacity: 0.26 })
  ],
  [
    fill({ width: 320, height: 320, bottom: -120, left: -90, background: W, opacity: 0.1 }),
    fill({ width: 150, height: 150, top: '20%', right: -40, background: LIGHT, opacity: 0.22 }),
    ring({ width: 130, height: 130, bottom: '26%', right: '22%', opacity: 0.26 })
  ],
  [
    fill({ width: 260, height: 260, top: -80, right: -90, background: DARK, opacity: 0.4 }),
    fill({ width: 180, height: 180, bottom: -70, right: 24, background: LIGHT, opacity: 0.2 }),
    ring({ width: 120, height: 120, top: '42%', left: -46, opacity: 0.28 })
  ]
];

/** Cantidad de fondos de círculos disponibles para escoger. */
export const CIRCLE_LAYOUT_COUNT = circleLayouts.length;

const decor: CSSProperties[] = [
  fill({ width: 7, height: 7, top: '15%', left: '20%', background: W, opacity: 0.4 }),
  fill({ width: 5, height: 5, top: '26%', right: '24%', background: W, opacity: 0.32 }),
  fill({ width: 9, height: 9, top: '60%', left: '13%', background: LIGHT, opacity: 0.5 }),
  fill({ width: 6, height: 6, bottom: '16%', right: '22%', background: W, opacity: 0.35 }),
  fill({ width: 4, height: 4, top: '45%', left: '46%', background: W, opacity: 0.22 }),
  fill({ width: 7, height: 7, bottom: '34%', left: '34%', background: W, opacity: 0.3 }),
  fill({ width: 5, height: 5, top: '9%', right: '42%', background: LIGHT, opacity: 0.45 }),
  fill({ width: 6, height: 6, bottom: '48%', right: '30%', background: W, opacity: 0.28 }),
  ring({ width: 30, height: 30, top: '72%', right: '18%', opacity: 0.22 }),
  ring({ width: 18, height: 18, top: '22%', left: '54%', opacity: 0.2 })
];

const ROTATION_MS = 5200;

export interface LoginPanelProps {
  slides: LoginSlide[];
  /** Si se pasa, muestra ese slide fijo (no rota). Útil para vista previa. */
  activeIndex?: number;
  /** Oculta el título/texto (para miniaturas del selector de fondo). */
  hideText?: boolean;
  /** Oculta los puntitos decorativos (para miniaturas). */
  hideDecor?: boolean;
  className?: string;
}

export default function LoginPanel({
  slides,
  activeIndex,
  hideText,
  hideDecor,
  className
}: LoginPanelProps) {
  const [auto, setAuto] = useState(0);
  const controlled = activeIndex != null;
  const list = slides.length > 0 ? slides : [{ title: '', text: '' }];

  useEffect(() => {
    if (controlled || list.length <= 1) return;
    const id = setInterval(() => {
      setAuto((prev) => (prev + 1) % list.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [controlled, list.length]);

  const active = controlled
    ? Math.max(0, Math.min(activeIndex as number, list.length - 1))
    : auto < list.length
      ? auto
      : 0;

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-[20px] bg-primary-600 text-white',
        className
      )}
    >
      {!hideDecor && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {decor.map((style, i) => (
            <span key={i} className="absolute rounded-full" style={style} />
          ))}
        </div>
      )}

      {list.map((s, i) => {
        // En modo controlado (vista previa) sólo pintamos el slide activo.
        if (controlled && i !== active) return null;
        // El fondo de círculos lo elige cada mensaje (s.bg); si no, por índice.
        const variant = s.bg ?? i;
        const circles =
          circleLayouts[
            ((variant % circleLayouts.length) + circleLayouts.length) % circleLayouts.length
          ];
        return (
          <div
            key={i}
            className={cn(
              'absolute inset-0',
              !controlled && 'transition-opacity duration-1000 ease-smooth',
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={i !== active}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {circles.map((style, j) => (
                <span key={j} className="absolute rounded-full" style={style} />
              ))}
            </div>
            {!hideText && (
              <div className="relative flex h-full flex-col justify-center px-10">
                <h2 className="max-w-[340px] whitespace-pre-line break-words text-[28px] font-bold leading-[1.16] tracking-tight xl:text-[32px]">
                  {s.title || 'Título del mensaje'}
                </h2>
                <p className="mt-3 max-w-[320px] whitespace-pre-line break-words text-[14px] leading-relaxed text-white/80">
                  {s.text}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
