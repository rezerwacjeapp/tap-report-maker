import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText, Search, Trash2, Calendar, Camera,
  PenTool, ChevronDown, ChevronUp, CheckCircle2, FileDown, Loader2, CopyPlus,
} from "lucide-react";
import { type ReportHistoryItem } from "@/lib/storage";
// PDF engine (pdfmake + fonts) loads on demand, warmed up when the history opens
const loadPdf = () => import("@/lib/pdf-generator");
import { ReportReadySheet } from "@/components/ReportReadySheet";
import { parseTable, tableColumns, filledRows, tableSearchText, type TableValue } from "@/lib/table-field";
import { prepareReuse } from "@/lib/reuse-report";
import {
  getCloudReportHistory, removeCloudReport, deleteCloudSnapshot,
  getCloudSnapshot, getCloudProfile, checkReportLimit, getCloudReportSignatures,
} from "@/lib/supabase-storage";
import { downloadSnapshotImages, deleteReportImages } from "@/lib/image-storage";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ready, setReady] = useState<{ blob: Blob; filename: string; subtitle: string } | null>(null);

  useEffect(() => {
    getCloudReportHistory()
      .then(setReports)
      .catch(() => toast.error("Nie udało się załadować historii"))
      .finally(() => setLoading(false));
    loadPdf().catch(() => {});
  }, []);

  // The list comes without signature images — fetch them only for the report being opened
  const [signaturesById, setSignaturesById] = useState<Record<string, Record<string, string | null>>>({});
  useEffect(() => {
    if (!expandedId || signaturesById[expandedId]) return;
    const id = expandedId;
    getCloudReportSignatures(id)
      .then((sigs) => setSignaturesById((prev) => ({ ...prev, [id]: sigs })))
      .catch(() => {});
  }, [expandedId, signaturesById]);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.clientName.toLowerCase().includes(q) ||
      r.filename.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.templateName.toLowerCase().includes(q) ||
      Object.values(r.customFields).some((v) => typeof v === "string" && tableSearchText(v).toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string) => {
    await removeCloudReport(id).catch(() => {});
    deleteCloudSnapshot(id).catch(() => {});
    if (user) deleteReportImages(user.id, id).catch(() => {});
    setReports((prev) => prev.filter((r) => r.id !== id));
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
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([fieldId, value]) => {
        const tv = parseTable(value);
        return {
          label: report.fieldLabels?.[fieldId] || fieldId,
          value,
          table: tv && filledRows(tv).length ? tv : (null as TableValue | null),
        };
      })
      .filter((f) => !parseTable(f.value) || f.table);
  };

  /** Rebuild the PDF (from the saved snapshot when available) and open the send/download sheet. */
  const openPdf = async (report: ReportHistoryItem) => {
    if (busyId) return;
    setBusyId(report.id);
    try {
      const limit = await checkReportLimit();
      const watermark = limit.plan === "free";
      const { generateReportFile, historyTemplateOptions } = await loadPdf();
      const snapshot = await getCloudSnapshot(report.id);
      let result: { blob: Blob; meta: { filename: string } };
      if (snapshot) {
        const restored = await downloadSnapshotImages(snapshot);
        result = await generateReportFile(restored.profile, restored.draft, { ...restored.options, watermark });
      } else {
        const [profile, signatures] = await Promise.all([
          getCloudProfile(),
          signaturesById[report.id] ? Promise.resolve(signaturesById[report.id]) : getCloudReportSignatures(report.id),
        ]);
        const { draft, options } = historyTemplateOptions({ ...report, signatures }, watermark);
        result = await generateReportFile(profile, draft, options);
        toast("Ten raport nie ma zapisanej kopii zdjęć i podpisów - PDF odtworzony z samych danych.");
      }
      setReady({
        blob: result.blob,
        filename: report.filename || result.meta.filename,
        subtitle: [report.clientName !== "—" ? report.clientName : "", report.templateName].filter(Boolean).join(" • "),
      });
    } catch {
      toast.error("Nie udało się przygotować PDF");
    } finally {
      setBusyId(null);
    }
  };

  /** "Nowy na podstawie" — next inspection for the same client/device. */
  const startFrom = async (report: ReportHistoryItem) => {
    if (busyId) return;
    setBusyId(report.id);
    try {
      const url = await prepareReuse(report);
      if (url) navigate(url);
      else toast.error("Szablon tego raportu już nie istnieje - nie da się skopiować danych.");
    } catch {
      toast.error("Nie udało się wczytać raportu");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
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
          <div className="flex items-center gap-2 glass-card rounded-xl px-3.5 h-11">
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
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        )}

        {!loading && filtered.length === 0 && reports.length === 0 && (
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
              <div key={report.id} className="rounded-2xl glass-card overflow-hidden transition-all">
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
                          typeof report.signedCount === "number" ? (
                            <span className="flex items-center gap-1">
                              <PenTool className="h-3 w-3" />
                              {report.signedCount}/{Object.keys(report.signatureLabels).length} podp.
                            </span>
                          ) : null
                        ) : report.signedCount ? (
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
                          {filledFields.map(({ label, value, table }) => table ? (
                            <div key={label} className="space-y-1">
                              <span className="text-[11px] text-muted-foreground">{label}:</span>
                              <div className="overflow-x-auto rounded-lg border border-border">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/60">
                                    <tr>{tableColumns(undefined, table).map((c) => <th key={c.id} className="px-2 py-1 text-left font-medium whitespace-nowrap">{c.label}</th>)}</tr>
                                  </thead>
                                  <tbody>
                                    {filledRows(table).map((row, i) => (
                                      <tr key={i} className="border-t border-border">
                                        {tableColumns(undefined, table).map((c) => <td key={c.id} className="px-2 py-1 whitespace-nowrap">{row[c.id] || ""}</td>)}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
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
                            const sigData = signaturesById[report.id]?.[sigId];
                            return (
                              <div key={sigId} className="flex flex-col items-start gap-1">
                                <span className="text-[11px] text-muted-foreground">{sigLabel || "Podpis"}</span>
                                {sigData ? (
                                  <img src={sigData} alt={sigLabel || "Podpis"} className="h-14 w-auto border border-border rounded bg-white" />
                                ) : (
                                  <div className="h-14 w-32 border border-border rounded bg-white" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : Object.values(signaturesById[report.id] || {}).some((v) => !!v) ? (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Podpisy</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(signaturesById[report.id] || {}).filter(([, v]) => !!v).map(([sigId, sigData]) => (
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

                    <p className="pt-1 text-[11px] text-muted-foreground truncate">{report.filename}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === report.id}
                        onClick={(e) => { e.stopPropagation(); startFrom(report); }}
                        title="Kolejny przegląd u tego klienta - dane klienta i urządzenia będą już wpisane"
                      >
                        <CopyPlus className="h-3.5 w-3.5 mr-1.5" /> Nowy na podstawie
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={busyId === report.id}
                        onClick={(e) => { e.stopPropagation(); openPdf(report); }}
                        className="ml-auto"
                      >
                        {busyId === report.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 mr-1.5" />} PDF
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

      <ReportReadySheet
        open={!!ready}
        blob={ready?.blob ?? null}
        filename={ready?.filename ?? ""}
        subtitle={ready?.subtitle}
        closeLabel="Zamknij"
        onClose={() => setReady(null)}
      />
    </div>
  );
}
