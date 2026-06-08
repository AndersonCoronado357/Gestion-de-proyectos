// Puerto: contrato del cliente HTTP del módulo Google Sheets.
// La impl real (HTTP) vive en adapters/exit.

import type {
  AppendResult,
  ReadRangeResult,
  SheetMeta,
  SpreadsheetMeta,
  SpreadsheetSummary,
  ValueMatrix,
  WriteRangeResult
} from '../domain/google-sheets.types.js';

export interface GoogleSheetsRepository {
  // Spreadsheet level.
  listSpreadsheets(): Promise<SpreadsheetSummary[]>;
  getSpreadsheet(id: string): Promise<SpreadsheetMeta | null>;
  createSpreadsheet(title: string): Promise<SpreadsheetMeta | null>;
  renameSpreadsheet(id: string, title: string): Promise<SpreadsheetMeta | null>;
  deleteSpreadsheet(id: string): Promise<void>;

  // Sheet (tab) level.
  addSheet(spreadsheetId: string, title: string): Promise<SheetMeta | null>;
  renameSheet(spreadsheetId: string, sheetId: number, title: string): Promise<SheetMeta | null>;
  duplicateSheet(spreadsheetId: string, sheetId: number, newTitle?: string): Promise<SheetMeta | null>;
  deleteSheet(spreadsheetId: string, sheetId: number): Promise<void>;

  // Values level.
  readRange(spreadsheetId: string, range: string): Promise<ReadRangeResult | null>;
  writeRange(spreadsheetId: string, range: string, values: ValueMatrix): Promise<WriteRangeResult | null>;
  appendRow(spreadsheetId: string, range: string, values: ValueMatrix): Promise<AppendResult | null>;
  clearRange(spreadsheetId: string, range: string): Promise<void>;
}
