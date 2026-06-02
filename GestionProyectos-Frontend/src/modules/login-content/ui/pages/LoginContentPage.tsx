import { useEffect, useRef, useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { http } from '../../../../shared/utils/http.js';
import Input from '../../../../shared/components/Input/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import Button from '../../../../shared/components/Button/index.js';
import {
  useSortableItem,
  useSortableSensors
} from '../../../../shared/components/DragDropList/index.js';
import { GripIcon } from '../../../../shared/icons/index.js';
import { cn } from '../../../../shared/lib/cn.js';
import LoginPanel, {
  CIRCLE_LAYOUT_COUNT,
  type LoginSlide
} from '../../../auth/ui/components/LoginPanel.js';

interface Msg {
  id: string;
  title: string;
  text: string;
  bg: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

let idCounter = 0;
const newId = () => `msg-${++idCounter}`;
const SAVE_DEBOUNCE_MS = 700;

export default function LoginContentPage() {
  const sensors = useSortableSensors();
  const [items, setItems] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [focusId, setFocusId] = useState<string | null>(null);

  const skipAutosave = useRef(true); // no guardar en la carga inicial
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    http<{ slides: LoginSlide[] }>('/login-content', { method: 'GET' })
      .then((data) => {
        if (!cancelled && data?.slides) {
          setItems(
            data.slides.map((s) => ({
              id: newId(),
              title: s.title,
              text: s.text,
              bg: s.bg ?? 0
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Autoguardado (debounced) cuando cambian los mensajes — sin botón.
  useEffect(() => {
    if (loading) return;
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const cleaned = items
        .map((m) => ({ title: m.title.trim(), text: m.text.trim(), bg: m.bg }))
        .filter((m) => m.title);
      if (cleaned.length === 0) return;
      setStatus('saving');
      http('/login-content', { method: 'PUT', body: { slides: cleaned } })
        .then(() => setStatus('saved'))
        .catch(() => setStatus('error'));
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [items, loading]);

  const update = (id: string, field: 'title' | 'text', value: string) =>
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const setBg = (id: string, bg: number) =>
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, bg } : m)));

  const addMsg = () => {
    const id = newId();
    // El nuevo arranca con un fondo distinto al anterior (rota entre variantes).
    setItems((prev) => [
      ...prev,
      { id, title: '', text: '', bg: prev.length % CIRCLE_LAYOUT_COUNT }
    ]);
    setFocusId(id); // → scroll + foco al nuevo (ver efecto abajo)
  };

  // Tras agregar: scroll hasta el mensaje nuevo y foco en su título.
  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`login-msg-title-${focusId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLInputElement).focus({ preventScroll: true });
    }
    setFocusId(null);
  }, [focusId]);

  const removeMsg = (id: string) =>
    setItems((prev) => prev.filter((m) => m.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((m) => m.id === active.id);
      const to = prev.findIndex((m) => m.id === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[16px] font-semibold tracking-tight text-fg">
            Contenido del login
          </h1>
          <p className="mt-0.5 text-[12px] text-fg-subtle">
            Cada mensaje muestra su propia vista previa. Arrástralos para reordenar — los cambios se guardan solos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SaveBadge status={status} />
          <Button
            variant="ghost"
            onClick={addMsg}
            disabled={loading}
            leftIcon={
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Agregar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton-shimmer h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {items.map((m, i) => (
                  <MessageRow
                    key={m.id}
                    item={m}
                    index={i}
                    slides={items}
                    onUpdate={update}
                    onSetBg={(bg) => setBg(m.id, bg)}
                    onRemove={() => removeMsg(m.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-muted" />
        Guardando…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-primary-700">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Guardado
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-danger-text">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Error al guardar
      </span>
    );
  }
  return null;
}

// Vista previa de ESTE mensaje: sólo el panel (el "cuadrito"), a buen tamaño.
function LoginPreview({ slides, activeIndex }: { slides: LoginSlide[]; activeIndex: number }) {
  // Móvil: ocupa todo el ancho con su proporción (5/6). lg+: fijo 400×480.
  return (
    <div className="aspect-[5/6] w-full shrink-0 lg:aspect-auto lg:h-[480px] lg:w-[400px]">
      <LoginPanel slides={slides} activeIndex={activeIndex} />
    </div>
  );
}

// Selector del fondo de círculos del mensaje: una miniatura por variante.
// Sin bordes — el seleccionado se marca con sombra + una palomita.
function BgPicker({ value, onChange }: { value: number; onChange: (bg: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-medium text-fg-muted">Fondo</div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {Array.from({ length: CIRCLE_LAYOUT_COUNT }).map((_, n) => {
          const selected = (value ?? 0) === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`Fondo ${n + 1}`}
              aria-pressed={selected}
              title={`Fondo ${n + 1}`}
              className={cn(
                'relative shrink-0 rounded-lg transition-opacity duration-150',
                selected ? 'opacity-100' : 'opacity-50 hover:opacity-90'
              )}
            >
              <div
                className={cn(
                  'aspect-[11/14] w-full overflow-hidden rounded-xl',
                  selected ? 'shadow-md' : 'shadow-sm'
                )}
              >
                <LoginPanel
                  slides={[{ title: '', text: '', bg: n }]}
                  activeIndex={0}
                  hideText
                  hideDecor
                  className="!rounded-none"
                />
              </div>
              {selected && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-on-primary shadow">
                  <svg
                    viewBox="0 0 24 24"
                    width={10}
                    height={10}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MessageRowProps {
  item: Msg;
  index: number;
  slides: LoginSlide[];
  onUpdate: (id: string, field: 'title' | 'text', value: string) => void;
  onSetBg: (bg: number) => void;
  onRemove: () => void;
}

function MessageRow({ item, index, slides, onUpdate, onSetBg, onRemove }: MessageRowProps) {
  const { setNodeRef, attributes, listeners, style } = useSortableItem({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: 'auto' }}
      {...attributes}
      className="flex items-stretch gap-3 rounded-xl bg-bg p-3 shadow-sm sm:gap-4 sm:p-4"
    >
      {/* Mango de arrastre. En móvil: handle chico arriba (para NO bloquear el
          scroll táctil). En lg+: riel a toda la altura. El touch-action:none
          vive SOLO en el mango (la fila completa queda con scroll libre). */}
      <span
        {...listeners}
        aria-label="Arrastrar para reordenar"
        className="mt-1 flex h-7 w-7 shrink-0 cursor-grab touch-none items-center justify-center self-start rounded-md text-fg-faint transition-colors hover:bg-bg-muted hover:text-fg-muted active:cursor-grabbing lg:mt-0 lg:h-auto lg:w-6 lg:self-stretch lg:rounded-none lg:hover:bg-transparent"
      >
        <GripIcon width={14} height={14} />
      </span>

      {/* Editor + preview: apilados en móvil, lado a lado en lg+. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
              Mensaje {index + 1}
            </span>
            <button
              type="button"
              onClick={onRemove}
              title="Quitar"
              aria-label="Quitar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-fg-faint transition-colors hover:bg-danger-surface hover:text-danger-text"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m6 6 1 14h10l1-14" />
              </svg>
            </button>
          </div>

          <Input
            id={`login-msg-title-${item.id}`}
            label="Título"
            value={item.title}
            onChange={(e) => onUpdate(item.id, 'title', e.target.value)}
            placeholder="Ej. Todos tus proyectos, en un solo lugar."
            maxLength={200}
          />
          <Textarea
            label="Texto"
            value={item.text}
            onChange={(e) => onUpdate(item.id, 'text', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Una frase corta de apoyo."
          />
          <BgPicker value={item.bg} onChange={onSetBg} />
        </div>

        {/* Vista previa (sólo el panel) de ESTE mensaje. */}
        <LoginPreview slides={slides} activeIndex={index} />
      </div>
    </div>
  );
}
