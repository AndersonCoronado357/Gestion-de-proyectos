// Implementación HTTP del GoogleSheetsRepository — pega contra
// /api/external-apis/google/sheets/*.

import { http } from '../../../../shared/utils/http.js';
import type {
  AppendResult,
  ReadRangeResult,
  SheetMeta,
  SpreadsheetMeta,
  SpreadsheetSummary,
  ValueMatrix,
  WriteRangeResult
} from '../../domain/google-sheets.types.js';
import type { GoogleSheetsRepository } from '../../ports/google-sheets.repository.js';

const enc = (s: string): string => encodeURIComponent(s);

export const googleSheetsHttp: GoogleSheetsRepository = {
  // ── Spreadsheet level ─────────────────────────────────────────
  async listSpreadsheets(): Promise<SpreadsheetSummary[]> {
    const res = await http<{ items: SpreadsheetSummary[] }>(
      '/external-apis/google/sheets/spreadsheets',
      { method: 'GET' }
    );
    return res?.items ?? [];
  },

  async getSpreadsheet(id: string): Promise<SpreadsheetMeta | null> {
    return http<SpreadsheetMeta>(
      `/external-apis/google/sheets/spreadsheets/${enc(id)}`,
      { method: 'GET' }
    );
  },

  async createSpreadsheet(title: string): Promise<SpreadsheetMeta | null> {
    return http<SpreadsheetMeta>('/external-apis/google/sheets/spreadsheets', {
      method: 'POST',
      body: { title }
    });
  },

  async renameSpreadsheet(id: string, title: string): Promise<SpreadsheetMeta | null> {
    return http<SpreadsheetMeta>(
      `/external-apis/google/sheets/spreadsheets/${enc(id)}`,
      { method: 'PATCH', body: { title } }
    );
  },

  async deleteSpreadsheet(id: string): Promise<void> {
    await http(`/external-apis/google/sheets/spreadsheets/${enc(id)}`, {
      method: 'DELETE'
    });
  },

  // ── Sheet (tab) level ─────────────────────────────────────────
  async addSheet(spreadsheetId: string, title: string): Promise<SheetMeta | null> {
    return http<SheetMeta>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/sheets`,
      { method: 'POST', body: { title } }
    );
  },

  async renameSheet(
    spreadsheetId: string,
    sheetId: number,
    title: string
  ): Promise<SheetMeta | null> {
    return http<SheetMeta>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/sheets/${sheetId}`,
      { method: 'PATCH', body: { title } }
    );
  },

  async duplicateSheet(
    spreadsheetId: string,
    sheetId: number,
    newTitle?: string
  ): Promise<SheetMeta | null> {
    return http<SheetMeta>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/sheets/${sheetId}/duplicate`,
      { method: 'POST', body: newTitle ? { newTitle } : {} }
    );
  },

  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<void> {
    await http(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/sheets/${sheetId}`,
      { method: 'DELETE' }
    );
  },

  // ── Values level ──────────────────────────────────────────────
  async readRange(
    spreadsheetId: string,
    range: string
  ): Promise<ReadRangeResult | null> {
    return http<ReadRangeResult>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/values?range=${enc(range)}`,
      { method: 'GET' }
    );
  },

  async writeRange(
    spreadsheetId: string,
    range: string,
    values: ValueMatrix
  ): Promise<WriteRangeResult | null> {
    return http<WriteRangeResult>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/values`,
      { method: 'PUT', body: { range, values } }
    );
  },

  async appendRow(
    spreadsheetId: string,
    range: string,
    values: ValueMatrix
  ): Promise<AppendResult | null> {
    return http<AppendResult>(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/values/append`,
      { method: 'POST', body: { range, values } }
    );
  },

  async clearRange(spreadsheetId: string, range: string): Promise<void> {
    await http(
      `/external-apis/google/sheets/spreadsheets/${enc(spreadsheetId)}/values/clear`,
      { method: 'POST', body: { range } }
    );
  }
};
