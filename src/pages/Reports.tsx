import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, FileText, Search, Trash2, Calendar, Camera,
  PenTool, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";
import { getReportHistory, removeReportFromHistory, type ReportHistoryItem } from "@/lib/storage";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    setReports(getReportHistory());
    setDeleteId(null);
    if (expandedId === id) setExpandedId(null);
    toast.success("Raport usunięty z historii");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /** Get filled fields sorted for display */
  const getFilledFields = (report: ReportHistoryItem) => {
    return Object.entries(report.customFields)
      .filter(([, value]) => value?.trim())
      .map(([fieldId, value]) => ({
        label: report.fieldLabels?.[fieldId] || fieldId,
        value,
      }));
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl flex-1">Historia raportów</h1>
        <span className="text-sm text-muted-foreground">{reports.length}</span>
      </header>

      {/* Search */}
      {reports.length > 0 && (
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full h-11 rounded-lg border-2 border-border bg-card pl-10 pr-4 text-base focus:outline-none focus:border-accent transition-colors"
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
            <p className="text-sm text-muted-foreground mt-1">
              Wygenerowane raporty pojawią się tutaj
            </p>
            <Button
              variant="accent"
              className="mt-6"
              onClick={() => navigate("/select-template")}
            >
              Utwórz pierwszy raport
            </Button>
          </div>
        )}

        {filtered.length === 0 && reports.length > 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Brak wyników dla „{search}"
          </p>
        )}

        <div className="space-y-3">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id;
            const filledFields = getFilledFields(report);
            const tileLabels = report.tileLabels || [];

            return (
              <div
                key={report.id}
                className="rounded-xl border-2 border-border bg-card overflow-hidden transition-all"
              >
                {/* Collapsed header — always visible */}
                <button
                  onClick={() => toggleExpand(report.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold truncate">
                        {report.clientName !== "—" ? report.clientName : report.filename}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(report.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.date)}
                    </span>
                    <span className="font-medium text-accent">
                      {report.templateName}
                    </span>
                    {report.photosCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {report.photosCount} zdjęć
                      </span>
                    )}
                    {report.hasSignature && (
                      <span className="flex items-center gap-1">
                        <PenTool className="h-3 w-3" />
                        Podpis
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                    {/* All filled fields */}
                    {filledFields.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Dane raportu
                        </p>
                        <div className="space-y-1.5">
                          {filledFields.map(({ label, value }) => (
                            <div key={label} className="flex gap-2">
                              <span className="text-xs text-muted-foreground shrink-0 w-28 pt-0.5">{label}:</span>
                              <span className="text-sm text-foreground break-words">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected tiles */}
                    {tileLabels.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Wykonane czynności ({tileLabels.length})
                        </p>
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

                    {/* File info */}
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground font-mono">
                        {report.filename}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć raport?</AlertDialogTitle>
            <AlertDialogDescription>
              Raport zostanie usunięty z historii. Wcześniej pobrany plik PDF pozostanie na urządzeniu.
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
