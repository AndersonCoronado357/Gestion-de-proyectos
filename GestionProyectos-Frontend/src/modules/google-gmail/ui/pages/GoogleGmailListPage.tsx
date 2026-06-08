// Tester básico de Gmail — inbox con últimos 25 mensajes.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { cn } from '../../../../shared/lib/cn.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleGmailHttp } from '../../adapters/exit/google-gmail.http.adapter.js';
import type { MessageSummary } from '../../domain/google-gmail.types.js';

export default function GoogleGmailListPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  if (connected !== true) {
    return (
      <div className="flex h-full overflow-hidden p-3 sm:p-4 lg:p-6">
        <div className="flex h-full min-w-0 flex-1 items-center justify-center rounded-xl bg-bg shadow-sm">
          <GoogleConnectionPanel variant="empty" onChange={setConnected} />
        </div>
      </div>
    );
  }
  return <Shell />;
}

function Shell() {
  const toast = useToast();
  const [items, setItems] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(
        await googleGmailHttp.listMessages({
          labelIds: ['INBOX'],
          pageSize: 25
        })
      );
    } catch (e) {
      toast.error({
        title: 'No se pudo cargar Gmail',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="flex shrink-0 items-center justify-between rounded-xl bg-bg px-4 py-3 shadow-sm">
        <p className="text-[13px] font-semibold text-fg">Gmail — Bandeja de entrada</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
          Refrescar
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : items.length === 0 ? (
          <EmptyState title="Inbox vacío" description="No hay mensajes para mostrar." />
        ) : (
          items.map((m) => <MessageRow key={m.id} msg={m} />)
        )}
      </div>
    </div>
  );
}

function MessageRow({ msg }: { msg: MessageSummary }) {
  const date = msg.date ? new Date(msg.date) : null;
  return (
    // La barra de "no leído" vive en su PROPIO div fuera de la card.
    // La card tiene `rounded-r-xl` — esquinas izquierdas planas — y
    // queda flush contra la barra sin gap. En leídos la barra se
    // mantiene como espacio transparente para no descuadrar la lista.
    <div className="flex">
      <div
        aria-hidden="true"
        className={cn(
          'w-1 shrink-0',
          msg.unread ? 'bg-primary' : 'bg-transparent'
        )}
      />
      <div className="flex flex-1 items-center gap-3 rounded-r-xl bg-bg px-5 py-3 shadow-sm transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10">
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-[12.5px] text-fg',
            msg.unread ? 'font-bold' : 'font-medium'
          )}
        >
          {msg.from ?? '(sin remitente)'}
        </p>
        <p className="truncate text-[12px] text-fg-muted">
          {msg.subject ?? '(sin asunto)'}
        </p>
        <p className="truncate text-[11px] text-fg-faint">{msg.snippet}</p>
      </div>
      <span className="shrink-0 text-[11px] text-fg-faint">
        {date
          ? date.toLocaleString('es-CO', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          : ''}
      </span>
      </div>
    </div>
  );
}
