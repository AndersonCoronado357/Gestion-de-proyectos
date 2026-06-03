// Panel lateral con el detalle de un evento.
//
// Estructura:
//   - Header (mismo patrón que UserSidePanel: label uppercase + cerrar).
//   - Resumen: chip de nivel + categoría + origen + mensaje destacado.
//   - Bloque "Cuándo": ocurrió + recibido (latencia ingesta).
//   - Bloque HTTP (solo si category='http'): método + status + duración + URL.
//   - Bloque "Contexto del evento": user, ruta, request/session/trace,
//     IP y user agent.
//   - Stack trace, Contexto JSON, Payload JSON (cada uno colapsable).
//   - Timeline de eventos relacionados (misma request o sesión).
//
// Mismas tokens / tipografías que el resto de la app. IDs largos con
// botón "copiar". Auto-cierra con ESC.

import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import LevelChip from '../../../../shared/components/LevelChip/index.js';
import TagChip from '../../../../shared/components/TagChip/index.js';
import type { LogDetail, RemoteLogEntry } from '../../api.js';

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronIcon({ open, ...props }: { open: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('transition-transform', open ? 'rotate-90' : '')}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface FieldProps {
  label: string;
  value?: ReactNode;
  mono?: boolean;
  copyable?: boolean;
  copyText?: string;
  fullWidth?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copiar"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          () => undefined
        );
      }}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-faint outline-none hover:bg-bg-muted hover:text-fg-muted"
    >
      {copied ? <CheckIcon className="text-success-text" /> : <CopyIcon />}
    </button>
  );
}

function Field({
  label,
  value,
  mono = false,
  copyable = false,
  copyText,
  fullWidth = false
}: FieldProps) {
  const isEmpty = value == null || value === '' || value === '—';
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
        {label}
      </p>
      <div className="mt-1 flex items-start gap-1.5">
        <p
          className={cn(
            'min-w-0 break-all text-[12.5px] text-fg',
            mono && 'font-mono tabular-nums'
          )}
        >
          {isEmpty ? <span className="italic text-fg-faint">—</span> : value}
        </p>
        {!isEmpty && copyable && copyText && <CopyButton text={copyText} />}
      </div>
    </div>
  );
}

interface CollapsibleProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Collapsible({ title, count, defaultOpen = true, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-fg-faint hover:text-fg-muted"
      >
        <ChevronIcon open={open} />
        <span>{title}</span>
        {count != null && (
          <span className="text-fg-faint normal-case tracking-normal">
            ({count})
          </span>
        )}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function fmtFull(iso: string): string {
  try {
    const d = new Date(iso);
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}.${ms}`;
  } catch {
    return iso;
  }
}
function fmtTimeShort(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  } catch {
    return iso;
  }
}
function fmtLatency(occurred: string, received?: string): string | null {
  if (!received) return null;
  try {
    const delta = new Date(received).getTime() - new Date(occurred).getTime();
    if (!Number.isFinite(delta)) return null;
    if (delta < 1000) return `${delta} ms`;
    return `${(delta / 1000).toFixed(1)} s`;
  } catch {
    return null;
  }
}

interface Props {
  detail: LogDetail | null;
  loading?: boolean;
  onClose: () => void;
  onSelectRelated?: (entry: RemoteLogEntry) => void;
}

export default function LogDetailPanel({
  detail,
  loading,
  onClose,
  onSelectRelated
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const e = detail?.entry;
  const latency = e ? fmtLatency(e.occurredAt, e.receivedAt) : null;
  const isHttp = e?.category === 'http';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Detalle del evento
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar panel"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-fg-faint outline-none transition-colors hover:bg-danger-surface hover:text-danger-text"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      {loading || !e ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-5">
          <p className="text-[12px] text-fg-faint">Cargando detalle…</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* Resumen */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <LevelChip level={e.level} />
              <TagChip uppercase>{e.category}</TagChip>
              <TagChip>{e.source}</TagChip>
              {e.loggerName && (
                <span className="text-[10.5px] text-fg-faint">· {e.loggerName}</span>
              )}
            </div>
            <p className="mt-2.5 break-words text-[14px] font-semibold leading-snug text-fg">
              {e.message}
            </p>
          </div>

          {/* Cuándo */}
          <div className="h-px shrink-0 bg-border-subtle" />
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              Cuándo
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Ocurrió" value={fmtFull(e.occurredAt)} mono />
              <Field
                label="Recibido"
                value={e.receivedAt ? fmtFull(e.receivedAt) : ''}
                mono
              />
              {latency && <Field label="Latencia ingesta" value={latency} mono />}
            </div>
          </div>

          {/* HTTP */}
          {isHttp && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
                  HTTP
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Método" value={e.httpMethod} mono />
                  <Field
                    label="Status"
                    value={e.httpStatus != null ? String(e.httpStatus) : ''}
                    mono
                  />
                  <Field
                    label="Duración"
                    value={e.durationMs != null ? `${e.durationMs} ms` : ''}
                    mono
                  />
                  <Field label="URL" value={e.httpUrl} mono copyable copyText={e.httpUrl ?? ''} fullWidth />
                </div>
              </div>
            </>
          )}

          {/* Contexto */}
          <div className="h-px shrink-0 bg-border-subtle" />
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              Contexto del evento
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Usuario ID" value={e.userId ?? ''} mono />
              <Field label="Ruta" value={e.route} mono />
              <Field
                label="Request ID"
                value={e.requestId}
                mono
                copyable
                copyText={e.requestId ?? ''}
              />
              <Field
                label="Session ID"
                value={e.sessionId}
                mono
                copyable
                copyText={e.sessionId ?? ''}
              />
              <Field
                label="Trace ID"
                value={e.traceId}
                mono
                copyable
                copyText={e.traceId ?? ''}
              />
              <Field label="IP" value={e.ip} mono />
            </div>
            {e.userAgent && (
              <p className="mt-3 break-all rounded-md bg-bg-muted px-2.5 py-2 text-[11px] text-fg-muted">
                <span className="mr-1 font-semibold uppercase tracking-wider text-fg-faint">
                  UA
                </span>
                {e.userAgent}
              </p>
            )}
          </div>

          {/* Stack trace */}
          {e.stackTrace && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <Collapsible title="Stack trace" defaultOpen>
                <pre className="overflow-auto rounded-md bg-bg-muted p-3 font-mono text-[11.5px] leading-[1.55] text-fg">
                  {e.stackTrace}
                </pre>
              </Collapsible>
            </>
          )}

          {/* Contexto JSON */}
          {e.context && Object.keys(e.context).length > 0 && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <Collapsible
                title="Contexto técnico"
                count={Object.keys(e.context).length}
                defaultOpen
              >
                <pre className="overflow-auto rounded-md bg-bg-muted p-3 font-mono text-[11.5px] leading-[1.55] text-fg">
                  {JSON.stringify(e.context, null, 2)}
                </pre>
              </Collapsible>
            </>
          )}

          {/* Payload JSON */}
          {e.payload && Object.keys(e.payload).length > 0 && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <Collapsible
                title="Payload"
                count={Object.keys(e.payload).length}
                defaultOpen={false}
              >
                <pre className="overflow-auto rounded-md bg-bg-muted p-3 font-mono text-[11.5px] leading-[1.55] text-fg">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              </Collapsible>
            </>
          )}

          {/* Relacionados */}
          {detail && detail.related.length > 0 && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <Collapsible
                title="Eventos relacionados"
                count={detail.related.length}
                defaultOpen
              >
                <ol className="relative space-y-2 border-l border-border-subtle pl-3">
                  {detail.related.map((r) => (
                    <li key={r.id} className="relative">
                      <span className="absolute -left-[7px] top-2 h-2 w-2 rounded-full bg-bg-muted ring-2 ring-bg" />
                      <button
                        type="button"
                        onClick={() => onSelectRelated?.(r)}
                        className="flex w-full flex-col items-start gap-1 rounded-md px-2 py-1.5 text-left hover:bg-bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10.5px] text-fg-faint">
                            {fmtTimeShort(r.occurredAt)}
                          </span>
                          <LevelChip level={r.level} />
                          <TagChip uppercase>{r.category}</TagChip>
                        </div>
                        <span className="line-clamp-2 text-[12px] text-fg">
                          {r.message}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </Collapsible>
            </>
          )}
        </div>
      )}
    </div>
  );
}
