import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wind, Zap, Home, FileText, ChevronRight } from "lucide-react";
import { getAllTemplates, type ReportTemplate } from "@/lib/templates";

const ICON_MAP: Record<string, React.ElementType> = {
  Wind,
  Zap,
  Home,
  FileText,
};

export default function SelectTemplate() {
  const navigate = useNavigate();
  const templates = getAllTemplates();

  const handleSelect = (template: ReportTemplate) => {
    navigate(`/report?template=${template.id}`);
  };

  // Group by category
  const categories = templates.reduce<Record<string, ReportTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl">Nowy raport</h1>
          <p className="text-sm text-muted-foreground">Wybierz szablon</p>
        </div>
      </header>

      <main className="flex-1 px-5 py-4 space-y-6">
        {Object.entries(categories).map(([category, tpls]) => (
          <div key={category}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </p>
            <div className="space-y-2">
              {tpls.map((template) => {
                const Icon = ICON_MAP[template.icon] || FileText;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full rounded-xl border-2 border-border bg-card p-4 text-left hover:shadow-md transition-all active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent shrink-0">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {template.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.fields.length > 0
                            ? `${template.fields.length} pól • ${template.tiles.length} czynności`
                            : "Własne pola z ustawień"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
