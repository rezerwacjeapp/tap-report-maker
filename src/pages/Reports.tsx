import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, Search, Trash2, Calendar, Camera,
  PenTool, ChevronDown, ChevronUp, CheckCircle2, FileDown,
} from "lucide-react";
import { getReportHistory, removeReportFromHistory, getProfile, type ReportHistoryItem } from "@/lib/storage";
import { generateReport, regenerateFromHistory } from "@/lib/pdf-generator";
import { getSnapshot, deleteSnapshot } from "@/lib/pdf-store";
import { STARTER_TEMPLATES } from "@/lib/templates";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const INDUSTRY_DOTS: Record<string, string> = {
  Wind: "bg-blue-500", Zap: "bg-amber-500", Home: "bg-purple-500",
  Flame: "bg-orange-500", ShieldAlert: "bg-red-500", Droplets: "bg-cyan-500",
  Sun: "bg-yellow-500", Fan: "bg-teal-500",
};

const BADGE_COLORS: Record<string, string> = {
  Wind: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Zap: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Home: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Flame: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ShieldAlert: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const BADGE_LABELS: Record<string, string> = {
  Wind: "HVAC", Zap: "SEP", Home: "NIERUCH.", Flame: "GAZ", ShieldAlert: "PPOŻ",
};

function getTemplateIcon(templateName: string) {
  const s = STARTER_TEMPLATES.find((st) => st.name === templateName);
  return s?.icon || "FileText";
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportHistoryItem[]>(getReportHistory);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.clientName.toLowerCase().includes(q) ||
      r.filename.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.templateName.toLowerCase().includes(q) ||
      Object.values(r.customFields).some((v) => v.toLowerCase().includes(q))
    );
  });

  const handleDelete = (id: string) => {
    removeReportFromHistory(id);
    deleteSnapshot(id).catch(() => {});
    setReports(getReportHistory());
    setDeleteId(null);
    if (expandedId === id) setExpandedId(null);
    toast.success("Raport usunięty z historii");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pl-PL", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getFilledFields = (report: ReportHistoryItem) => {
    return Object.entries(report.customFields)
      .filter(([, value]) => value?.trim())
      .map(([fieldId, value]) => ({
        label: report.fieldLabels?.[fieldId] || fieldId,
        value,
      }));
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="px-5 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl">Historia raportów</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{reports.length} raportów</p>
          </div>
        </div>
      </header>

      {/* Search */}
      {reports.length > 0 && (
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 bg-secondary rounded-xl px-3.5 h-11 border border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm focus:outline-none"
              placeholder="Szukaj po kliencie, dacie, szablonie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <main className="flex-1 px-5 pb-8">
        {filtered.length === 0 && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">Brak raportów</p>
            <p className="text-sm text-muted-foreground mt-1">Wygenerowane raporty pojawią się tutaj</p>
            <button
              onClick={() => navigate("/select-template")}
              className="mt-6 h-10 px-5 rounded-xl bg-accent text-white text-sm font-medium active:scale-[0.98] transition-transform"
            >
              Utwórz pierwszy raport
            </button>
          </div>
        )}

        {filtered.length === 0 && reports.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Brak wyników dla „{search}"</p>
        )}

        <div className="space-y-2">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            const filledFields = getFilledFields(report);
            const tileLabels = report.tileLabels || [];
            const icon = getTemplateIcon(report.templateName);
            const dotColor = INDUSTRY_DOTS[icon] || "bg-accent";
            const badgeColor = BADGE_COLORS[icon] || "bg-muted text-muted-foreground";
            const badgeLabel = BADGE_LABELS[icon] || "";

            return (
              <div key={report.id} className="rounded-2xl border border-border bg-card overflow-hidden transition-all">
                <button onClick={() => toggleExpand(report.id)} className="w-full p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">
                        {report.clientName !== "—" ? report.clientName : report.filename}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{formatDate(report.date)}
                        </span>
                        {report.reportNumber && <span className="font-mono">{report.reportNumber}</span>}
                        {badgeLabel && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        )}
                        {!badgeLabel && <span className="text-accent font-medium">{report.templateName}</span>}
                        {report.photosCount > 0 && (
                          <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{report.photosCount}</span>
                        )}
                        {report.signatureLabels && Object.keys(report.signatureLabels).length > 0 ? (
                          <span className="flex items-center gap-1">
                            <PenTool className="h-3 w-3" />
                            {Object.values(report.signatures || {}).filter(Boolean).length}/{Object.keys(report.signatureLabels).length} podp.
                          </span>
                        ) : (report.hasSignature || (report.signatures && Object.values(report.signatures).some(Boolean))) ? (
                          <span className="flex items-center gap-1"><PenTool className="h-3 w-3" />Podpis</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(report.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                    {filledFields.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dane raportu</p>
                        <div className="space-y-1.5">
                          {filledFields.map(({ label, value }) => (
                            <div key={label} className="flex gap-2">
                              <span className="text-[11px] text-muted-foreground shrink-0 w-28 pt-0.5">{label}:</span>
                              <span className="text-sm break-words">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {tileLabels.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Wykonane czynności ({tileLabels.length})</p>
                        <div className="space-y-1">
                          {tileLabels.map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                              <span className="text-sm">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.signatureLabels && Object.keys(report.signatureLabels).length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Podpisy</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(report.signatureLabels).map(([sigId, sigLabel]) => {
                            const sigData = report.signatures?.[sigId];
                            return (
                              <div key={sigId} className="flex flex-col items-start gap-1">
                                <span className="text-[11px] text-muted-foreground">{sigLabel || "Podpis"}</span>
                                {sigData ? (
                                  <img src={sigData} alt={sigLabel || "Podpis"} className="h-14 w-auto border border-border rounded bg-white" />
                                ) : (
                                  <div className="h-14 w-32 border border-dashed border-border rounded bg-muted/30 flex items-center justify-center">
                                    <span className="text-[10px] text-muted-foreground">Nie podpisano</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : report.signatures && Object.entries(report.signatures).some(([, v]) => !!v) ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Podpisy</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(report.signatures).filter(([, v]) => !!v).map(([sigId, sigData]) => (
                            <div key={sigId} className="flex flex-col items-start gap-1">
                              <span className="text-[11px] text-muted-foreground">Podpis</span>
                              <img src={sigData!} alt="Podpis" className="h-14 w-auto border border-border rounded bg-white" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {report.photosCount > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Zdjęcia</p>
                        <p className="text-xs text-muted-foreground">{report.photosCount} {report.photosCount === 1 ? "zdjęcie zapisane" : "zdjęć zapisanych"} w PDF</p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-muted-foreground font-mono truncate flex-1">{report.filename}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const snapshot = await getSnapshot(report.id);
                            if (snapshot) {
                              generateReport(snapshot.profile, snapshot.draft, snapshot.options);
                              toast.success("PDF pobrany!");
                            } else {
                              const profile = getProfile();
                              regenerateFromHistory(profile, report);
                              toast.success("PDF wygenerowany ponownie (bez zdjęć/podpisów)");
                            }
                          } catch {
                            toast.error("Nie udało się pobrać PDF");
                          }
                        }}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1.5" /> Pobierz PDF
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć raport?</AlertDialogTitle>
            <AlertDialogDescription>Raport zostanie usunięty z historii. Wcześniej pobrany plik PDF pozostanie na urządzeniu.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
