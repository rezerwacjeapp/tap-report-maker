import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, X } from "lucide-react";
import { getTiles, saveTiles, type TileItem } from "@/lib/storage";

export default function ManageTiles() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<TileItem[]>(getTiles);
  const [newLabel, setNewLabel] = useState("");

  const save = (next: TileItem[]) => {
    setTiles(next);
    saveTiles(next);
  };

  const add = () => {
    if (!newLabel.trim()) return;
    save([...tiles, { id: Date.now().toString(), label: newLabel.trim() }]);
    setNewLabel("");
  };

  const remove = (id: string) => {
    save(tiles.filter((t) => t.id !== id));
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl">Zarządzaj kafelkami</h1>
      </header>

      <main className="flex-1 px-5 space-y-4 pb-8">
        {/* Add new */}
        <div className="flex gap-2">
          <input
            className="flex-1 h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nowa czynność..."
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button variant="accent" size="icon" onClick={add} className="h-12 w-12">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className="flex items-center justify-between rounded-lg border-2 border-border bg-card px-4 py-3"
            >
              <span className="text-base font-medium">{tile.label}</span>
              <button onClick={() => remove(tile.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {tiles.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Brak kafelków. Dodaj pierwszą czynność powyżej.
          </p>
        )}
      </main>
    </div>
  );
}
