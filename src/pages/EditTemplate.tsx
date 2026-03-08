import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import {
  getTemplateById, saveUserTemplate, createBlankTemplate, duplicateTemplate,
  FIELD_CATALOG, TILE_CATALOG, getActiveFieldBlockIds, getActiveTileBlockIds,
  getFieldCategories, getTileCategories, STARTER_TEMPLATES,
  type ReportTemplate,
} from "@/lib/templates";
import type { CustomFieldDef, TileItem, CustomFieldType } from "@/lib/storage";
import { toast } from "sonner";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Tekst",
  textarea: "Tekst długi",
  date: "Data",
  number: "Liczba",
};

export default function EditTemplate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceId = searchParams.get("id");
  const fromStarter = searchParams.get("from"); // duplicate from starter
  const isNew = searchParams.get("new") === "1";

  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [tab, setTab] = useState<"fields" | "tiles">("fields");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [newTileLabel, setNewTileLabel] = useState("");

  useEffect(() => {
    if (isNew) {
      const t = createBlankTemplate("Nowy szablon");
      setTemplate(t);
    } else if (fromStarter) {
      const starter = STARTER_TEMPLATES.find((s) => s.id === fromStarter);
      if (starter) {
        const t = duplicateTemplate(starter, starter.name);
        setTemplate(t);
      } else {
        navigate("/select-template");
      }
    } else if (sourceId) {
      const t = getTemplateById(sourceId);
      if (t && !t.builtIn) {
        setTemplate({ ...t });
      } else if (t && t.builtIn) {
        // Duplicate built-in to edit
        const dup = duplicateTemplate(t, t.name);
        setTemplate(dup);
      } else {
        navigate("/select-template");
      }
    } else {
      navigate("/select-template");
    }
  }, [sourceId, fromStarter, isNew, navigate]);

  if (!template) return null;

  const activeFieldBlocks = getActiveFieldBlockIds(template);
  const activeTileBlocks = getActiveTileBlockIds(template);

  const toggleFieldBlock = (blockId: string) => {
    const block = FIELD_CATALOG.find((b) => b.id === blockId);
    if (!block) return;

    const isActive = activeFieldBlocks.has(blockId);
    let newFields: CustomFieldDef[];

    if (isActive) {
      // Remove block fields
      const blockFieldIds = new Set(block.fields.map((f) => f.id));
      newFields = template.fields.filter((f) => !blockFieldIds.has(f.id));
    } else {
      // Add block fields at the end
      const existingIds = new Set(template.fields.map((f) => f.id));
      const toAdd = block.fields
        .filter((f) => !existingIds.has(f.id))
        .map((f, i) => ({ ...f, order: template.fields.length + i }));
      newFields = [...template.fields, ...toAdd];
    }

    const updated = { ...template, fields: newFields.map((f, i) => ({ ...f, order: i })) };
    setTemplate(updated);
  };

  const toggleTileBlock = (blockId: string) => {
    const block = TILE_CATALOG.find((b) => b.id === blockId);
    if (!block) return;

    const isActive = activeTileBlocks.has(blockId);
    let newTiles: TileItem[];

    if (isActive) {
      const blockTileIds = new Set(block.tiles.map((t) => t.id));
      newTiles = template.tiles.filter((t) => !blockTileIds.has(t.id));
    } else {
      const existingIds = new Set(template.tiles.map((t) => t.id));
      const toAdd = block.tiles.filter((t) => !existingIds.has(t.id));
      newTiles = [...template.tiles, ...toAdd];
    }

    const updated = { ...template, tiles: newTiles };
    setTemplate(updated);
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCats(next);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const id = `custom_f_${Date.now()}`;
    const newField: CustomFieldDef = {
      id,
      label: newFieldLabel.trim(),
      type: newFieldType,
      remember: false,
      order: template.fields.length,
    };
    setTemplate({ ...template, fields: [...template.fields, newField] });
    setNewFieldLabel("");
  };

  const addCustomTile = () => {
    if (!newTileLabel.trim()) return;
    const id = `custom_t_${Date.now()}`;
    setTemplate({ ...template, tiles: [...template.tiles, { id, label: newTileLabel.trim() }] });
    setNewTileLabel("");
  };

  const removeField = (fieldId: string) => {
    setTemplate({
      ...template,
      fields: template.fields.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i })),
    });
  };

  const removeTile = (tileId: string) => {
    setTemplate({ ...template, tiles: template.tiles.filter((t) => t.id !== tileId) });
  };

  const handleSave = () => {
    if (!template.name.trim()) {
      toast.error("Podaj nazwę szablonu");
      return;
    }
    saveUserTemplate(template);
    toast.success("Szablon zapisany!");
    navigate("/select-template");
  };

  const fieldCategories = getFieldCategories();
  const tileCategories = getTileCategories();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <input
            className="text-xl font-bold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            placeholder="Nazwa szablonu"
          />
          <input
            className="text-xs text-muted-foreground bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
            value={template.pdfTitle}
            onChange={(e) => setTemplate({ ...template, pdfTitle: e.target.value })}
            placeholder="Tytuł w PDF (np. PROTOKÓŁ PRZEGLĄDU)"
          />
        </div>
      </header>

      {/* Stats bar */}
      <div className="px-5 py-2 flex gap-4 text-xs text-muted-foreground">
        <span>{template.fields.length} pól</span>
        <span>{template.tiles.length} czynności</span>
      </div>

      {/* Tab switcher */}
      <div className="px-5 flex gap-2 mb-3">
        <Button
          variant={tab === "fields" ? "accent" : "outline"}
          size="sm"
          onClick={() => setTab("fields")}
          className="flex-1"
        >
          Pola ({template.fields.length})
        </Button>
        <Button
          variant={tab === "tiles" ? "accent" : "outline"}
          size="sm"
          onClick={() => setTab("tiles")}
          className="flex-1"
        >
          Czynności ({template.tiles.length})
        </Button>
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto space-y-4">
        {/* === FIELDS TAB === */}
        {tab === "fields" && (
          <>
            <p className="text-xs text-muted-foreground">
              Włącz gotowe klocki lub dodaj własne pola. Wybrane pola pojawią się w formularzu i PDF.
            </p>

            {fieldCategories.map((cat) => {
              const blocks = FIELD_CATALOG.filter((b) => b.category === cat);
              const isExpanded = expandedCats.has(cat);
              const activeCount = blocks.filter((b) => activeFieldBlocks.has(b.id)).length;

              return (
                <div key={cat} className="rounded-xl border-2 border-border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                      <span className="text-sm font-semibold">{cat}</span>
                    </div>
                    {activeCount > 0 && (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {activeCount} / {blocks.length}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {blocks.map((block) => {
                        const isActive = activeFieldBlocks.has(block.id);
                        return (
                          <button
                            key={block.id}
                            onClick={() => toggleFieldBlock(block.id)}
                            className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm">{block.label}</span>
                              {block.fields.length > 1 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({block.fields.length} pola)
                                </span>
                              )}
                            </div>
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                              isActive ? "bg-accent justify-end" : "bg-muted justify-start"
                            }`}>
                              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom field adder */}
            <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Dodaj własne pole</p>
              <input
                className="w-full h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent transition-colors"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Nazwa pola (np. Nr faktury)"
                onKeyDown={(e) => e.key === "Enter" && addCustomField()}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 h-11 rounded-lg border-2 border-border bg-card px-3 text-sm focus:outline-none focus:border-accent transition-colors"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
                <Button variant="accent" size="icon" onClick={addCustomField} className="h-11 w-11">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Current fields summary */}
            {template.fields.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Wybrane pola ({template.fields.length})
                </p>
                {template.fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
                    <span className="text-sm flex-1 truncate">{field.label}</span>
                    <span className="text-xs text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
                    <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* === TILES TAB === */}
        {tab === "tiles" && (
          <>
            <p className="text-xs text-muted-foreground">
              Włącz gotowe czynności lub dodaj własne. Pojawią się jako kafelki do zaznaczania.
            </p>

            {tileCategories.map((cat) => {
              const blocks = TILE_CATALOG.filter((b) => b.category === cat);
              const isExpanded = expandedCats.has(cat);
              const activeCount = blocks.filter((b) => activeTileBlocks.has(b.id)).length;

              return (
                <div key={cat} className="rounded-xl border-2 border-border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                      <span className="text-sm font-semibold">{cat}</span>
                    </div>
                    {activeCount > 0 && (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        {activeCount} / {blocks.length}
                      </span>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {blocks.map((block) => {
                        const isActive = activeTileBlocks.has(block.id);
                        return (
                          <button
                            key={block.id}
                            onClick={() => toggleTileBlock(block.id)}
                            className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm flex-1">{block.label}</span>
                            <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${
                              isActive ? "bg-accent justify-end" : "bg-muted justify-start"
                            }`}>
                              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom tile adder */}
            <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-3">
              <p className="text-sm font-semibold">Dodaj własną czynność</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 rounded-lg border-2 border-border bg-card px-4 text-sm focus:outline-none focus:border-accent transition-colors"
                  value={newTileLabel}
                  onChange={(e) => setNewTileLabel(e.target.value)}
                  placeholder="Nazwa czynności"
                  onKeyDown={(e) => e.key === "Enter" && addCustomTile()}
                />
                <Button variant="accent" size="icon" onClick={addCustomTile} className="h-11 w-11">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Current tiles summary */}
            {template.tiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Wybrane czynności ({template.tiles.length})
                </p>
                {template.tiles.map((tile) => (
                  <div key={tile.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
                    <span className="text-sm flex-1 truncate">{tile.label}</span>
                    <button onClick={() => removeTile(tile.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Save button — sticky */}
      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4">
        <Button variant="accent" size="lg" className="w-full" onClick={handleSave}>
          <Save className="h-5 w-5 mr-2" /> Zapisz szablon
        </Button>
      </div>
    </div>
  );
}
