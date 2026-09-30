import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CustomFieldDef, TableColumnDef } from "@/lib/storage";
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

/**
 * "Tabela" on the phone: every row is a small card with all its columns visible,
 * so reading, typing and correcting happen in one place — no switching between
 * a grid view and an edit view. Numbers get the numeric keypad, choice columns
 * are tap buttons.
 */
export function TableFieldInput({ field, value, onChange }: Props) {
  const parsed = useMemo(() => parseTable(value) ?? parseTable(initialTableValue(field)), [value, field]);
  const cols = tableColumns(field, parsed);
  const rows: TableRow[] = parsed?.rows ?? [];
  const filledCount = filledRows(parsed, field).length;
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusKey || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-row="${focusKey}"] input`);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    setFocusKey(null);
  }, [focusKey, rows.length]);

  const commit = (next: TableRow[]) => onChange(serializeTable({ cols: colsSnapshot(cols), rows: next }));

  const setCell = (rowKey: string, colId: string, v: string) =>
    commit(rows.map((r) => (r._k === rowKey ? { ...r, [colId]: v } : r)));

  const addRow = () => {
    const k = newRowKey();
    commit([...rows, { _k: k }]);
    setFocusKey(k);
  };

  const duplicateRow = (index: number) => {
    const k = newRowKey();
    const copy = { ...rows[index], _k: k };
    const next = [...rows.slice(0, index + 1), copy, ...rows.slice(index + 1)];
    commit(next);
    setFocusKey(k);
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

  const spanOf = (c: TableColumnDef, i: number) => (i === 0 || c.kind !== "number" ? "col-span-2" : "col-span-1");

  return (
    <div ref={listRef} className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 pr-7">
        <span className="text-xs text-muted-foreground">
          {filledCount > 0 ? `${filledCount} ${rowsWord(filledCount)} w PDF` : "Puste wiersze nie trafią do PDF"}
        </span>
      </div>

      {rows.map((row, index) => {
        const title = row[cols[0].id]?.trim();
        return (
          <div key={row._k || index} data-row={row._k} className="table-row-card rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{index + 1}.</span>
              <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">{title || "Nowy wiersz"}</span>
              <button
                type="button"
                onClick={() => duplicateRow(index)}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`Powiel wiersz ${index + 1}`}
              >
                <Copy className="h-3.5 w-3.5" /> Powiel
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                aria-label={`Usuń wiersz ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-2.5 px-3 pb-3 pt-2">
              {cols.map((c, ci) => {
                const v = row[c.id] ?? "";
                const inputId = `${field.id}-${row._k}-${c.id}`;
                return (
                  <div key={c.id} className={`${spanOf(c, ci)} min-w-0`}>
                    <label htmlFor={inputId} className="block text-[11px] font-medium text-muted-foreground mb-1 truncate">{c.label}</label>
                    {c.kind === "choice" && c.options?.length ? (
                      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={c.label}>
                        {c.options.map((opt) => {
                          const on = v === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => setCell(row._k, c.id, on ? "" : opt)}
                              className={`h-9 rounded-lg px-3 text-sm font-medium border transition-colors ${on ? "bg-accent text-white border-accent" : "bg-background text-muted-foreground border-border hover:text-foreground"}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        inputMode={c.kind === "number" ? "decimal" : "text"}
                        enterKeyHint="next"
                        autoComplete="off"
                        className={`w-full h-10 rounded-lg border border-border bg-background px-3 text-[15px] focus:outline-none focus:border-accent transition-colors ${c.kind === "number" ? "tabular-nums" : ""}`}
                        value={v}
                        onChange={(e) => setCell(row._k, c.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addRow}
        className="w-full h-11 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="h-4 w-4" /> Dodaj wiersz
      </button>
    </div>
  );
}
