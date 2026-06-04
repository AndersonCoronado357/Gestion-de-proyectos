import { useState } from 'react';
import Stepper from './Stepper.js';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons/index.js';

export const meta = { id: 'stepper', name: 'Stepper (proceso por pasos)' };

const STEPS = [
  { label: 'Datos básicos' },
  { label: 'Permisos' },
  { label: 'Revisión' },
  { label: 'Finalizado' }
];

export default function StepperPreview() {
  const [current, setCurrent] = useState(1);
  return (
    <div className="flex flex-col gap-4">
      <Stepper steps={STEPS} current={current} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          className="inline-flex items-center gap-1.5 rounded-md bg-bg-muted px-3 py-1.5 text-[12px] font-medium text-fg-muted transition-all duration-150 hover:bg-primary-50 hover:text-primary active:scale-95 dark:hover:bg-primary-500/15"
        >
          <ChevronLeftIcon width={12} height={12} />
          <span>Anterior</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-on-primary transition-all duration-150 hover:opacity-90 active:scale-95"
        >
          <span>Siguiente</span>
          <ChevronRightIcon width={12} height={12} />
        </button>
      </div>
    </div>
  );
}
