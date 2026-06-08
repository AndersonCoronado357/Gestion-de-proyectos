// Puerto: operaciones contra Google Sheets / Drive. La impl real usa
// el SDK `googleapis`. Cualquier endpoint llama a estos métodos — no
// hay HTTP crudo en los use-cases.

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
} from '../domain/sheets.types';

export interface SheetsPort {
  // Spreadsheet level.
  listSpreadsheets(userId: number): Promise<SpreadsheetSummary[]>;
  getSpreadsheet(userId: number, spreadsheetId: string): Promise<SpreadsheetMeta>;
  createSpreadsheet(userId: number, input: CreateSpreadsheetInput): Promise<SpreadsheetMeta>;
  renameSpreadsheet(userId: number, input: RenameSpreadsheetInput): Promise<SpreadsheetMeta>;
  deleteSpreadsheet(userId: number, spreadsheetId: string): Promise<void>;

  // Sheet (tab) level.
  addSheet(userId: number, input: AddSheetInput): Promise<SheetMeta>;
  renameSheet(userId: number, input: RenameSheetInput): Promise<SheetMeta>;
  duplicateSheet(userId: number, input: DuplicateSheetInput): Promise<SheetMeta>;
  deleteSheet(userId: number, spreadsheetId: string, sheetId: number): Promise<void>;

  // Values level.
  readRange(userId: number, input: ReadRangeInput): Promise<ReadRangeResult>;
  writeRange(userId: number, input: WriteRangeInput): Promise<WriteRangeResult>;
  appendRow(userId: number, input: AppendRowInput): Promise<AppendResult>;
  clearRange(userId: number, input: ClearRangeInput): Promise<void>;
}
