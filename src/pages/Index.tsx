import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, User, Settings, ClipboardList, LayoutTemplate } from "lucide-react";
import { getProfile, getReportHistory } from "@/lib/storage";
import { getUserTemplates } from "@/lib/templates";

const Index = () => {
  const navigate = useNavigate();
  const profile = getProfile();
  const hasProfile = profile.fields?.some((f) => f.value?.trim());
  const reportCount = getReportHistory().length;
  const userTemplateCount = getUserTemplates().length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-3xl tracking-tight">
          Doc<span className="text-accent">Swift</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Generator raportów serwisowych</p>
      </header>

      {/* Main actions */}
      <main className="flex-1 px-5 py-4 space-y-4">
        {/* New report - hero tile */}
        <button
          onClick={() => navigate("/select-template")}
          className="w-full rounded-xl border-2 border-border bg-card p-6 text-left shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl">Nowy raport</h2>
              <p className="text-sm text-muted-foreground">Utwórz raport serwisowy</p>
            </div>
          </div>
        </button>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/reports")}
            className="rounded-xl border-2 border-border bg-card p-5 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <ClipboardList className="h-6 w-6 text-muted-foreground mb-2" />
            <h3 className="text-sm font-semibold">Historia</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {reportCount > 0 ? `${reportCount} raportów` : "Brak raportów"}
            </p>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="rounded-xl border-2 border-border bg-card p-5 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <User className="h-6 w-6 text-muted-foreground mb-2" />
            <h3 className="text-sm font-semibold">Profil firmy</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasProfile ? "Skonfigurowany ✓" : "Ustaw dane"}
            </p>
          </button>

          <button
            onClick={() => navigate("/select-template")}
            className="rounded-xl border-2 border-border bg-card p-5 text-left hover:shadow-md transition-all active:scale-[0.98] col-span-2"
          >
            <LayoutTemplate className="h-6 w-6 text-muted-foreground mb-2" />
            <h3 className="text-sm font-semibold">Szablony raportów</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {userTemplateCount > 0 ? `${userTemplateCount} własnych + 3 branżowe` : "3 branżowe • stwórz własny"}
            </p>
          </button>
        </div>

        {!hasProfile && (
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
            <p className="text-sm text-foreground">
              <strong>Wskazówka:</strong> Uzupełnij <span className="text-accent font-semibold cursor-pointer" onClick={() => navigate("/profile")}>profil firmy</span>, aby Twoje dane pojawiały się automatycznie w raportach.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">DocSwift v1.0 • Działa offline</p>
      </footer>
    </div>
  );
};

export default Index;
