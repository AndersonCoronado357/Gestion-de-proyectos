// Tester básico de Google Meet — crear sala + listar conference records.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { ExternalLinkIcon } from '../../../../shared/icons/index.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleMeetHttp } from '../../adapters/exit/google-meet.http.adapter.js';
import type {
  ConferenceRecordSummary,
  MeetSpaceMeta
} from '../../domain/google-meet.types.js';

export default function GoogleMeetListPage() {
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
  const [lastSpace, setLastSpace] = useState<MeetSpaceMeta | null>(null);
  const [creating, setCreating] = useState(false);
  const [records, setRecords] = useState<ConferenceRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await googleMeetHttp.listConferenceRecords());
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar las grabaciones',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleCreate = async (): Promise<void> => {
    setCreating(true);
    try {
      const s = await googleMeetHttp.createSpace();
      setLastSpace(s);
      if (s?.meetingUri) {
        toast.success({ title: 'Sala creada', message: s.meetingUri });
      }
    } catch (e) {
      toast.error({
        title: 'No se pudo crear la sala',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-bg px-4 py-3 shadow-sm">
        <p className="text-[13px] font-semibold text-fg">Meet</p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={creating}
          onClick={() => void handleCreate()}
        >
          {creating ? 'Creando…' : 'Crear sala'}
        </Button>
        {lastSpace?.meetingUri && (
          <a
            href={lastSpace.meetingUri}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
          >
            Abrir sala recién creada
            <ExternalLinkIcon width={11} height={11} />
            ({lastSpace.meetingCode})
          </a>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => void loadRecords()}
        >
          Refrescar
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <p className="px-1 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Reuniones recientes
        </p>
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : records.length === 0 ? (
          <EmptyState
            title="No hay reuniones"
            description="Cuando hagas una reunión va a aparecer acá."
          />
        ) : (
          records.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-[11px] font-bold text-primary dark:bg-primary-500/15">
                MEET
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-fg">{r.name}</p>
                <p className="truncate text-[11px] text-fg-faint">
                  {r.startedAt
                    ? new Date(r.startedAt).toLocaleString('es-CO')
                    : '—'}
                  {r.endedAt ? ` → ${new Date(r.endedAt).toLocaleString('es-CO')}` : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
