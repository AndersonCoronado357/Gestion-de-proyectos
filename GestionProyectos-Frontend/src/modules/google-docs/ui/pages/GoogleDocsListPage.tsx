// Tester básico de Google Docs — lista de documentos del usuario.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import {
  DocumentIcon,
  ExternalLinkIcon
} from '../../../../shared/icons/index.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleDocsHttp } from '../../adapters/exit/google-docs.http.adapter.js';
import type { DocSummary } from '../../domain/google-docs.types.js';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 60_000) return 'hace un instante';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(ms).toLocaleDateString('es-CO');
}

export default function GoogleDocsListPage() {
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
  const [items, setItems] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(await googleDocsHttp.listDocs());
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar tus docs',
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
        <p className="text-[13px] font-semibold text-fg">Documentos</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
          Refrescar
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No tenés documentos" description="Creá uno desde Drive o Docs." />
        ) : (
          items.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary dark:bg-primary-500/15">
                <DocumentIcon width={14} height={14} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
                {d.name}
              </span>
              <span className="shrink-0 text-[11px] text-fg-faint">{timeAgo(d.modifiedAt)}</span>
              {d.webViewLink && (
                <a
                  href={d.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir en Docs"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors duration-200 hover:bg-primary/15 hover:text-primary"
                >
                  <ExternalLinkIcon width={13} height={13} />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
