import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Wind, Zap, Home, FileText, Plus,
  ChevronRight, ChevronDown, Pencil, Trash2, Copy,
} from "lucide-react";
import {
  getUserTemplates, STARTER_TEMPLATES, deleteUserTemplate, duplicateTemplate,
  type ReportTemplate,
} from "@/lib/templates";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ICON_MAP: Record<string, React.ElementType> = { Wind, Zap, Home, FileText };

export default function SelectTemplate() {
  const navigate = useNavigate();
  const [userTemplates, setUserTemplates] = useState<ReportTemplate[]>(getUserTemplates);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showStarters, setShowStarters] = useState(false);

  const handleUseTemplate = (template: ReportTemplate) => {
    navigate(`/report?template=${template.id}`);
  };

  const handleEditTemplate = (id: string) => {
    navigate(`/edit-template?id=${id}`);
  };

  const handleDuplicateStarter = (starter: ReportTemplate) => {
    navigate(`/edit-template?from=${starter.id}`);
  };

  const handleDuplicateUser = (template: ReportTemplate) => {
    const dup = duplicateTemplate(template, `${template.name} (kopia)`);
    setUserTemplates(getUserTemplates());
    toast.success(`Skopiowano jako "${dup.name}"`);
  };

  const handleDelete = (id: string) => {
    deleteUserTemplate(id);
    setUserTemplates(getUserTemplates());
    setDeleteId(null);
    toast.success("Szablon usunięty");
  };

  const handleCreateNew = () => {
    navigate("/edit-template?new=1");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl">Nowy raport</h1>
          <p className="text-sm text-muted-foreground">Wybierz lub stwórz szablon</p>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 space-y-6 pb-8">
        {/* === USER TEMPLATES === */}
        {userTemplates.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Twoje szablony
            </p>
            <div className="space-y-2">
              {userTemplates.map((template) => {
                const Icon = ICON_MAP[template.icon] || FileText;
                return (
                  <div
                    key={template.id}
                    className="rounded-xl border-2 border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full p-4 text-left hover:bg-muted/30 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {template.fields.length} pól • {template.tiles.length} czynności
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>

                    {/* Action bar */}
                    <div className="flex border-t border-border">
                      <button
                        onClick={() => handleEditTemplate(template.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-accent transition-colors border-r border-border"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edytuj
                      </button>
                      <button
                        onClick={() => handleDuplicateUser(template)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-accent transition-colors border-r border-border"
                      >
                        <Copy className="h-3.5 w-3.5" /> Kopiuj
                      </button>
                      <button
                        onClick={() => setDeleteId(template.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Usuń
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === CREATE NEW === */}
        <button
          onClick={handleCreateNew}
          className="w-full rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-5 text-left hover:bg-accent/10 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Stwórz własny szablon</h3>
              <p className="text-sm text-muted-foreground">Wybierz klocki i zbuduj od zera</p>
            </div>
          </div>
        </button>

        {/* === STARTER TEMPLATES — collapsible === */}
        <div>
          <button
            onClick={() => setShowStarters(!showStarters)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gotowe szablony branżowe
            </p>
            {showStarters
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </button>
          {showStarters && (
          <div className="space-y-2">
            {STARTER_TEMPLATES.map((starter) => {
              const Icon = ICON_MAP[starter.icon] || FileText;
              return (
                <div
                  key={starter.id}
                  className="rounded-xl border-2 border-border bg-card overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold">{starter.name}</h3>
                        <p className="text-xs text-muted-foreground">{starter.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {starter.fields.length} pól • {starter.tiles.length} czynności
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex border-t border-border">
                    <button
                      onClick={() => handleUseTemplate(starter)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-r border-border"
                    >
                      Użyj bez zmian
                    </button>
                    <button
                      onClick={() => handleDuplicateStarter(starter)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Kopiuj i dostosuj
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
