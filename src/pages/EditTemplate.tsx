import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, X, ChevronDown, ChevronRight, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import {
  getTemplateById, saveUserTemplate, createBlankTemplate, duplicateTemplate,
  FIELD_CATALOG, getActiveFieldBlockIds,
  getFieldCategories, STARTER_TEMPLATES, countTileOptions,
  type ReportTemplate,
} from "@/lib/templates";
import type { CustomFieldDef, CustomFieldType } from "@/lib/storage";
import { toast } from "sonner";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Tekst", textarea: "Tekst długi", date: "Data", number: "Liczba",
  tiles: "Czynności", photos: "Zdjęcia", signature: "Podpis",
};

const FIELD_TYPE_HINTS: Record<CustomFieldType, string> = {
  text: "Krótkie pole tekstowe — np. nazwa klienta, adres, numer seryjny.",
  textarea: "Długie pole na opis — np. uwagi, zalecenia, stan techniczny.",
  date: "Pole daty — np. data wykonania, data następnego przeglądu.",
  number: "Pole liczbowe — np. powierzchnia, ilość, rok produkcji.",
  tiles: "Sekcja z checkboxami do odhaczania — np. lista czynności serwisowych.",
  photos: "Dokumentacja fotograficzna — osobne zdjęcia dla tej sekcji raportu.",
  signature: "Pole na podpis palcem — np. podpis klienta, serwisanta, inspektora.",
};

export default function EditTemplate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("id");
  const fromStarter = searchParams.get("from");
  const isNew = searchParams.get("new") === "1";

  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newTileOptionLabel, setNewTileOptionLabel] = useState<Record<string, string>>({});

  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  useEffect(() => {
    if (isNew) {
      setTemplate(createBlankTemplate("Nowy szablon"));
    } else if (fromStarter) {
      const starter = STARTER_TEMPLATES.find((s) => s.id === fromStarter);
      if (starter) setTemplate(duplicateTemplate(starter, starter.name));
      else navigate("/select-template");
    } else if (sourceId) {
      const t = getTemplateById(sourceId);
      if (t && !t.builtIn) setTemplate({ ...t });
      else if (t) setTemplate(duplicateTemplate(t, t.name));
      else navigate("/select-template");
    } else {
      navigate("/select-template");
    }
  }, [sourceId, fromStarter, isNew, navigate]);

  if (!template) return null;

  const activeFieldBlocks = getActiveFieldBlockIds(template);

  const toggleFieldBlock = (blockId: string) => {
    const block = FIELD_CATALOG.find((b) => b.id === blockId);
    if (!block) return;
    const isActive = activeFieldBlocks.has(blockId);
    let newFields: CustomFieldDef[];
    if (isActive) {
      const ids = new Set(block.fields.map((f) => f.id));
      newFields = template.fields.filter((f) => !ids.has(f.id));
    } else {
      const existing = new Set(template.fields.map((f) => f.id));
      const toAdd = block.fields.filter((f) => !existing.has(f.id)).map((f, i) => ({ ...f, order: template.fields.length + i }));
      newFields = [...template.fields, ...toAdd];
    }
    setTemplate({ ...template, fields: newFields.map((f, i) => ({ ...f, order: i })) });
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCats(next);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const f: CustomFieldDef = {
      id: `cf_${Date.now()}`,
      label: newFieldLabel.trim(),
      type: newFieldType,
      remember: false,
      order: template.fields.length,
      ...(newFieldType === "tiles" ? { tileOptions: [] } : {}),
    };
    setTemplate({ ...template, fields: [...template.fields, f] });
    setNewFieldLabel("");
  };

  const removeField = (id: string) => setTemplate({ ...template, fields: template.fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })) });

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= template.fields.length) return;
    const items = [...template.fields];
    [items[index], items[target]] = [items[target], items[index]];
    setTemplate({ ...template, fields: items.map((f, i) => ({ ...f, order: i })) });
  };

  const addTileOption = (fieldId: string) => {
    const label = (newTileOptionLabel[fieldId] || "").trim();
    if (!label) return;
    setTemplate({
      ...template,
      fields: template.fields.map((f) =>
        f.id === fieldId ? { ...f, tileOptions: [...(f.tileOptions || []), { id: `to_${Date.now()}`, label }] } : f
      ),
    });
    setNewTileOptionLabel({ ...newTileOptionLabel, [fieldId]: "" });
  };

  const removeTileOption = (fieldId: string, tileId: string) => {
    setTemplate({
      ...template,
      fields: template.fields.map((f) =>
        f.id === fieldId ? { ...f, tileOptions: (f.tileOptions || []).filter((t) => t.id !== tileId) } : f
      ),
    });
  };

  const updateFieldLabel = (id: string, label: string) => {
    setTemplate({ ...template, fields: template.fields.map((f) => f.id === id ? { ...f, label } : f) });
  };

  const handleDragStart = (index: number) => { dragItemRef.current = index; };
  const handleDragEnter = (index: number) => { dragOverRef.current = index; };
  const handleFieldDragEnd = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const items = [...template.fields];
    const [dragged] = items.splice(dragItemRef.current, 1);
    items.splice(dragOverRef.current, 0, dragged);
    dragItemRef.current = null;
    dragOverRef.current = null;
    setTemplate({ ...template, fields: items.map((f, i) => ({ ...f, order: i })) });
  };

  const handleSave = () => {
    if (!template.name.trim()) { toast.error("Podaj nazwę szablonu"); return; }
    saveUserTemplate(template);
    toast.success("Szablon zapisany!");
    navigate("/select-template");
  };

  const renderToggle = (isActive: boolean) => (
    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isActive ? "bg-accent justify-end" : "bg-muted justify-start"}`}>
      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
    </div>
  );

  const dataFieldCount = template.fields.filter((f) => !["tiles", "photos", "signature"].includes(f.type)).length;
  const tileOptionCount = countTileOptions(template);
  const sigCount = template.fields.filter((f) => f.type === "signature").length;
  const hasPhotosField = template.fields.some((f) => f.type === "photos");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="px-5 pt-6 pb-2 space-y-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">Edytor szablonu</span>
        </div>
        <input
          className="text-xl font-bold w-full h-12 rounded-lg border-2 border-border bg-card px-4 focus:outline-none focus:border-accent transition-colors font-display"
          value={template.name}
          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          placeholder="Wpisz nazwę szablonu..."
        />
        <input
          className="w-full h-10 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent"
          value={template.pdfTitle}
          onChange={(e) => setTemplate({ ...template, pdfTitle: e.target.value })}
          placeholder="Tytuł w PDF (np. PROTOKÓŁ PRZEGLĄDU)"
        />
      </header>

      <div className="px-5 py-1 text-xs text-muted-foreground">
        {dataFieldCount} pól • {tileOptionCount} czynności • {hasPhotosField ? "zdjęcia" : "bez zdjęć"} • {sigCount} podpisów
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto space-y-4">
        <p className="text-xs text-muted-foreground">Włącz klocki lub dodaj własne. Strzałkami ↑↓ zmień kolejność — ta sama kolejność będzie w raporcie i PDF.</p>

        {getFieldCategories().map((cat) => {
          const blocks = FIELD_CATALOG.filter((b) => b.category === cat);
          const isExpanded = expandedCats.has(cat);
          const activeCount = blocks.filter((b) => activeFieldBlocks.has(b.id)).length;
          return (
            <div key={cat} className="rounded-xl border-2 border-border bg-card overflow-hidden">
              <button onClick={() => toggleCategory(cat)} className="w-full flex items-center justify-between p-3 text-left">
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-semibold">{cat}</span>
                </div>
                {activeCount > 0 && <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">{activeCount}/{blocks.length}</span>}
              </button>
              {isExpanded && (
                <div className="border-t border-border">
                  {blocks.map((block) => (
                    <button key={block.id} onClick={() => toggleFieldBlock(block.id)} className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors">
                      <span className="text-sm">{block.label}</span>
                      {renderToggle(activeFieldBlocks.has(block.id))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom field adder */}
        <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-2">
          <p className="text-sm font-semibold">Dodaj własne pole</p>
          <input className="w-full h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Nazwa pola" onKeyDown={(e) => e.key === "Enter" && addCustomField()} />
          <div className="flex gap-2">
            <select className="flex-1 h-11 rounded-lg border-2 border-border bg-card px-3 text-sm" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}>
              {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <Button variant="accent" size="icon" onClick={addCustomField} className="h-11 w-11"><Plus className="h-5 w-5" /></Button>
          </div>
          <p className="text-xs text-muted-foreground italic">{FIELD_TYPE_HINTS[newFieldType]}</p>
        </div>

        {/* Current fields — draggable with up/down */}
        {template.fields.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kolejność pól w raporcie ({template.fields.length})</p>
            {template.fields.map((field, index) => (
              <div key={field.id}>
                <div draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleFieldDragEnd} onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveField(index, 1)} disabled={index === template.fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                  {/* Editable label for signature fields */}
                  {field.type === "signature" ? (
                    <input className="text-sm flex-1 min-w-0 bg-transparent border-none outline-none" value={field.label} onChange={(e) => updateFieldLabel(field.id, e.target.value)} placeholder="Nazwa podpisu" />
                  ) : (
                    <span className="text-sm flex-1 truncate">{field.label}</span>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">{FIELD_TYPE_LABELS[field.type]}{field.type === "tiles" ? ` (${(field.tileOptions || []).length})` : ""}</span>
                  <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-4 w-4" /></button>
                </div>

                {/* Tile options editor */}
                {field.type === "tiles" && (
                  <div className="ml-6 mt-1 mb-2 space-y-1.5 border-l-2 border-accent/30 pl-3">
                    {(field.tileOptions || []).length === 0 && (
                      <p className="text-xs text-muted-foreground py-1">Brak czynności — dodaj poniżej.</p>
                    )}
                    {(field.tileOptions || []).map((tile) => (
                      <div key={tile.id} className="flex items-center gap-2 text-sm">
                        <span className="text-accent">•</span>
                        <span className="flex-1 truncate">{tile.label}</span>
                        <button onClick={() => removeTileOption(field.id, tile.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <div className="flex gap-1.5">
                      <input
                        className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-xs focus:outline-none focus:border-accent"
                        placeholder="Nazwa czynności"
                        value={newTileOptionLabel[field.id] || ""}
                        onChange={(e) => setNewTileOptionLabel({ ...newTileOptionLabel, [field.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addTileOption(field.id)}
                      />
                      <Button variant="accent" size="icon" onClick={() => addTileOption(field.id)} className="h-9 w-9 shrink-0"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button variant="accent" size="lg" className="w-full" onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" /> Zapisz szablon
        </Button>
      </div>
    </div>
  );
}
