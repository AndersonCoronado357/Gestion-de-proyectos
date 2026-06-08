// Tipos del dominio Sheets — espejos pequeños de la API de Google,
// nombrados en español para coherencia con el resto del backend.

// ── Spreadsheets ─────────────────────────────────────────────────
export interface SpreadsheetSummary {
  id: string;
  name: string;
  // ISO date string del último modify (de Drive).
  modifiedAt: string | null;
  webViewLink: string | null;
}

export interface SpreadsheetMeta {
  id: string;
  title: string;
  locale: string | null;
  timeZone: string | null;
  url: string | null;
  sheets: SheetMeta[];
}

// ── Sheets (tabs dentro de un spreadsheet) ───────────────────────
export interface SheetMeta {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
  tabColorRgb: string | null;
}

// ── Values ───────────────────────────────────────────────────────
export type CellValue = string | number | boolean | null;
export type ValueMatrix = CellValue[][];

export interface ReadRangeResult {
  range: string;
  values: ValueMatrix;
}

export interface WriteRangeResult {
  range: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface AppendResult {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

// ── Inputs de cada operación ─────────────────────────────────────
export interface CreateSpreadsheetInput {
  title: string;
}

export interface RenameSpreadsheetInput {
  spreadsheetId: string;
  title: string;
}

export interface AddSheetInput {
  spreadsheetId: string;
  title: string;
}

export interface RenameSheetInput {
  spreadsheetId: string;
  sheetId: number;
  title: string;
}

export interface DuplicateSheetInput {
  spreadsheetId: string;
  sheetId: number;
  newTitle?: string;
}

export interface ReadRangeInput {
  spreadsheetId: string;
  range: string;
}

export interface WriteRangeInput {
  spreadsheetId: string;
  range: string;
  values: ValueMatrix;
}

export interface AppendRowInput {
  spreadsheetId: string;
  range: string;
  values: ValueMatrix;
}

export interface ClearRangeInput {
  spreadsheetId: string;
  range: string;
}
