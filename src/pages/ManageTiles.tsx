import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X, Bookmark, GripVertical } from "lucide-react";
import {
  getTiles, saveTiles, type TileItem,
  getCustomFields, saveCustomFields, type CustomFieldDef, type CustomFieldType,
} from "@/lib/storage";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: "Tekst krótki",
  textarea: "Tekst długi",
  date: "Data",
  number: "Liczba",
};

export default function ManageTiles() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<TileItem[]>(getTiles);
  const [newLabel, setNewLabel] = useState("");
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(getCustomFields);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>("text");
  const [tab, setTab] = useState<"tiles" | "fields">("tiles");

  // Drag state
  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const saveTilesState = (next: TileItem[]) => {
    setTiles(next);
    saveTiles(next);
  };

  const addTile = () => {
    if (!newLabel.trim()) return;
    saveTilesState([...tiles, { id: Date.now().toString(), label: newLabel.trim() }]);
    setNewLabel("");
  };

  const removeTile = (id: string) => saveTilesState(tiles.filter((t) => t.id !== id));

  const saveFieldsState = (next: CustomFieldDef[]) => {
    setCustomFields(next);
    saveCustomFields(next);
  };

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    saveFieldsState([
      ...customFields,
      { id: Date.now().toString(), label: newFieldLabel.trim(), type: newFieldType, remember: false, order: customFields.length },
    ]);
    setNewFieldLabel("");
  };

  const removeField = (id: string) => saveFieldsState(customFields.filter((f) => f.id !== id));

  const toggleRemember = (id: string) => {
    saveFieldsState(customFields.map((f) => f.id === id ? { ...f, remember: !f.remember } : f));
  };

  // Drag handlers for tiles
  const handleTileDragStart = (index: number) => { dragItemRef.current = index; };
  const handleTileDragEnter = (index: number) => { dragOverRef.current = index; };
  const handleTileDragEnd = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const items = [...tiles];
    const [dragged] = items.splice(dragItemRef.current, 1);
    items.splice(dragOverRef.current, 0, dragged);
    dragItemRef.current = null;
    dragOverRef.current = null;
    saveTilesState(items);
  };

  // Drag handlers for fields
  const handleFieldDragStart = (index: number) => { dragItemRef.current = index; };
  const handleFieldDragEnter = (index: number) => { dragOverRef.current = index; };
  const handleFieldDragEnd = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const items = [...customFields];
    const [dragged] = items.splice(dragItemRef.current, 1);
    items.splice(dragOverRef.current, 0, dragged);
    dragItemRef.current = null;
    dragOverRef.current = null;
    saveFieldsState(items);
  };

  // Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

  const handleTouchStart = (index: number) => {
    setTouchDragIndex(index);
    dragItemRef.current = index;
  };

  const handleTouchMoveList = (e: React.TouchEvent, listType: "tiles" | "fields") => {
    if (dragItemRef.current === null) return;
    const touch = e.touches[0];
    const elements = document.querySelectorAll(`[data-drag-${listType}]`);
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        dragOverRef.current = i;
      }
    });
  };

  const handleTouchEnd = (listType: "tiles" | "fields") => {
    setTouchDragIndex(null);
    if (listType === "tiles") handleTileDragEnd();
    else handleFieldDragEnd();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl">Ustawienia raportu</h1>
      </header>

      {/* Tab switcher */}
      <div className="px-5 flex gap-2 mb-4">
        <Button
          variant={tab === "tiles" ? "accent" : "outline"}
          size="sm"
          onClick={() => setTab("tiles")}
          className="flex-1"
        >
          Czynności
        </Button>
        <Button
          variant={tab === "fields" ? "accent" : "outline"}
          size="sm"
          onClick={() => setTab("fields")}
          className="flex-1"
        >
          Pola raportu
        </Button>
      </div>

      <main className="flex-1 px-5 space-y-4 pb-8">
        {tab === "tiles" && (
          <>
            <div className="flex gap-2">
              <input
                className="flex-1 h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nowa czynność..."
                onKeyDown={(e) => e.key === "Enter" && addTile()}
              />
              <Button variant="accent" size="icon" onClick={addTile} className="h-12 w-12">
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">Przeciągnij aby zmienić kolejność</p>

            <div
              className="space-y-2"
              onTouchMove={(e) => handleTouchMoveList(e, "tiles")}
              onTouchEnd={() => handleTouchEnd("tiles")}
            >
              {tiles.map((tile, index) => (
                <div
                  key={tile.id}
                  data-drag-tiles
                  draggable
                  onDragStart={() => handleTileDragStart(index)}
                  onDragEnter={() => handleTileDragEnter(index)}
                  onDragEnd={handleTileDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onTouchStart={() => handleTouchStart(index)}
                  className={`flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 cursor-grab active:cursor-grabbing transition-all ${
                    touchDragIndex === index ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-base font-medium flex-1">{tile.label}</span>
                  <button onClick={() => removeTile(tile.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {tiles.length === 0 && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Brak czynności. Dodaj własne lub użyj gotowych szablonów branżowych.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Przykłady: Przegląd szczelności, Wymiana filtrów, Czyszczenie jednostki, Kontrola ciśnienia, Pomiar temperatury
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "fields" && (
          <>
            <p className="text-sm text-muted-foreground">
              Zdefiniuj pola, które pojawią się w formularzu i PDF (np. Nazwa klienta, NIP, Adres, Data, Uwagi).
            </p>

            <div className="space-y-2">
              <input
                className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Nazwa pola (np. Nr seryjny)"
                onKeyDown={(e) => e.key === "Enter" && addField()}
              />
              <div className="flex gap-2">
                <select
                  className="flex-1 h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                >
                  {Object.entries(FIELD_TYPE_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
                <Button variant="accent" size="icon" onClick={addField} className="h-12 w-12">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">Przeciągnij aby zmienić kolejność</p>

            <div
              className="space-y-2"
              onTouchMove={(e) => handleTouchMoveList(e, "fields")}
              onTouchEnd={() => handleTouchEnd("fields")}
            >
              {customFields.map((field, index) => (
                <div
                  key={field.id}
                  data-drag-fields
                  draggable
                  onDragStart={() => handleFieldDragStart(index)}
                  onDragEnter={() => handleFieldDragEnter(index)}
                  onDragEnd={handleFieldDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onTouchStart={() => handleTouchStart(index)}
                  className={`flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 cursor-grab active:cursor-grabbing transition-all ${
                    touchDragIndex === index ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-medium block truncate">{field.label}</span>
                    <span className="text-xs text-muted-foreground">{FIELD_TYPE_LABELS[field.type]}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleRemember(field.id)}
                      className={`transition-colors ${field.remember ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                      title="Zapamiętaj na stałe"
                    >
                      <Bookmark className="h-5 w-5" fill={field.remember ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              {customFields.length === 0 && (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Brak pól. Te pola dotyczą tylko szablonu „Raport serwisowy" (własny).
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Przykłady: Nazwa klienta, Adres obiektu, NIP, Data, Nr seryjny, Uwagi
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
