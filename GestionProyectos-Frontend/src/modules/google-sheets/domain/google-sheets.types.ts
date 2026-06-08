// Tipos del dominio Google Sheets.  Re-exportados desde acá para que
// el resto del módulo no necesite importar la api del backend
// directamente.

export type CellValue = string | number | boolean | null;
export type ValueMatrix = CellValue[][];

export interface SpreadsheetSummary {
  id: string;
  name: string;
  modifiedAt: string | null;
  webViewLink: string | null;
}

export interface SheetMeta {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
  tabColorRgb: string | null;
}

export interface SpreadsheetMeta {
  id: string;
  title: string;
  locale: string | null;
  timeZone: string | null;
  url: string | null;
  sheets: SheetMeta[];
}

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
