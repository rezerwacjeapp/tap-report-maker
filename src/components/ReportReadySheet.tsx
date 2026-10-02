import { useEffect, useMemo, useState } from "react";
import { Download, Send, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  blob: Blob | null;
  filename: string;
  /** e.g. "Hotel Pod Jaworem • Przegląd klimatyzacji" */
  subtitle?: string;
  closeLabel?: string;
  onClose: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Shown right after a PDF is built. Sharing a file needs a fresh tap
 * (browsers require user activation), which is why the PDF is generated
 * first and "Wyślij" is a separate button here.
 */
export function ReportReadySheet({ open, blob, filename, subtitle, closeLabel = "Gotowe", onClose }: Props) {
  const file = useMemo(() => (blob ? new File([blob], filename, { type: "application/pdf" }) : null), [blob, filename]);
  const [sharing, setSharing] = useState(false);

  const canShare = useMemo(() => {
    try {
      return !!file && typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !blob || !file) return null;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await navigator.share({ files: [file], title: filename.replace(/\.pdf$/i, "") });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Telefon nie pozwolił udostępnić pliku - pobierz PDF i wyślij go ręcznie.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    downloadBlob(blob, filename);
    toast.success("PDF pobrany");
  };

  const sizeKb = Math.max(1, Math.round(blob.size / 1024));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="rr-title">
      <div className="rr-backdrop absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="rr-panel relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted" aria-label="Zamknij">
          <X className="h-5 w-5" />
        </button>

        {/* The document coming out of the "printer" */}
        <div className="flex justify-center pt-2 pb-4" aria-hidden="true">
          <div className="rr-slot relative w-28 h-[9.5rem] overflow-hidden">
            <div className="rr-paper absolute inset-x-1 top-0 bottom-1 rounded-md bg-white shadow-lg border border-black/5 px-2.5 pt-2.5">
              <div className="rr-line h-1.5 w-10 rounded-full bg-[#012e57]" />
              <div className="rr-line mt-1.5 h-[2px] w-full bg-[#03b989]" />
              <div className="rr-line mt-2 h-1 w-16 rounded-full bg-slate-300" />
              <div className="rr-line mt-1.5 h-1 w-12 rounded-full bg-slate-200" />
              <div className="rr-line mt-2.5 grid grid-cols-3 gap-[2px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`h-1.5 ${i < 3 ? "bg-[#1e2a38]" : i % 2 ? "bg-slate-100" : "bg-slate-200"}`} />
                ))}
              </div>
              <div className="rr-line mt-2.5 h-1 w-14 rounded-full bg-slate-200" />
              <svg className="rr-sign mt-2 h-5 w-16" viewBox="0 0 64 20" fill="none">
                <path d="M2 14c6-9 9-11 10-7s-3 9 1 7 7-10 10-8-1 8 3 7 6-6 9-5 3 4 7 3 9-5 18-4" stroke="#1e2a38" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <div className="rr-check absolute right-0 bottom-3 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
          </div>
        </div>

        <h2 id="rr-title" className="text-xl text-center">PDF gotowy</h2>
        {subtitle && <p className="text-sm text-muted-foreground text-center mt-1 truncate">{subtitle}</p>}
        <p className="text-[11px] text-muted-foreground text-center mt-1 break-all">{filename} • {sizeKb} KB</p>

        <div className="mt-5 space-y-2.5">
          {canShare ? (
            <>
              <button
                onClick={handleShare}
                disabled={sharing}
                className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-600/20 disabled:opacity-60"
              >
                <Send className="h-5 w-5" /> Wyślij klientowi
              </button>
              <p className="text-[11px] text-muted-foreground text-center -mt-0.5">WhatsApp, e-mail, SMS - wybierasz w telefonie</p>
              <button
                onClick={handleDownload}
                className="w-full h-11 rounded-xl border border-border font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
              >
                <Download className="h-4 w-4" /> Pobierz PDF
              </button>
            </>
          ) : (
            <button
              onClick={handleDownload}
              className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-emerald-600/20"
            >
              <Download className="h-5 w-5" /> Pobierz PDF
            </button>
          )}
          <button onClick={onClose} className="w-full h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
