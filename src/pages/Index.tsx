import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Zap, Clock, X, LogOut, MessageCircle } from "lucide-react";
import { getProfile, getReportHistory } from "@/lib/storage";
import { getUserTemplates, fetchUserTemplates, STARTER_TEMPLATES, type ReportTemplate } from "@/lib/templates";
import { checkReportLimit, getCloudDrafts, deleteCloudDraft, type CloudDraft } from "@/lib/supabase-storage";
import { useAuth } from "@/hooks/use-auth";

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
  FileText: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const INDUSTRY_DOTS: Record<string, string> = {
  Wind: "bg-blue-500", Zap: "bg-amber-500", Home: "bg-purple-500",
  Flame: "bg-orange-500", ShieldAlert: "bg-red-500", Droplets: "bg-cyan-500",
  Sun: "bg-yellow-500", Fan: "bg-teal-500", FileText: "bg-emerald-500",
};

const INDUSTRY_EMOJI: Record<string, string> = {
  Wind: "❄️", Zap: "⚡", Home: "🏠", Flame: "🔥",
  ShieldAlert: "🧯", Droplets: "💧", Sun: "☀️", Fan: "🌀",
  FileText: "📄",
};

const Index = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const profile = getProfile();
  const hasProfile = profile.fields?.some((f) => f.value?.trim());
  const reports = getReportHistory();
  const recentReports = reports.slice(0, 3);

  const [planInfo, setPlanInfo] = useState<{ count: number; limit: number; plan: string; trial?: boolean; trialDaysLeft?: number } | null>(null);
  const [cloudDrafts, setCloudDrafts] = useState<CloudDraft[]>([]);
  const [userTemplates, setUserTemplates] = useState<ReportTemplate[]>(getUserTemplates);

  useEffect(() => {
    checkReportLimit()
      .then((info) => setPlanInfo({ count: info.count, limit: info.limit, plan: info.plan, trial: info.trial, trialDaysLeft: info.trialDaysLeft }))
      .catch(() => {});
    getCloudDrafts().then(setCloudDrafts).catch(() => {});
    fetchUserTemplates().then(setUserTemplates).catch(() => {});
  }, []);

  const handleDeleteDraft = (id: string) => {
    deleteCloudDraft(id).catch(() => {});
    setCloudDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const hiddenStarters = getHiddenStarters();
  const quickStartIds = getQuickStartIds();
  const userTemplateCount = userTemplates.length;

  const quickStartTemplates: { id: string; name: string; icon: string }[] = [];
  if (quickStartIds.size > 0) {
    const allTemplates = [...userTemplates, ...STARTER_TEMPLATES];
    for (const t of allTemplates) {
      if (quickStartIds.has(t.id)) {
        quickStartTemplates.push({ id: t.id, name: t.name, icon: t.icon });
      }
    }
  } else {
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

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "przed chwilą";
      if (mins < 60) return `${mins} min temu`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} godz. temu`;
      const days = Math.floor(hours / 24);
      if (days === 1) return "wczoraj";
      return `${days} dni temu`;
    } catch { return ""; }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">
            Raport<span className="text-accent">ON</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Raport serwisowy w minutę</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <a
            href="/kontakt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-xl px-2.5 py-2 text-muted-foreground hover:text-accent glass-card hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all"
            title="Kontakt"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-destructive glass-card hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all"
            title="Wyloguj się"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-4 space-y-5">
        {/* Hero — New Report */}
        <button
          onClick={() => navigate("/select-template")}
          className="w-full rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-left text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Plus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Nowy raport</h2>
              <p className="text-sm text-white/75 mt-0.5">Wybierz szablon i wypełnij dane</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60" />
          </div>
        </button>

        {/* Saved drafts */}
        {cloudDrafts.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Niedokończone raporty
            </p>
            <div className="rounded-2xl glass-card overflow-hidden" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
              {cloudDrafts.map((d, i) => {
                const icon = getTemplateIcon(d.templateName);
                const emoji = INDUSTRY_EMOJI[icon] || "📄";
                const timeAgo = formatRelativeTime(d.updatedAt);
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < cloudDrafts.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <button
                      onClick={() => navigate(`/report?template=${d.templateId}&draft=${d.id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-sm shrink-0">
                        {emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {d.label || d.templateName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                          {d.label && <span className="text-[11px] text-muted-foreground">• {d.templateName}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                      title="Usuń szkic"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl glass-card p-3.5">
            <p className="text-xl font-semibold">{reports.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Raportów</p>
          </div>
          <div className="rounded-2xl glass-card p-3.5">
            <p className="text-xl font-semibold">{userTemplateCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Szablonów</p>
          </div>
          <div className="rounded-2xl glass-card p-3.5">
            <p className="text-xl font-semibold">
              {reports.length > 0 ? formatDate(reports[0].date) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ostatni</p>
          </div>
        </div>

        {/* Plan limit bar */}
        {planInfo && (
          <div className="rounded-2xl glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {planInfo.plan === "solo" ? "Plan Solo" : planInfo.plan === "trial" ? "Okres próbny" : "Plan Free"}
                </span>
                {planInfo.plan === "trial" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                    {planInfo.trialDaysLeft} {planInfo.trialDaysLeft === 1 ? "dzień" : "dni"} pozostało
                  </span>
                )}
                {planInfo.plan === "free" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    {planInfo.count}/{planInfo.limit}
                  </span>
                )}
              </div>
              {(planInfo.plan === "free" || planInfo.plan === "trial") && (
                <button
                  onClick={() => navigate("/upgrade")}
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <Zap className="h-3 w-3" />
                  Przejdź na Solo
                </button>
              )}
            </div>

            {planInfo.plan === "trial" ? (
              <p className="text-[11px] text-muted-foreground">
                Bez limitu raportów przez 7 dni. Potem: 5 raportów/mc lub plan Solo bez limitu.
              </p>
            ) : planInfo.plan === "free" ? (
              <>
                <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      planInfo.count >= planInfo.limit ? "bg-destructive" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min((planInfo.count / planInfo.limit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {planInfo.count >= planInfo.limit
                    ? "Limit raportów osiągnięty. Przejdź na Solo, aby generować bez limitu."
                    : `${planInfo.limit - planInfo.count} ${planInfo.limit - planInfo.count === 1 ? "raport" : "raporty"} pozostało w tym miesiącu`
                  }
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Bez limitu raportów
              </p>
            )}
          </div>
        )}

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
            <div className="rounded-2xl glass-card overflow-hidden">
              {recentReports.map((report, i) => {
                const icon = getTemplateIcon(report.templateName);
                const dotColor = INDUSTRY_DOTS[icon] || "bg-accent";
                return (
                  <button
                    key={report.id}
                    onClick={() => navigate("/reports")}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/40 dark:hover:bg-white/5 transition-colors active:bg-white/50 ${i < recentReports.length - 1 ? "border-b border-border/50" : ""}`}
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

        {/* Quick start */}
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
                    className="flex flex-col items-center gap-2 rounded-2xl glass-card p-3.5 min-w-[100px] hover:shadow-md transition-all active:scale-[0.97]"
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
          <div className="rounded-2xl glass-card p-4" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <p className="text-sm">
              <strong>Wskazówka:</strong> Uzupełnij{" "}
              <span className="text-accent font-semibold cursor-pointer" onClick={() => navigate("/profile")}>
                profil firmy
              </span>
              , aby Twoje dane pojawiały się automatycznie w raportach.
            </p>
          </div>
        )}

        {/* Template request banner */}
        
          href="mailto:kontakt.raporton@gmail.com?subject=Prośba o szablon&body=Dzień dobry,%0A%0AChciałbym zamówić szablon do:%0A%0A(opisz rodzaj raportu lub dołącz zdjęcie/PDF dotychczasowego formularza)%0A%0APozdrawiam"
          className="block rounded-2xl glass-card p-4 hover:bg-white/60 dark:hover:bg-white/5 transition-all active:scale-[0.99]"
          style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}
        >
          <p className="text-sm">
            <strong>Potrzebujesz szablonu?</strong> Wyślij nam swój raport — przygotujemy szablon za Ciebie.{" "}
            <span className="text-accent font-semibold">Napisz →</span>
          </p>
        </a>
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">RaportON v2.0</p>
      </footer>
    </div>
  );
};

export default Index;
