// Tester básico de Google Drive — lista de archivos del usuario.
// Estructura mínima de listado; las acciones (crear/mover/borrar) están
// en el adapter y se pueden conectar a UI en iteraciones siguientes.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import {
  ExternalLinkIcon,
  FileIcon,
  FolderIcon
} from '../../../../shared/icons/index.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleDriveHttp } from '../../adapters/exit/google-drive.http.adapter.js';
import type { DriveFileSummary } from '../../domain/google-drive.types.js';

export default function GoogleDriveListPage() {
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
  const [items, setItems] = useState<DriveFileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(await googleDriveHttp.listFiles({ pageSize: 100 }));
    } catch (e) {
      toast.error({
        title: 'No se pudo cargar Drive',
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
        <p className="text-[13px] font-semibold text-fg">Drive — Mis archivos</p>
        <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
          Refrescar
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FolderIcon width={22} height={22} />}
            title="No hay archivos"
            description="Tu Drive está vacío o todavía no se sincronizó."
          />
        ) : (
          items.map((f) => <FileRow key={f.id} file={f} />)
        )}
      </div>
    </div>
  );
}

function FileRow({ file }: { file: DriveFileSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary dark:bg-primary-500/15">
        {file.isFolder ? (
          <FolderIcon width={14} height={14} />
        ) : (
          <FileIcon width={14} height={14} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
        {file.name}
      </span>
      <span className="shrink-0 text-[11px] text-fg-faint">
        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
      </span>
      {file.webViewLink && (
        <a
          href={file.webViewLink}
          target="_blank"
          rel="noreferrer"
          title="Abrir en Drive"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors duration-200 hover:bg-primary/15 hover:text-primary"
        >
          <ExternalLinkIcon width={13} height={13} />
        </a>
      )}
    </div>
  );
}
