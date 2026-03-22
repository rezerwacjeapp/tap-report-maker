import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, X, ChevronDown, ChevronRight, GripVertical, ArrowUp, ArrowDown, Type, AlignLeft, Calendar, Hash, Camera, PenTool, ListChecks } from "lucide-react";
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
  const [expandedAddType, setExpandedAddType] = useState<CustomFieldType | null>(null);
  const [newTileOptionLabel, setNewTileOptionLabel] = useState<Record<string, string>>({});

  // Staging area for building a tiles section before adding
  const [stagingTilesName, setStagingTilesName] = useState("");
  const [stagingTiles, setStagingTiles] = useState<{id: string; label: string}[]>([]);
  const [stagingTileInput, setStagingTileInput] = useState("");

  const addStagingTile = () => {
    if (!stagingTileInput.trim()) return;
    setStagingTiles((prev) => [...prev, { id: `to_${Date.now()}`, label: stagingTileInput.trim() }]);
    setStagingTileInput("");
  };

  const removeStagingTile = (id: string) => setStagingTiles((prev) => prev.filter((t) => t.id !== id));

  const commitTilesSection = () => {
    if (!stagingTilesName.trim()) return;
    const f: CustomFieldDef = {
      id: `cf_${Date.now()}`,
      label: stagingTilesName.trim(),
      type: "tiles",
      remember: false,
      order: template!.fields.length,
      tileOptions: [...stagingTiles],
    };
    setTemplate({ ...template!, fields: [...template!.fields, f] });
    setStagingTilesName("");
    setStagingTiles([]);
    setStagingTileInput("");
  };

  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const addFieldInputRef = useRef<HTMLInputElement>(null);

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

  const addCustomField = (typeOverride?: CustomFieldType) => {
    if (!newFieldLabel.trim()) return;
    const type = typeOverride || expandedAddType || "text";
    const f: CustomFieldDef = {
      id: `cf_${Date.now()}`,
      label: newFieldLabel.trim(),
      type,
      remember: false,
      order: template.fields.length,
      ...(type === "tiles" ? { tileOptions: [] } : {}),
    };
    setTemplate({ ...template, fields: [...template.fields, f] });
    setNewFieldLabel("");
    setExpandedAddType(null);
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
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nazwa szablonu (widoczna tylko w aplikacji)</label>
          <input
            className="text-xl font-bold w-full h-12 rounded-xl border border-border bg-card px-4 focus:outline-none focus:border-accent transition-colors font-display"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            placeholder="np. Przegląd klimatyzacji"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tytuł dokumentu (widoczny w nagłówku PDF)</label>
          <input
            className="w-full h-10 rounded-xl border border-border bg-card px-4 text-sm focus:outline-none focus:border-accent"
            value={template.pdfTitle}
            onChange={(e) => setTemplate({ ...template, pdfTitle: e.target.value })}
            placeholder="np. PROTOKÓŁ PRZEGLĄDU KLIMATYZACJI"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Dane firmy w nagłówku PDF</label>
          <button onClick={() => setTemplate({ ...template, showCompanyHeader: !(template.showCompanyHeader !== false) })}>
            {renderToggle(template.showCompanyHeader !== false)}
          </button>
        </div>
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
            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
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

        {/* === ADD FIELD — type-first approach === */}
        <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
          <p className="text-sm font-semibold">Dodaj pole do raportu</p>
          <p className="text-[11px] text-muted-foreground">Wybierz typ pola, a następnie wpisz jego nazwę.</p>

          {/* Type cards grid */}
          <div className="grid grid-cols-3 gap-2">
            {([
              { type: "text" as CustomFieldType, icon: Type, label: "Tekst", hint: "np. nazwa, NIP, adres" },
              { type: "textarea" as CustomFieldType, icon: AlignLeft, label: "Tekst długi", hint: "np. uwagi, opis" },
              { type: "date" as CustomFieldType, icon: Calendar, label: "Data", hint: "np. data wykonania" },
              { type: "number" as CustomFieldType, icon: Hash, label: "Liczba", hint: "np. ilość, powierzchnia" },
              { type: "photos" as CustomFieldType, icon: Camera, label: "Zdjęcia", hint: "dokumentacja foto" },
              { type: "signature" as CustomFieldType, icon: PenTool, label: "Podpis", hint: "podpis palcem" },
            ]).map(({ type, icon: Icon, label, hint }) => (
              <button
                key={type}
                onClick={() => {
                  if (expandedAddType === type) {
                    setExpandedAddType(null);
                    setNewFieldLabel("");
                  } else {
                    setExpandedAddType(type);
                    setNewFieldLabel("");
                    setTimeout(() => addFieldInputRef.current?.focus(), 50);
                  }
                }}
                className={`rounded-xl border p-2.5 text-center transition-all ${expandedAddType === type ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"}`}
              >
                <Icon className={`h-5 w-5 mx-auto mb-1 ${expandedAddType === type ? "text-accent" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium block">{label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight block">{hint}</span>
              </button>
            ))}
          </div>

          {/* Czynności card — separate, wider */}
          <button
            onClick={() => {
              if (expandedAddType === "tiles") {
                setExpandedAddType(null);
              } else {
                setExpandedAddType("tiles");
              }
            }}
            className={`w-full rounded-xl border p-2.5 text-left transition-all flex items-center gap-3 ${expandedAddType === "tiles" ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40"}`}
          >
            <ListChecks className={`h-5 w-5 shrink-0 ${expandedAddType === "tiles" ? "text-accent" : "text-muted-foreground"}`} />
            <div>
              <span className="text-xs font-medium">Czynności (checkboxy)</span>
              <span className="text-[10px] text-muted-foreground block">Sekcja z listą czynności do odhaczania</span>
            </div>
          </button>

          {/* === Expanded panel for simple types === */}
          {expandedAddType && !["signature", "tiles"].includes(expandedAddType) && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Wpisz nazwę pola typu <span className="font-medium text-foreground">{FIELD_TYPE_LABELS[expandedAddType]}</span>:</p>
              <div className="flex gap-1.5">
                <input
                  ref={addFieldInputRef}
                  className="flex-1 h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:border-accent"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newFieldLabel.trim()) addCustomField(expandedAddType); }}
                  placeholder={FIELD_TYPE_HINTS[expandedAddType]}
                />
                <Button variant="accent" onClick={() => addCustomField(expandedAddType)} disabled={!newFieldLabel.trim()} className="h-10 px-4 shrink-0">
                  <Plus className="h-4 w-4 mr-1" /> Dodaj
                </Button>
              </div>
            </div>
          )}

          {/* === Expanded panel for SIGNATURE === */}
          {expandedAddType === "signature" && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Kliknij gotowy podpis lub wpisz własną nazwę:</p>
              <div className="flex flex-wrap gap-2">
                {["Podpis klienta", "Podpis serwisanta", "Podpis inspektora", "Podpis kierownika"].map((label) => (
                  <button key={label} onClick={() => {
                    const f: CustomFieldDef = { id: `cf_${Date.now()}`, label, type: "signature", remember: false, order: template.fields.length };
                    setTemplate({ ...template, fields: [...template.fields, f] });
                    toast.success(`Dodano: ${label}`);
                  }} className="rounded-md border border-accent/30 bg-card px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/10 transition-all">
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  ref={addFieldInputRef}
                  className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-xs focus:outline-none focus:border-accent"
                  placeholder="Inna nazwa — np. Podpis świadka"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newFieldLabel.trim()) addCustomField("signature"); }}
                />
                <Button variant="accent" size="icon" onClick={() => { if (newFieldLabel.trim()) addCustomField("signature"); }} className="h-9 w-9 shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* === Expanded panel for TILES/CZYNNOŚCI === */}
          {expandedAddType === "tiles" && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Nazwij sekcję, dodaj czynności i kliknij „Dodaj do raportu".</p>
              <input className="w-full h-9 rounded-md border border-border bg-card px-3 text-xs focus:outline-none focus:border-accent" placeholder="Nazwa sekcji — np. Czynności serwisowe" value={stagingTilesName} onChange={(e) => setStagingTilesName(e.target.value)} />

              {stagingTiles.length > 0 && (
                <div className="space-y-1 border-l-2 border-accent/30 pl-3 ml-1">
                  {stagingTiles.map((tile) => (
                    <div key={tile.id} className="flex items-center gap-2 text-xs">
                      <span className="text-accent">•</span>
                      <span className="flex-1">{tile.label}</span>
                      <button onClick={() => removeStagingTile(tile.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5">
                <input className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-xs focus:outline-none focus:border-accent" placeholder="Nazwa czynności — np. Czyszczenie filtrów" value={stagingTileInput} onChange={(e) => setStagingTileInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addStagingTile(); }} />
                <Button variant="outline" size="icon" onClick={addStagingTile} className="h-9 w-9 shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>

              <Button variant="accent" size="sm" onClick={() => { commitTilesSection(); setExpandedAddType(null); }} className="w-full" disabled={!stagingTilesName.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Dodaj do raportu {stagingTiles.length > 0 && `(${stagingTiles.length} czynności)`}
              </Button>
            </div>
          )}
        </div>

        {/* Current fields — draggable with up/down */}
        {template.fields.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kolejność pól w raporcie ({template.fields.length})</p>
            {template.fields.map((field, index) => (
              <div key={field.id}>
                <div draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleFieldDragEnd} onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-2 cursor-grab active:cursor-grabbing">
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
