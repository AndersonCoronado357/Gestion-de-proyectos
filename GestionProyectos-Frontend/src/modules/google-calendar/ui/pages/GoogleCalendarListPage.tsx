// Tester básico de Google Calendar — lista de calendarios + eventos
// próximos del calendario seleccionado.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import Select from '../../../../shared/components/Select/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { ExternalLinkIcon } from '../../../../shared/icons/index.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleCalendarHttp } from '../../adapters/exit/google-calendar.http.adapter.js';
import type {
  CalendarSummary,
  EventSummary
} from '../../domain/google-calendar.types.js';

export default function GoogleCalendarListPage() {
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
  const [cals, setCals] = useState<CalendarSummary[]>([]);
  const [calId, setCalId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCals = useCallback(async () => {
    try {
      const list = await googleCalendarHttp.listCalendars();
      setCals(list);
      if (!calId && list.length > 0) {
        const primary = list.find((c) => c.primary) ?? list[0];
        setCalId(primary.id);
      }
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar los calendarios',
        message: e instanceof Error ? e.message : ''
      });
    }
  }, [toast, calId]);

  const loadEvents = useCallback(async () => {
    if (!calId) return;
    setLoading(true);
    try {
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setEvents(
        await googleCalendarHttp.listEvents({
          calendarId: calId,
          timeMin: now.toISOString(),
          timeMax: in30.toISOString(),
          pageSize: 50
        })
      );
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar los eventos',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoading(false);
    }
  }, [calId, toast]);

  useEffect(() => {
    void loadCals();
  }, [loadCals]);
  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-bg px-4 py-3 shadow-sm">
        <p className="text-[13px] font-semibold text-fg">Calendario</p>
        <div className="min-w-[200px] max-w-xs flex-1">
          <Select<string>
            options={cals.map((c) => ({ value: c.id, label: c.summary }))}
            value={calId}
            onChange={(v) => setCalId(v ?? null)}
            placeholder="Calendario"
            searchable
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => void loadEvents()}
        >
          Refrescar
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : events.length === 0 ? (
          <EmptyState
            title="Sin eventos próximos"
            description="No hay eventos en los próximos 30 días."
          />
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: EventSummary }) {
  const start = event.start ? new Date(event.start) : null;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10">
      <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-primary-50 text-primary dark:bg-primary-500/15">
        <span className="text-[9px] font-bold uppercase">
          {start ? start.toLocaleString('es-CO', { month: 'short' }) : '—'}
        </span>
        <span className="text-[13px] font-bold leading-none">
          {start ? start.getDate() : '·'}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-fg">
          {event.summary ?? '(sin título)'}
        </p>
        <p className="truncate text-[11px] text-fg-faint">
          {start
            ? start.toLocaleString('es-CO', {
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            : ''}
          {event.location ? ` · ${event.location}` : ''}
        </p>
      </div>
      {event.htmlLink && (
        <a
          href={event.htmlLink}
          target="_blank"
          rel="noreferrer"
          title="Abrir en Calendar"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors duration-200 hover:bg-primary/15 hover:text-primary"
        >
          <ExternalLinkIcon width={13} height={13} />
        </a>
      )}
    </div>
  );
}
