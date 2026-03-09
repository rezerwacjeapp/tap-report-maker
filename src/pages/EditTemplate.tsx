import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, X, ChevronDown, ChevronRight, GripVertical, Camera, PenTool } from "lucide-react";
import {
  getTemplateById, saveUserTemplate, createBlankTemplate, duplicateTemplate,
  FIELD_CATALOG, TILE_CATALOG, getActiveFieldBlockIds, getActiveTileBlockIds,
  getFieldCategories, getTileCategories, STARTER_TEMPLATES,
  type ReportTemplate, type SignatureFieldDef,
} from "@/lib/templates";
import type { CustomFieldDef, TileItem, CustomFieldType } from "@/lib/storage";
import { toast } from "sonner";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Tekst", textarea: "Tekst długi", date: "Data", number: "Liczba",
};

type TabType = "fields" | "tiles" | "options";

export default function EditTemplate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("id");
  const fromStarter = searchParams.get("from");
  const isNew = searchParams.get("new") === "1";

  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [tab, setTab] = useState<TabType>("fields");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newTileLabel, setNewTileLabel] = useState("");

  // Drag state
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
  const activeTileBlocks = getActiveTileBlockIds(template);

  // --- Field/Tile block toggles ---
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

  const toggleTileBlock = (blockId: string) => {
    const block = TILE_CATALOG.find((b) => b.id === blockId);
    if (!block) return;
    const isActive = activeTileBlocks.has(blockId);
    let newTiles: TileItem[];
    if (isActive) {
      const ids = new Set(block.tiles.map((t) => t.id));
      newTiles = template.tiles.filter((t) => !ids.has(t.id));
    } else {
      const existing = new Set(template.tiles.map((t) => t.id));
      newTiles = [...template.tiles, ...block.tiles.filter((t) => !existing.has(t.id))];
    }
    setTemplate({ ...template, tiles: newTiles });
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCats(next);
  };

  // --- Custom add ---
  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const f: CustomFieldDef = { id: `cf_${Date.now()}`, label: newFieldLabel.trim(), type: newFieldType, remember: false, order: template.fields.length };
    setTemplate({ ...template, fields: [...template.fields, f] });
    setNewFieldLabel("");
  };

  const addCustomTile = () => {
    if (!newTileLabel.trim()) return;
    setTemplate({ ...template, tiles: [...template.tiles, { id: `ct_${Date.now()}`, label: newTileLabel.trim() }] });
    setNewTileLabel("");
  };

  // --- Remove ---
  const removeField = (id: string) => setTemplate({ ...template, fields: template.fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })) });
  const removeTile = (id: string) => setTemplate({ ...template, tiles: template.tiles.filter((t) => t.id !== id) });

  // --- Drag reorder ---
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

  const handleTileDragEnd = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const items = [...template.tiles];
    const [dragged] = items.splice(dragItemRef.current, 1);
    items.splice(dragOverRef.current, 0, dragged);
    dragItemRef.current = null;
    dragOverRef.current = null;
    setTemplate({ ...template, tiles: items });
  };

  // --- Signature fields ---
  const addSignatureField = () => {
    const sf: SignatureFieldDef = { id: `sig_${Date.now()}`, label: "Podpis" };
    setTemplate({ ...template, signatureFields: [...(template.signatureFields || []), sf] });
  };

  const updateSignatureLabel = (id: string, label: string) => {
    setTemplate({
      ...template,
      signatureFields: (template.signatureFields || []).map((s) => s.id === id ? { ...s, label } : s),
    });
  };

  const removeSignatureField = (id: string) => {
    setTemplate({ ...template, signatureFields: (template.signatureFields || []).filter((s) => s.id !== id) });
  };

  // --- Save ---
  const handleSave = () => {
    if (!template.name.trim()) { toast.error("Podaj nazwę szablonu"); return; }
    saveUserTemplate(template);
    toast.success("Szablon zapisany!");
    navigate("/select-template");
  };

  // --- Catalog toggle render helper ---
  const renderToggle = (isActive: boolean) => (
    <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${isActive ? "bg-accent justify-end" : "bg-muted justify-start"}`}>
      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
    </div>
  );

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
      </header>

      <div className="px-5 py-1 text-xs text-muted-foreground">
        {template.fields.length} pól • {template.tiles.length} czynności • {(template.signatureFields || []).length} podpisów
      </div>

      {/* Tabs */}
      <div className="px-5 flex gap-1.5 mb-3">
        {(["fields", "tiles", "options"] as TabType[]).map((t) => (
          <Button key={t} variant={tab === t ? "accent" : "outline"} size="sm" onClick={() => setTab(t)} className="flex-1 text-xs">
            {t === "fields" ? `Pola (${template.fields.length})` : t === "tiles" ? `Czynności (${template.tiles.length})` : "Opcje"}
          </Button>
        ))}
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto space-y-4">

        {/* === FIELDS TAB === */}
        {tab === "fields" && (
          <>
            <p className="text-xs text-muted-foreground">Włącz klocki lub dodaj własne. Przeciągnij aby zmienić kolejność.</p>

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
            </div>

            {/* Current fields — draggable */}
            {template.fields.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wybrane pola ({template.fields.length})</p>
                {template.fields.map((field, index) => (
                  <div key={field.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleFieldDragEnd} onDragOver={(e) => e.preventDefault()}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{field.label}</span>
                    <span className="text-xs text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
                    <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === TILES TAB === */}
        {tab === "tiles" && (
          <>
            <p className="text-xs text-muted-foreground">Włącz czynności lub dodaj własne. Przeciągnij aby zmienić kolejność.</p>

            {getTileCategories().map((cat) => {
              const blocks = TILE_CATALOG.filter((b) => b.category === cat);
              const isExpanded = expandedCats.has(cat);
              const activeCount = blocks.filter((b) => activeTileBlocks.has(b.id)).length;
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
                        <button key={block.id} onClick={() => toggleTileBlock(block.id)} className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors">
                          <span className="text-sm">{block.label}</span>
                          {renderToggle(activeTileBlocks.has(block.id))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-2">
              <p className="text-sm font-semibold">Dodaj własną czynność</p>
              <div className="flex gap-2">
                <input className="flex-1 h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent" value={newTileLabel} onChange={(e) => setNewTileLabel(e.target.value)} placeholder="Nazwa czynności" onKeyDown={(e) => e.key === "Enter" && addCustomTile()} />
                <Button variant="accent" size="icon" onClick={addCustomTile} className="h-11 w-11"><Plus className="h-5 w-5" /></Button>
              </div>
            </div>

            {template.tiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wybrane czynności ({template.tiles.length})</p>
                {template.tiles.map((tile, index) => (
                  <div key={tile.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleTileDragEnd} onDragOver={(e) => e.preventDefault()}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1 truncate">{tile.label}</span>
                    <button onClick={() => removeTile(tile.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === OPTIONS TAB === */}
        {tab === "options" && (
          <div className="space-y-6">
            {/* Photos toggle */}
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <button onClick={() => setTemplate({ ...template, hasPhotos: !template.hasPhotos })} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Dokumentacja fotograficzna</p>
                    <p className="text-xs text-muted-foreground">Zdjęcia w raporcie i PDF</p>
                  </div>
                </div>
                {renderToggle(template.hasPhotos ?? true)}
              </button>
            </div>

            {/* Signature fields */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-semibold">Pola podpisów</p>
              </div>
              <p className="text-xs text-muted-foreground">Dodaj pola na podpisy — klient, serwisant, inspektor, kto chcesz.</p>

              {(template.signatureFields || []).map((sf) => (
                <div key={sf.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent"
                    value={sf.label}
                    onChange={(e) => updateSignatureLabel(sf.id, e.target.value)}
                    placeholder="Nazwa podpisu (np. Podpis inspektora)"
                  />
                  <button onClick={() => removeSignatureField(sf.id)} className="text-muted-foreground hover:text-destructive p-2">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}

              <Button variant="outline" className="w-full" onClick={addSignatureField}>
                <Plus className="h-4 w-4 mr-2" /> Dodaj pole podpisu
              </Button>

              {(template.signatureFields || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Brak pól podpisu — raport będzie bez podpisów.
                </p>
              )}
            </div>

            {/* PDF Title */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Tytuł w PDF</p>
              <input
                className="w-full h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent"
                value={template.pdfTitle}
                onChange={(e) => setTemplate({ ...template, pdfTitle: e.target.value })}
                placeholder="np. PROTOKÓŁ PRZEGLĄDU"
              />
            </div>
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
