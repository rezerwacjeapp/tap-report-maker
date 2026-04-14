import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, ChevronRight, ChevronDown, Pencil, Trash2, Copy, FileText, EyeOff, RotateCcw, Star, Share2,
} from "lucide-react";
import {
  getUserTemplates, fetchUserTemplates, STARTER_TEMPLATES, deleteUserTemplate, duplicateTemplate,
  countTileOptions,
  type ReportTemplate,
} from "@/lib/templates";
import { toast } from "sonner";
import { shareTemplate } from "@/lib/supabase-storage";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BADGE_COLORS: Record<string, string> = {
  Wind: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Zap: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Home: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Flame: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ShieldAlert: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Droplets: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  Sun: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  Fan: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

const BADGE_LABELS: Record<string, string> = {
  Wind: "HVAC", Zap: "SEP", Home: "NIERUCH.", Flame: "GAZ",
  ShieldAlert: "PPOŻ", Droplets: "HYDR.", Sun: "PV", Fan: "WENT.",
};

const INDUSTRY_EMOJI: Record<string, string> = {
  Wind: "❄️", Zap: "⚡", Home: "🏠", Flame: "🔥",
  ShieldAlert: "🧯", Droplets: "💧", Sun: "☀️", Fan: "🌀",
};

const HIDDEN_STARTERS_KEY = "raporton_hidden_starters";

function getHiddenStarters(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_STARTERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveHiddenStarters(ids: Set<string>) {
  localStorage.setItem(HIDDEN_STARTERS_KEY, JSON.stringify([...ids]));
}

const QUICK_START_KEY = "raporton_quick_start";

function getQuickStartIds(): Set<string> {
  try {
    const raw = localStorage.getItem(QUICK_START_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveQuickStartIds(ids: Set<string>) {
  localStorage.setItem(QUICK_START_KEY, JSON.stringify([...ids]));
}

export default function SelectTemplate() {
  const navigate = useNavigate();
  const [userTemplates, setUserTemplates] = useState<ReportTemplate[]>(getUserTemplates);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserTemplates().then(setUserTemplates).catch(() => {});
  }, []);
  const [showStarters, setShowStarters] = useState(true);
  const [hiddenStarters, setHiddenStarters] = useState<Set<string>>(getHiddenStarters);
  const [quickStartIds, setQuickStartIds] = useState<Set<string>>(getQuickStartIds);

  const visibleStarters = STARTER_TEMPLATES.filter((s) => !hiddenStarters.has(s.id));
  const hiddenCount = STARTER_TEMPLATES.length - visibleStarters.length;

  const toggleQuickStart = (id: string) => {
    const next = new Set(quickStartIds);
    if (next.has(id)) {
      next.delete(id);
      toast.success("Usunięto z szybkiego startu");
    } else {
      next.add(id);
      toast.success("Dodano do szybkiego startu");
    }
    setQuickStartIds(next);
    saveQuickStartIds(next);
  };

  const hideStarter = (id: string) => {
    const next = new Set(hiddenStarters);
    next.add(id);
    setHiddenStarters(next);
    saveHiddenStarters(next);
    toast.success("Szablon ukryty");
  };

  const restoreAllStarters = () => {
    setHiddenStarters(new Set());
    saveHiddenStarters(new Set());
    toast.success("Przywrócono wszystkie szablony");
  };

  const handleUseTemplate = (template: ReportTemplate) => {
    navigate(`/report?template=${template.id}`);
  };

  const handleEditTemplate = (id: string) => {
    navigate(`/edit-template?id=${id}`);
  };

  const handleDuplicateStarter = (starter: ReportTemplate) => {
    navigate(`/edit-template?from=${starter.id}`);
  };

  const handleDuplicateUser = async (template: ReportTemplate) => {
    const dup = await duplicateTemplate(template, `${template.name} (kopia)`);
    setUserTemplates(getUserTemplates());
    toast.success(`Skopiowano jako "${dup.name}"`);
  };

  const handleDelete = async (id: string) => {
    await deleteUserTemplate(id);
    setUserTemplates(getUserTemplates());
    setDeleteId(null);
    toast.success("Szablon usunięty");
  };

  const handleCreateNew = () => {
    navigate("/edit-template?new=1");
  };

  const handleShare = async (template: ReportTemplate) => {
    try {
      const code = await shareTemplate(template);
      const url = `${window.location.origin}/t/${code}`;
      if (navigator.share) {
        await navigator.share({ title: template.name, text: `Szablon: ${template.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link skopiowany do schowka");
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Nie udało się udostępnić");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-8 pb-2">
        <h1 className="text-xl">Nowy raport</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Wybierz lub stwórz szablon</p>
      </header>

      <main className="flex-1 px-5 py-4 space-y-5 pb-8">
        {/* Create new */}
        <button
          onClick={handleCreateNew}
          className="w-full rounded-2xl border border-dashed border-accent/40 glass-card p-4 text-left hover:bg-white/60 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Stwórz własny szablon</h3>
              <p className="text-xs text-muted-foreground">Wybierz klocki i zbuduj od zera</p>
            </div>
          </div>
        <button
          onClick={handleCreateNew}
          className="w-full rounded-2xl border border-dashed border-accent/40 glass-card p-4 text-left hover:bg-white/60 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Stwórz własny szablon</h3>
              <p className="text-xs text-muted-foreground">Wybierz klocki i zbuduj od zera</p>
            </div>
          </div>
        </button>

        {/* Template request banner */}
        
          href="mailto:kontakt.raporton@gmail.com?subject=Prośba o szablon&body=Dzień dobry,%0A%0AChciałbym zamówić szablon do:%0A%0A(opisz rodzaj raportu lub dołącz zdjęcie/PDF dotychczasowego formularza)%0A%0APozdrawiam"
          className="block rounded-2xl glass-card p-4 hover:bg-white/60 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
          style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}
        >
          <p className="text-sm">
            <strong>Nie chcesz budować sam?</strong> Wyślij nam zdjęcie lub PDF swojego dotychczasowego raportu — przygotujemy gotowy szablon.{" "}
            <span className="text-accent font-semibold">Napisz →</span>
          </p>
        </a>

        {/* User templates */}
        {userTemplates.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Twoje szablony
            </p>
            <div className="rounded-2xl glass-card overflow-hidden divide-y divide-border/50">
              {userTemplates.map((template) => {
                const emoji = INDUSTRY_EMOJI[template.icon] || "📄";
                const badgeColor = BADGE_COLORS[template.icon] || "bg-muted text-muted-foreground";
                return (
                  <div key={template.id}>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full p-3.5 text-left hover:bg-secondary/50 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${badgeColor}`}>
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{template.name}</h3>
                          <p className="text-[11px] text-muted-foreground">
                            {template.fields.filter(f => !["tiles","photos","signature"].includes(f.type)).length} pól • {countTileOptions(template)} czynności
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                    <div className="flex border-t border-border">
                      <button onClick={() => toggleQuickStart(template.id)} className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] transition-colors border-r border-border ${quickStartIds.has(template.id) ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}>
                        <Star className="h-3.5 w-3.5" fill={quickStartIds.has(template.id) ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => handleEditTemplate(template.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground hover:text-accent transition-colors border-r border-border">
                        <Pencil className="h-3.5 w-3.5" /> Edytuj
                      </button>
                      <button onClick={() => handleDuplicateUser(template)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground hover:text-accent transition-colors border-r border-border">
                        <Copy className="h-3.5 w-3.5" /> Kopiuj
                      </button>
                      <button onClick={() => handleShare(template)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground hover:text-accent transition-colors border-r border-border">
                        <Share2 className="h-3.5 w-3.5" /> Udostępnij
                      </button>
                      <button onClick={() => setDeleteId(template.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Usuń
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Starter templates */}
        <div>
          <button
            onClick={() => setShowStarters(!showStarters)}
            className="w-full flex items-center justify-between py-2"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Gotowe szablony branżowe
              {hiddenCount > 0 && <span className="ml-1 opacity-60">({visibleStarters.length}/{STARTER_TEMPLATES.length})</span>}
            </p>
            {showStarters
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </button>
          {showStarters && (
            <>
              {visibleStarters.length > 0 ? (
                <div className="rounded-2xl glass-card overflow-hidden divide-y divide-border/50 mt-1">
                  {visibleStarters.map((starter) => {
                    const emoji = INDUSTRY_EMOJI[starter.icon] || "📄";
                    const badgeColor = BADGE_COLORS[starter.icon] || "bg-muted text-muted-foreground";
                    const badgeLabel = BADGE_LABELS[starter.icon] || "";
                    return (
                      <div key={starter.id}>
                        <div className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${badgeColor}`}>
                              {emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium">{starter.name}</h3>
                              <p className="text-[11px] text-muted-foreground">{starter.description}</p>
                            </div>
                            {badgeLabel && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex border-t border-border">
                          <button onClick={() => toggleQuickStart(starter.id)} className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] transition-colors border-r border-border ${quickStartIds.has(starter.id) ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}>
                            <Star className="h-3.5 w-3.5" fill={quickStartIds.has(starter.id) ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => handleUseTemplate(starter)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors border-r border-border">
                            Użyj bez zmian
                          </button>
                          <button onClick={() => handleDuplicateStarter(starter)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors border-r border-border">
                            <Pencil className="h-3.5 w-3.5" /> Kopiuj i dostosuj
                          </button>
                          <button onClick={() => hideStarter(starter.id)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors">
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 mt-1">Wszystkie szablony ukryte</p>
              )}

              {hiddenCount > 0 && (
                <button
                  onClick={restoreAllStarters}
                  className="w-full flex items-center justify-center gap-1.5 mt-2.5 py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-xl border border-border bg-card"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Przywróć ukryte szablony ({hiddenCount})
                </button>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć szablon?</AlertDialogTitle>
            <AlertDialogDescription>
              Szablon zostanie usunięty na stałe. Wygenerowane wcześniej raporty pozostaną w historii.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
