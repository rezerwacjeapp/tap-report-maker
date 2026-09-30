import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CustomFieldDef } from "@/lib/storage";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  parseTable, serializeTable, initialTableValue, tableColumns, colsSnapshot, newRowKey, filledRows,
  type TableRow,
} from "@/lib/table-field";

interface Props {
  field: CustomFieldDef;
  value: string | undefined;
  onChange: (raw: string) => void;
}

const rowsWord = (n: number) =>
  n === 1 ? "wiersz" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "wiersze" : "wierszy";

const FIRST_COL = 156; // px — sticky first column (row number + name)
const COL = 124; // px — other columns

/**
 * "Tabela" in the report: the same grid the template author built. Scroll sideways,
 * tap a cell and type. "Dalej" on the keyboard jumps to the next cell, so a whole
 * row goes in without closing the keyboard. Row number → Powiel / Usuń.
 */
export function TableFieldInput({ field, value, onChange }: Props) {
  const parsed = useMemo(() => parseTable(value) ?? parseTable(initialTableValue(field)), [value, field]);
  const cols = tableColumns(field, parsed);
  const rows: TableRow[] = parsed?.rows ?? [];
  const filledCount = filledRows(parsed, field).length;
  const hasFixedRows = !!field.tableRows?.length;
  const gridRef = useRef<HTMLDivElement>(null);
  // the one cell being edited; every other cell shows its full (wrapped) text
  const [active, setActive] = useState<string | null>(null);
  const setFocusCell = setActive;

  useEffect(() => {
    if (!active || !gridRef.current) return;
    const el = gridRef.current.querySelector<HTMLElement>(`[data-cell="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);

  const commit = (next: TableRow[]) => onChange(serializeTable({ cols: colsSnapshot(cols), rows: next }));
  const setCell = (rowKey: string, colId: string, v: string) =>
    commit(rows.map((r) => (r._k === rowKey ? { ...r, [colId]: v } : r)));

  // where typing starts in a row: skip the name column when the name is already there
  const startCol = (row: TableRow) => (hasFixedRows && cols.length > 1 && row[cols[0].id]?.trim() ? 1 : 0);

  const moveNext = (ri: number, ci: number) => {
    if (ci + 1 < cols.length) { setFocusCell(`${rows[ri]._k}:${ci + 1}`); return; }
    if (ri + 1 < rows.length) { setFocusCell(`${rows[ri + 1]._k}:${startCol(rows[ri + 1])}`); return; }
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const addRow = () => {
    const k = newRowKey();
    commit([...rows, { _k: k }]);
    setFocusCell(`${k}:0`);
  };
  const duplicateRow = (index: number) => {
    const k = newRowKey();
    commit([...rows.slice(0, index + 1), { ...rows[index], _k: k }, ...rows.slice(index + 1)]);
    setFocusCell(`${k}:${Math.min(1, cols.length - 1)}`);
  };
  const removeRow = (index: number) => {
    const removed = rows[index];
    const next = rows.filter((_, i) => i !== index);
    commit(next.length ? next : [{ _k: newRowKey() }]);
    toast("Usunięto wiersz", {
      action: { label: "Cofnij", onClick: () => commit([...next.slice(0, index), removed, ...next.slice(index)]) },
    });
  };

  if (!cols.length) {
    return <p className="text-xs text-muted-foreground">Ta tabela nie ma jeszcze kolumn — dodaj je w edytorze szablonu.</p>;
  }

  const cellBase = "block w-full min-h-11 bg-transparent px-2.5 text-[15px] focus:outline-none focus:bg-accent/5 focus:ring-2 focus:ring-inset focus:ring-accent rounded-none";

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground pr-7">
        {filledCount > 0 ? `${filledCount} ${rowsWord(filledCount)} w PDF` : "Dotknij komórki, żeby wpisać. Puste wiersze nie trafią do PDF."}
      </p>

      <div ref={gridRef} className="overflow-x-auto rounded-xl border border-border bg-card" style={{ scrollPaddingLeft: FIRST_COL }}>
        <table className="border-separate border-spacing-0 text-sm table-fixed" style={{ width: FIRST_COL + (cols.length - 1) * COL }}>
          <colgroup>
            {cols.map((c, ci) => <col key={c.id} style={{ width: ci === 0 ? FIRST_COL : COL }} />)}
          </colgroup>
          <thead>
            <tr className="bg-muted/60">
              {cols.map((c, ci) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`px-2.5 py-2 text-[11px] font-semibold text-muted-foreground align-bottom border-b border-border break-words ${ci === 0 ? "sticky left-0 z-10 bg-muted text-left border-r" : `${c.kind === "number" ? "text-right" : "text-left"} border-r last:border-r-0`}`}
                >
                  {ci === 0 ? <span className="pl-8 block">{c.label || (hasFixedRows ? "" : "Kolumna 1")}</span> : c.label || `Kolumna ${ci + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row._k || ri} className="table-row-card">
                {cols.map((c, ci) => {
                  const v = row[c.id] ?? "";
                  const cellKey = `${row._k}:${ci}`;
                  const label = `${c.label || `Kolumna ${ci + 1}`}, wiersz ${ri + 1}`;
                  const isLast = ri === rows.length - 1 && ci === cols.length - 1;

                  const input = c.kind === "choice" && c.options?.length ? (
                    <select
                      data-cell={cellKey}
                      aria-label={label}
                      className={`${cellBase} font-semibold ${v ? "text-foreground" : "text-muted-foreground/50"}`}
                      value={v}
                      onChange={(e) => setCell(row._k, c.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : active === cellKey ? (
                    <input
                      data-cell={cellKey}
                      aria-label={label}
                      type="text"
                      autoFocus
                      inputMode={c.kind === "number" ? "decimal" : "text"}
                      enterKeyHint={isLast ? "done" : "next"}
                      autoComplete="off"
                      className={`${cellBase} h-full py-2.5 bg-accent/5 ring-2 ring-inset ring-accent ${c.kind === "number" ? "text-right tabular-nums" : ""} ${ci === 0 ? "font-semibold pl-1" : ""}`}
                      value={v}
                      onChange={(e) => setCell(row._k, c.id, e.target.value)}
                      onBlur={() => setActive((a) => (a === cellKey ? null : a))}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); moveNext(ri, ci); } }}
                    />
                  ) : (
                    <div
                      data-cell={cellKey}
                      role="button"
                      tabIndex={0}
                      aria-label={v ? `${label}: ${v}` : `${label}: puste`}
                      onClick={() => setActive(cellKey)}
                      onFocus={() => setActive(cellKey)}
                      className={`${cellBase} py-2.5 leading-snug whitespace-pre-wrap break-words cursor-text ${c.kind === "number" ? "text-right tabular-nums" : ""} ${ci === 0 ? "font-semibold pl-1" : ""}`}
                    >
                      {v}
                    </div>
                  );

                  if (ci > 0) {
                    return <td key={c.id} className={`p-0 border-border ${ci < cols.length - 1 ? "border-r" : ""} ${ri < rows.length - 1 ? "border-b" : ""}`}>{input}</td>;
                  }
                  return (
                    <td key={c.id} className={`p-0 sticky left-0 z-10 bg-card border-r border-border ${ri < rows.length - 1 ? "border-b" : ""}`}>
                      <div className="flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="ml-1.5 shrink-0 h-7 min-w-[1.75rem] px-1 rounded-md bg-muted text-[11px] font-bold text-muted-foreground hover:text-foreground"
                              aria-label={`Wiersz ${ri + 1} — opcje`}
                            >
                              {ri + 1}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onSelect={() => duplicateRow(ri)}><Copy className="h-4 w-4 mr-2" /> Powiel wiersz</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => removeRow(ri)} className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Usuń wiersz</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="flex-1 min-w-0">{input}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="w-full h-11 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="h-4 w-4" /> Dodaj wiersz
      </button>
      {rows.length > 0 && cols.length > 2 && (
        <p className="text-[11px] text-muted-foreground">Przesuń tabelę w bok, żeby zobaczyć kolejne kolumny. Numer wiersza → powiel albo usuń.</p>
      )}
    </div>
  );
}
