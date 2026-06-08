// Implementación del SheetsPort usando el SDK `googleapis`. Toda la
// app habla con Sheets a través de este archivo.
//
// Cada método saca un access token fresco del resolver compartido y
// construye un cliente Sheets/Drive con ese token — los clients de
// googleapis son baratos de crear, no hace falta cachearlos.

import { google, sheets_v4, drive_v3 } from 'googleapis';
// `googleapis` reexporta su propio OAuth2 (con su copia de google-auth-library
// embebida). Si importamos de `google-auth-library` directo, TypeScript ve
// dos copias distintas del tipo y se queja. Usamos la copia interna del SDK.
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
import type {
  AddSheetInput,
  AppendResult,
  AppendRowInput,
  ClearRangeInput,
  CreateSpreadsheetInput,
  DuplicateSheetInput,
  ReadRangeInput,
  ReadRangeResult,
  RenameSheetInput,
  RenameSpreadsheetInput,
  SheetMeta,
  SpreadsheetMeta,
  SpreadsheetSummary,
  WriteRangeInput,
  WriteRangeResult
} from '../../domain/sheets.types';
import type { SheetsPort } from '../../ports/sheets.port';
import type { ResolvedAccessToken } from '../../../_shared/domain/google-token.types';

const AppError = require('../../../../../shared/errors/app.error');

type ResolveAccessToken = (userId: number) => Promise<ResolvedAccessToken>;

function buildOAuthClient(accessToken: string): OAuth2Client {
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: accessToken });
  return client as OAuth2Client;
}

function toSheetMeta(s: sheets_v4.Schema$Sheet): SheetMeta {
  const p = s.properties ?? {};
  const grid = p.gridProperties ?? {};
  const color = p.tabColor;
  const tabColorRgb = color
    ? `rgb(${Math.round((color.red ?? 0) * 255)},${Math.round((color.green ?? 0) * 255)},${Math.round((color.blue ?? 0) * 255)})`
    : null;
  return {
    sheetId: p.sheetId ?? 0,
    title: p.title ?? '',
    index: p.index ?? 0,
    rowCount: grid.rowCount ?? 0,
    columnCount: grid.columnCount ?? 0,
    tabColorRgb
  };
}

function toSpreadsheetMeta(ss: sheets_v4.Schema$Spreadsheet): SpreadsheetMeta {
  const p = ss.properties ?? {};
  return {
    id: ss.spreadsheetId ?? '',
    title: p.title ?? '',
    locale: p.locale ?? null,
    timeZone: p.timeZone ?? null,
    url: ss.spreadsheetUrl ?? null,
    sheets: (ss.sheets ?? []).map(toSheetMeta)
  };
}

async function withClients<T>(
  resolve: ResolveAccessToken,
  userId: number,
  fn: (s: sheets_v4.Sheets, d: drive_v3.Drive) => Promise<T>
): Promise<T> {
  const tok = await resolve(userId);
  const auth = buildOAuthClient(tok.accessToken);
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  try {
    return await fn(sheets, drive);
  } catch (e) {
    const msg = extractGoogleError(e);
    throw AppError.badGateway(msg);
  }
}

function extractGoogleError(e: unknown): string {
  if (e && typeof e === 'object') {
    const err = e as { errors?: Array<{ message?: string }>; message?: string };
    if (err.errors?.[0]?.message) return `Google: ${err.errors[0].message}`;
    if (err.message) return `Google: ${err.message}`;
  }
  return 'Google: error desconocido';
}

export function buildSheetsHttpClient(deps: {
  resolveAccessToken: ResolveAccessToken;
}): SheetsPort {
  const resolve = deps.resolveAccessToken;

  return {
    // ── Spreadsheet level ───────────────────────────────────────
    async listSpreadsheets(userId: number): Promise<SpreadsheetSummary[]> {
      return withClients(resolve, userId, async (_s, drive) => {
        const r = await drive.files.list({
          q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
          fields: 'files(id,name,modifiedTime,webViewLink)',
          pageSize: 100,
          orderBy: 'modifiedTime desc'
        });
        return (r.data.files ?? []).map((f) => ({
          id: f.id ?? '',
          name: f.name ?? '(sin nombre)',
          modifiedAt: f.modifiedTime ?? null,
          webViewLink: f.webViewLink ?? null
        }));
      });
    },

    async getSpreadsheet(
      userId: number,
      spreadsheetId: string
    ): Promise<SpreadsheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.get({
          spreadsheetId,
          // Sin includeGridData → respuesta más liviana, sólo metadata.
          includeGridData: false
        });
        return toSpreadsheetMeta(r.data);
      });
    },

    async createSpreadsheet(
      userId: number,
      input: CreateSpreadsheetInput
    ): Promise<SpreadsheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.create({
          requestBody: { properties: { title: input.title } }
        });
        return toSpreadsheetMeta(r.data);
      });
    },

    async renameSpreadsheet(
      userId: number,
      input: RenameSpreadsheetInput
    ): Promise<SpreadsheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: input.spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSpreadsheetProperties: {
                  properties: { title: input.title },
                  fields: 'title'
                }
              }
            ]
          }
        });
        const r = await sheets.spreadsheets.get({
          spreadsheetId: input.spreadsheetId,
          includeGridData: false
        });
        return toSpreadsheetMeta(r.data);
      });
    },

    async deleteSpreadsheet(
      userId: number,
      spreadsheetId: string
    ): Promise<void> {
      await withClients(resolve, userId, async (_s, drive) => {
        await drive.files.delete({ fileId: spreadsheetId });
      });
    },

    // ── Sheet (tab) level ───────────────────────────────────────
    async addSheet(userId: number, input: AddSheetInput): Promise<SheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.batchUpdate({
          spreadsheetId: input.spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: input.title } } }]
          }
        });
        const created = r.data.replies?.[0]?.addSheet?.properties;
        if (!created) throw new Error('Google no devolvió propiedades de la hoja creada');
        return toSheetMeta({ properties: created });
      });
    },

    async renameSheet(
      userId: number,
      input: RenameSheetInput
    ): Promise<SheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: input.spreadsheetId,
          requestBody: {
            requests: [
              {
                updateSheetProperties: {
                  properties: { sheetId: input.sheetId, title: input.title },
                  fields: 'title'
                }
              }
            ]
          }
        });
        const r = await sheets.spreadsheets.get({
          spreadsheetId: input.spreadsheetId,
          includeGridData: false
        });
        const ss = toSpreadsheetMeta(r.data);
        const tab = ss.sheets.find((s) => s.sheetId === input.sheetId);
        if (!tab) throw new Error('La hoja renombrada no aparece en el spreadsheet');
        return tab;
      });
    },

    async duplicateSheet(
      userId: number,
      input: DuplicateSheetInput
    ): Promise<SheetMeta> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.batchUpdate({
          spreadsheetId: input.spreadsheetId,
          requestBody: {
            requests: [
              {
                duplicateSheet: {
                  sourceSheetId: input.sheetId,
                  ...(input.newTitle ? { newSheetName: input.newTitle } : {})
                }
              }
            ]
          }
        });
        const props = r.data.replies?.[0]?.duplicateSheet?.properties;
        if (!props) throw new Error('Google no devolvió la hoja duplicada');
        return toSheetMeta({ properties: props });
      });
    },

    async deleteSheet(
      userId: number,
      spreadsheetId: string,
      sheetId: number
    ): Promise<void> {
      await withClients(resolve, userId, async (sheets) => {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ deleteSheet: { sheetId } }] }
        });
      });
    },

    // ── Values level ────────────────────────────────────────────
    async readRange(
      userId: number,
      input: ReadRangeInput
    ): Promise<ReadRangeResult> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.values.get({
          spreadsheetId: input.spreadsheetId,
          range: input.range
        });
        const values = (r.data.values ?? []) as unknown as ReadRangeResult['values'];
        return { range: r.data.range ?? input.range, values };
      });
    },

    async writeRange(
      userId: number,
      input: WriteRangeInput
    ): Promise<WriteRangeResult> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.values.update({
          spreadsheetId: input.spreadsheetId,
          range: input.range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: input.values as unknown[][] }
        });
        return {
          range: r.data.updatedRange ?? input.range,
          updatedRows: r.data.updatedRows ?? 0,
          updatedColumns: r.data.updatedColumns ?? 0,
          updatedCells: r.data.updatedCells ?? 0
        };
      });
    },

    async appendRow(
      userId: number,
      input: AppendRowInput
    ): Promise<AppendResult> {
      return withClients(resolve, userId, async (sheets) => {
        const r = await sheets.spreadsheets.values.append({
          spreadsheetId: input.spreadsheetId,
          range: input.range,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: input.values as unknown[][] }
        });
        const u = r.data.updates;
        return {
          spreadsheetId: r.data.spreadsheetId ?? input.spreadsheetId,
          updatedRange: u?.updatedRange ?? '',
          updatedRows: u?.updatedRows ?? 0,
          updatedColumns: u?.updatedColumns ?? 0,
          updatedCells: u?.updatedCells ?? 0
        };
      });
    },

    async clearRange(
      userId: number,
      input: ClearRangeInput
    ): Promise<void> {
      await withClients(resolve, userId, async (sheets) => {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: input.spreadsheetId,
          range: input.range
        });
      });
    }
  };
}
