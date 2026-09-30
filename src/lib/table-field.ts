import type { CustomFieldDef, TableColumnDef } from "./storage";

/**
 * "Tabela" field values live in draft.customFields[fieldId] as a JSON string,
 * so drafts, cloud reports (custom_fields JSONB) and snapshots need no migration.
 *
 *   {"t":1,"cols":[{"id":"c1","label":"Obwód"}],"rows":[{"_k":"a1","c1":"L1"}]}
 *
 * `cols` is a copy of the column labels at the time of editing — used only when
 * the template is not available (history view, regenerating an old report).
 * The template's own `tableColumns` are always the source of truth.
 */

export type TableRow = Record<string, string>;

export interface TableValue {
  cols: { id: string; label: string; kind?: TableColumnDef["kind"] }[];
  rows: TableRow[];
}

const PREFIX = '{"t":1';

export const newRowKey = () => Math.random().toString(36).slice(2, 9);

export function isTableValue(raw: unknown): boolean {
  return typeof raw === "string" && raw.startsWith(PREFIX);
}

export function parseTable(raw: unknown): TableValue | null {
  if (!isTableValue(raw)) return null;
  try {
    const v = JSON.parse(raw as string);
    return {
      cols: Array.isArray(v.cols) ? v.cols : [],
      rows: Array.isArray(v.rows) ? v.rows.filter((r: unknown) => r && typeof r === "object") : [],
    };
  } catch {
    return null;
  }
}

export function serializeTable(v: TableValue): string {
  return JSON.stringify({ t: 1, cols: v.cols, rows: v.rows });
}

/** Columns to render: template first, stored copy as fallback. */
export function tableColumns(field: Pick<CustomFieldDef, "tableColumns"> | undefined, value?: TableValue | null): TableColumnDef[] {
  if (field?.tableColumns?.length) return field.tableColumns;
  return (value?.cols || []).map((c) => ({ id: c.id, label: c.label, kind: c.kind }));
}

export function colsSnapshot(cols: TableColumnDef[]): TableValue["cols"] {
  return cols.map((c) => ({ id: c.id, label: c.label, ...(c.kind && c.kind !== "text" ? { kind: c.kind } : {}) }));
}

/** Fresh value for a new report: starting rows (first column prefilled) or one empty row. */
export function initialTableValue(field: CustomFieldDef): string {
  const cols = field.tableColumns || [];
  const first = cols[0]?.id;
  const starts = (field.tableRows || []).map((s) => s.trim()).filter(Boolean);
  const rows: TableRow[] = starts.length && first
    ? starts.map((label) => ({ _k: newRowKey(), [first]: label }))
    : [{ _k: newRowKey() }];
  return serializeTable({ cols: colsSnapshot(cols), rows });
}

const cellFilled = (row: TableRow, colId: string) => !!row[colId]?.toString().trim();

/**
 * Rows that should appear in the PDF: at least one filled cell, and not just an
 * untouched starting row (a prefilled first column with nothing else filled in).
 */
export function filledRows(value: TableValue | null, field?: Pick<CustomFieldDef, "tableColumns" | "tableRows">): TableRow[] {
  if (!value) return [];
  const cols = tableColumns(field, value);
  if (!cols.length) return [];
  const starts = new Set((field?.tableRows || []).map((s) => s.trim()).filter(Boolean));
  const first = cols[0].id;
  return value.rows.filter((row) => {
    const filled = cols.filter((c) => cellFilled(row, c.id));
    if (filled.length === 0) return false;
    if (cols.length > 1 && filled.length === 1 && filled[0].id === first && starts.has(row[first].trim())) return false;
    return true;
  });
}

export function tableHasContent(raw: unknown, field?: Pick<CustomFieldDef, "tableColumns" | "tableRows">): boolean {
  return filledRows(parseTable(raw), field).length > 0;
}

/** Plain-text rows for search: all cell values joined. */
export function tableSearchText(raw: unknown): string {
  const v = parseTable(raw);
  if (!v) return typeof raw === "string" ? raw : "";
  return v.rows.map((r) => Object.entries(r).filter(([k]) => k !== "_k").map(([, c]) => c).join(" ")).join(" ");
}
