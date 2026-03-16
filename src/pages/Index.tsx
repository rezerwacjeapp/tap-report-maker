import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { getProfile, getReportHistory } from "@/lib/storage";
import { getUserTemplates, STARTER_TEMPLATES } from "@/lib/templates";

const HIDDEN_STARTERS_KEY = "raporton_hidden_starters";
const QUICK_START_KEY = "raporton_quick_start";

function getHiddenStarters(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_STARTERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function getQuickStartIds(): Set<string> {
  try {
    const raw = localStorage.getItem(QUICK_START_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

const INDUSTRY_COLORS: Record<string, string> = {
  Wind: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Zap: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Home: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Flame: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ShieldAlert: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  Droplets: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  Sun: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  Fan: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

const INDUSTRY_DOTS: Record<string, string> = {
  Wind: "bg-blue-500", Zap: "bg-amber-500", Home: "bg-purple-500",
  Flame: "bg-orange-500", ShieldAlert: "bg-red-500", Droplets: "bg-cyan-500",
  Sun: "bg-yellow-500", Fan: "bg-teal-500",
};

const INDUSTRY_EMOJI: Record<string, string> = {
  Wind: "❄️", Zap: "⚡", Home: "🏠", Flame: "🔥",
  ShieldAlert: "🧯", Droplets: "💧", Sun: "☀️", Fan: "🌀",
};

const Index = () => {
  const navigate = useNavigate();

  const profile = getProfile();
  const hasProfile = profile.fields?.some((f) => f.value?.trim());
  const reports = getReportHistory();
  const userTemplateCount = userTemplates.length;
  const recentReports = reports.slice(0, 3);

  // Quick start: pinned templates (user + starter), fallback to visible starters
  const hiddenStarters = getHiddenStarters();
  const quickStartIds = getQuickStartIds();
  const userTemplates = getUserTemplates();

  const quickStartTemplates: { id: string; name: string; icon: string }[] = [];
  if (quickStartIds.size > 0) {
    // Show pinned templates in order
    const allTemplates = [...userTemplates, ...STARTER_TEMPLATES];
    for (const t of allTemplates) {
      if (quickStartIds.has(t.id)) {
        quickStartTemplates.push({ id: t.id, name: t.name, icon: t.icon });
      }
    }
  } else {
    // Fallback: first 4 visible starters
    STARTER_TEMPLATES
      .filter((s) => !hiddenStarters.has(s.id))
      .slice(0, 4)
      .forEach((s) => quickStartTemplates.push({ id: s.id, name: s.name, icon: s.icon }));
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pl-PL", {
        day: "numeric", month: "short",
      });
    } catch { return dateStr; }
  };

  const getTemplateIcon = (templateName: string) => {
    const starter = STARTER_TEMPLATES.find((s) => s.name === templateName);
    return starter?.icon || "FileText";
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-2">
        <h1 className="text-2xl tracking-tight">
          Raport<span className="text-accent">ON</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Raport serwisowy w minutę</p>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-4 space-y-5">
        {/* Hero — New Report */}
        <button
          onClick={() => navigate("/select-template")}
          className="w-full rounded-2xl bg-gradient-to-br from-emerald-700 to-accent p-5 text-left text-white shadow-lg active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Plus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Nowy raport</h2>
              <p className="text-sm text-white/75 mt-0.5">Wybierz szablon i wypełnij dane</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60" />
          </div>
        </button>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-secondary p-3.5">
            <p className="text-xl font-semibold">{reports.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Raportów</p>
          </div>
          <div className="rounded-xl bg-secondary p-3.5">
            <p className="text-xl font-semibold">{userTemplateCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Szablonów</p>
          </div>
          <div className="rounded-xl bg-secondary p-3.5">
            <p className="text-xl font-semibold">
              {reports.length > 0 ? formatDate(reports[0].date) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ostatni</p>
          </div>
        </div>

        {/* Recent reports */}
        {recentReports.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ostatnie raporty
              </p>
              <button onClick={() => navigate("/reports")} className="text-xs text-accent font-medium">
                Wszystkie
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {recentReports.map((report, i) => {
                const icon = getTemplateIcon(report.templateName);
                const dotColor = INDUSTRY_DOTS[icon] || "bg-accent";
                return (
                  <button
                    key={report.id}
                    onClick={() => navigate("/reports")}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-secondary/50 transition-colors active:bg-secondary ${i < recentReports.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {report.clientName !== "—" ? report.clientName : report.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatDate(report.date)}</span>
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <span className="text-[11px] text-accent font-medium">{report.templateName}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick start — pinned or default starters */}
        {quickStartTemplates.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Szybki start
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {quickStartTemplates.map((tmpl) => {
                const colorCls = INDUSTRY_COLORS[tmpl.icon] || "bg-muted text-muted-foreground";
                const emoji = INDUSTRY_EMOJI[tmpl.icon] || "📄";
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => navigate(`/report?template=${tmpl.id}`)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3.5 min-w-[100px] hover:shadow-sm transition-all active:scale-[0.97]"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${colorCls}`}>
                      {emoji}
                    </div>
                    <span className="text-[11px] font-medium text-center">{tmpl.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile hint */}
        {!hasProfile && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <p className="text-sm">
              <strong>Wskazówka:</strong> Uzupełnij{" "}
              <span className="text-accent font-semibold cursor-pointer" onClick={() => navigate("/profile")}>
                profil firmy
              </span>
              , aby Twoje dane pojawiały się automatycznie w raportach.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">RaportON v1.0 • Działa offline</p>
      </footer>
    </div>
  );
};

export default Index;
