import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { TableColumnDef } from "@/lib/storage";

export interface GridDef {
  tableColumns: TableColumnDef[];
  tableRows: string[];
}

const newColId = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** a, b, … z, aa, ab … */
export const rowLetter = (i: number) => {
  let n = i + 1, s = "";
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(97 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

/**
 * Model ↔ builder. In the template, row names are the values of the first column
 * (`tableRows`). In the builder that first column is shown as the row header
 * (a, b, c…) and the numbered columns 1, 2, 3… are the ones filled in on site.
 */
export function splitGrid(cols: TableColumnDef[] = [], rows: string[] = []) {
  const hasRows = rows.length > 0 && cols.length > 0;
  return { head: hasRows ? cols[0] : undefined, data: hasRows ? cols.slice(1) : cols, rows: hasRows ? rows : [] };
}

export function joinGrid(head: TableColumnDef | undefined, data: TableColumnDef[], rows: string[]): GridDef {
  if (rows.length === 0) return { tableColumns: data, tableRows: [] };
  return { tableColumns: [head ?? { id: newColId(), label: "", kind: "text" }, ...data], tableRows: rows };
}

/** Drops unnamed columns and rows (used when adding the table and when saving the template). */
export function cleanGrid(def: GridDef): GridDef {
  const { head, data, rows } = splitGrid(def.tableColumns, def.tableRows);
  const namedRows = rows.map((r) => r.trim()).filter(Boolean);
  const namedCols = data
    .filter((c) => c.label.trim())
    .map((c) => ({ ...c, label: c.label.trim(), ...(c.kind === "choice" ? { options: (c.options || []).filter(Boolean) } : {}) }));
  return joinGrid(head ? { ...head, label: head.label.trim() } : undefined, namedCols, namedRows);
}

export const dataColumnCount = (def: GridDef) => splitGrid(def.tableColumns, def.tableRows).data.length;

export const emptyGrid = (): GridDef => ({
  tableColumns: [{ id: newColId(), label: "", kind: "text" }, { id: newColId(), label: "", kind: "text" }],
  tableRows: [],
});

/** Keeps what was typed (commas, spaces) while passing parsed options up. */
function OptionsInput({ options, onChange }: { options: string[]; onChange: (o: string[]) => void }) {
  const [raw, setRaw] = useState(options.join(", "));
  return (
    <input
      className="mt-1 w-full h-7 rounded-md border border-border bg-background px-2 text-[11px] font-normal focus:outline-none focus:border-accent"
      value={raw}
      onChange={(e) => { setRaw(e.target.value); onChange(e.target.value.split(",").map((o) => o.trim()).filter(Boolean)); }}
      placeholder="opcje: tak, nie"
    />
  );
}

const inputCls = "w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/70 focus:outline-none focus:border-accent";

/**
 * Table builder that looks like the table: columns 1, 2, 3… across the top,
 * rows a, b, c… down the side. Add one, name it, see it in place.
 */
export function TableGridBuilder({ columns, rows, onChange }: { columns: TableColumnDef[]; rows: string[]; onChange: (def: GridDef) => void }) {
  const { head, data, rows: rowNames } = splitGrid(columns, rows);
  const boxRef = useRef<HTMLDivElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (!focusKey || !boxRef.current) return;
    const el = boxRef.current.querySelector<HTMLInputElement>(`[data-focus="${focusKey}"]`);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
    setFocusKey(null);
  }, [focusKey, columns, rows]);

  const emit = (h: TableColumnDef | undefined, d: TableColumnDef[], r: string[]) => onChange(joinGrid(h, d, r));
  const setCol = (id: string, patch: Partial<TableColumnDef>) => emit(head, data.map((c) => (c.id === id ? { ...c, ...patch } : c)), rowNames);
  const moveCol = (i: number, dir: -1 | 1) => {
    const t = i + dir;
    if (t < 0 || t >= data.length) return;
    const next = [...data];
    [next[i], next[t]] = [next[t], next[i]];
    emit(head, next, rowNames);
  };
  const addCol = () => {
    const c: TableColumnDef = { id: newColId(), label: "", kind: "text" };
    emit(head, [...data, c], rowNames);
    setFocusKey(`c:${c.id}`);
  };
  const addRow = () => {
    emit(head, data, [...rowNames, ""]);
    setFocusKey(`r:${rowNames.length}`);
  };

  return (
    <div className="space-y-2">
      <div ref={boxRef} className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="bg-muted/40">
              {rowNames.length > 0 && (
                <th className="sticky left-0 z-10 bg-muted p-1.5 align-top w-[176px] min-w-[176px] border-r border-border text-left font-normal">
                  <div className="h-6 flex items-center text-[10px] text-muted-foreground">Nazwy wierszy</div>
                  <input
                    className={inputCls}
                    value={head?.label || ""}
                    onChange={(e) => head && emit({ ...head, label: e.target.value }, data, rowNames)}
                    placeholder="nagłówek (opcj.)"
                    aria-label="Nagłówek kolumny z nazwami wierszy"
                  />
                </th>
              )}
              {data.map((c, i) => (
                <th key={c.id} className="p-1.5 align-top w-[128px] min-w-[128px] border-r border-border last:border-r-0 text-left font-normal">
                  <div className="h-6 flex items-center gap-0.5">
                    <span className="inline-flex h-5 min-w-[1.25rem] px-1 items-center justify-center rounded-md bg-accent/15 text-accent text-[11px] font-bold">{i + 1}</span>
                    <button type="button" onClick={() => moveCol(i, -1)} disabled={i === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20" aria-label={`Przesuń kolumnę ${i + 1} w lewo`}><ChevronLeft className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => moveCol(i, 1)} disabled={i === data.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20" aria-label={`Przesuń kolumnę ${i + 1} w prawo`}><ChevronRight className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => emit(head, data.filter((x) => x.id !== c.id), rowNames)} className="ml-auto p-0.5 text-muted-foreground hover:text-destructive" aria-label={`Usuń kolumnę ${i + 1}`}><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <input
                    data-focus={`c:${c.id}`}
                    className={inputCls}
                    value={c.label}
                    onChange={(e) => setCol(c.id, { label: e.target.value })}
                    placeholder={`nazwa kolumny ${i + 1}`}
                    aria-label={`Nazwa kolumny ${i + 1}`}
                  />
                  <select
                    className="mt-1 w-full h-7 rounded-md border border-border bg-background px-1.5 text-[11px] font-normal text-muted-foreground focus:outline-none focus:border-accent"
                    value={c.kind || "text"}
                    onChange={(e) => {
                      const kind = e.target.value as TableColumnDef["kind"];
                      setCol(c.id, kind === "choice" ? { kind, options: c.options?.length ? c.options : ["pozytywna", "negatywna"] } : { kind, options: undefined });
                    }}
                    aria-label={`Rodzaj kolumny ${i + 1}`}
                  >
                    <option value="text">tekst</option>
                    <option value="number">liczba</option>
                    <option value="choice">wybór z listy</option>
                  </select>
                  {c.kind === "choice" && <OptionsInput options={c.options || []} onChange={(options) => setCol(c.id, { options })} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowNames.map((r, i) => (
              <tr key={i}>
                <td className="sticky left-0 z-10 bg-card p-1.5 w-[176px] min-w-[176px] border-r border-t border-border">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex h-5 min-w-[1.25rem] px-1 items-center justify-center rounded-md bg-primary/10 text-foreground text-[11px] font-bold">{rowLetter(i)}</span>
                    <input
                      data-focus={`r:${i}`}
                      className={inputCls}
                      value={r}
                      onChange={(e) => emit(head, data, rowNames.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder="nazwa wiersza"
                      aria-label={`Nazwa wiersza ${rowLetter(i)}`}
                    />
                    <button type="button" onClick={() => emit(head, data, rowNames.filter((_, j) => j !== i))} className="p-0.5 text-muted-foreground hover:text-destructive shrink-0" aria-label={`Usuń wiersz ${rowLetter(i)}`}><X className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
                {data.map((c) => (
                  <td key={c.id} className="p-1.5 border-t border-r border-border last:border-r-0 text-center text-[10px] italic text-muted-foreground/60">w terenie</td>
                ))}
              </tr>
            ))}
            {rowNames.length === 0 && (
              <tr>
                {data.map((c) => (
                  <td key={c.id} className="p-1.5 h-9 border-t border-r border-border last:border-r-0 text-center text-[10px] italic text-muted-foreground/60">w terenie</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        {rowNames.length === 0
          ? "Wiersze dopisze technik w terenie. Jeśli mają stałe nazwy (np. liczniki), dodaj je przyciskiem „Wiersz”."
          : "Nazwane wiersze będą w każdym raporcie. Technik i tak może dopisać kolejne."}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={addCol} className="h-10 rounded-lg border border-dashed border-accent/50 text-xs font-semibold text-accent hover:bg-accent/5 flex items-center justify-center gap-1.5 transition-colors">
          <Plus className="h-4 w-4" /> Kolumna {data.length + 1}
        </button>
        <button type="button" onClick={addRow} className="h-10 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1.5 transition-colors">
          <Plus className="h-4 w-4" /> Wiersz {rowLetter(rowNames.length)}
        </button>
      </div>
    </div>
  );
}
