import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSharedTemplate } from "@/lib/supabase-storage";
import { saveUserTemplate, type ReportTemplate } from "@/lib/templates";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ImportTemplate() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateData, setTemplateData] = useState<ReportTemplate | null>(null);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    getSharedTemplate(code)
      .then((result) => {
        if (result) {
          setTemplateName(result.name);
          setTemplateData(result.template);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  const handleImport = async () => {
    if (!templateData) return;
    setImporting(true);
    try {
      const imported: ReportTemplate = {
        ...templateData,
        id: `user_${Date.now()}`,
        builtIn: false,
      };
      await saveUserTemplate(imported);
      setDone(true);
      toast.success("Szablon zaimportowany!");
    } catch {
      toast.error("Nie udało się zaimportować szablonu");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Szablon nie znaleziony</h1>
          <p className="text-sm text-muted-foreground">
            Link jest nieprawidłowy lub szablon został usunięty.
          </p>
          <button
            onClick={() => navigate("/")}
            className="h-11 px-6 rounded-xl bg-accent text-white font-medium active:scale-[0.98] transition-transform"
          >
            Strona główna
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-xl font-bold">Gotowe!</h1>
          <p className="text-sm text-muted-foreground">
            Szablon <strong>{templateName}</strong> został dodany do Twoich szablonów.
          </p>
          <button
            onClick={() => navigate("/select-template")}
            className="h-11 px-6 rounded-xl bg-accent text-white font-medium active:scale-[0.98] transition-transform"
          >
            Przejdź do szablonów
          </button>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5">
        <div className="text-center space-y-5 max-w-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-accent" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Szablon: {templateName}</h1>
            <p className="text-sm text-muted-foreground">
              Zaloguj się lub utwórz konto, żeby zaimportować ten szablon do swojej aplikacji.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              to="/login"
              onClick={() => localStorage.setItem("raporton_pending_import", code!)}
              className="block h-11 rounded-xl bg-accent text-white font-medium leading-[2.75rem] text-center active:scale-[0.98] transition-transform"
            >
              Zaloguj się
            </Link>
            <Link
              to="/register"
              onClick={() => localStorage.setItem("raporton_pending_import", code!)}
              className="block h-11 rounded-xl border border-border text-foreground font-medium leading-[2.75rem] text-center active:scale-[0.98] transition-transform"
            >
              Utwórz konto
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in — show import button
  const fieldCount = templateData?.fields.filter(f => !["tiles","photos","signature"].includes(f.type)).length || 0;
  const tileCount = templateData?.fields.reduce((sum, f) => sum + (f.tileOptions?.length || 0), 0) || 0;
  const sigCount = templateData?.fields.filter(f => f.type === "signature").length || 0;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5">
      <div className="text-center space-y-5 max-w-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
          <FileText className="h-8 w-8 text-accent" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{templateName}</h1>
          <p className="text-sm text-muted-foreground">
            {fieldCount} pól • {tileCount} czynności • {sigCount} {sigCount === 1 ? "podpis" : "podpisy"}
          </p>
        </div>
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Importuj szablon"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
