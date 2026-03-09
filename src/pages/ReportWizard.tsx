import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/StepIndicator";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceButton } from "@/components/VoiceButton";
import { ArrowLeft, ArrowRight, FileDown, Check, Trash2, SlidersHorizontal, Eye, EyeOff } from "lucide-react";
import {
  getDraft, saveDraft, clearDraft, getEmptyDraft, hasDraft,
  getProfile, addReportToHistory,
  type ReportDraft,
} from "@/lib/storage";
import { getTemplateById, type SignatureFieldDef } from "@/lib/templates";
import { generateReport } from "@/lib/pdf-generator";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function ReportWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template") || "";
  const template = getTemplateById(templateId);

  const { allFields, allTiles, pdfTitle, templateName, hasPhotos, signatureFields } = useMemo(() => {
    if (template && template.fields.length > 0) {
      // Collect all tile options from tiles-type fields + legacy template.tiles
      const tilesFromFields = template.fields
        .filter((f) => f.type === "tiles")
        .flatMap((f) => f.tileOptions || []);
      const legacyTiles = template.tiles || [];
      return {
        allFields: template.fields,
        allTiles: [...tilesFromFields, ...legacyTiles],
        pdfTitle: template.pdfTitle,
        templateName: template.name,
        hasPhotos: template.hasPhotos ?? true,
        signatureFields: template.signatureFields || [{ id: "sig_client", label: "Podpis klienta" }],
      };
    }
    return {
      allFields: [],
      allTiles: [],
      pdfTitle: "RAPORT SERWISOWY",
      templateName: template?.name || "Raport serwisowy",
      hasPhotos: true,
      signatureFields: [{ id: "sig_client", label: "Podpis klienta" }] as SignatureFieldDef[],
    };
  }, [template]);

  const hasStep2 = hasPhotos || signatureFields.length > 0;
  const STEPS = hasStep2 ? ["Dane i czynności", "Zdjęcia i podpis"] : ["Dane i czynności"];

  // Field filter
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set());
  const visibleFields = useMemo(() => allFields.filter((f) => !hiddenFieldIds.has(f.id)), [allFields, hiddenFieldIds]);
  const hiddenCount = hiddenFieldIds.size;

  const toggleFieldVis = (id: string) => setHiddenFieldIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Draft
  const buildEmptyDraft = useCallback((): ReportDraft => {
    const cf: Record<string, string> = {};
    allFields.forEach((f) => { cf[f.id] = f.type === "date" ? new Date().toISOString().split("T")[0] : ""; });
    return { selectedTiles: [], photos: [], signatures: {}, customFields: cf, templateId };
  }, [allFields, templateId]);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>(buildEmptyDraft);
  const [showResume, setShowResume] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();
  const didCheckDraft = useRef(false);

  useEffect(() => {
    if (didCheckDraft.current) return;
    didCheckDraft.current = true;
    if (hasDraft()) {
      const saved = getDraft();
      const hasContent = saved.selectedTiles.length > 0 || saved.photos.length > 0 ||
        Object.values(saved.signatures || {}).some((v) => !!v) ||
        Object.values(saved.customFields).some((v) => v?.trim() && v !== new Date().toISOString().split("T")[0]);
      if (saved.templateId === templateId && hasContent) {
        setShowResume(true);
      } else { clearDraft(); setDraft(buildEmptyDraft()); setInitialized(true); }
    } else { setDraft(buildEmptyDraft()); setInitialized(true); }
  }, [templateId, buildEmptyDraft]);

  const handleResume = () => { setDraft(getDraft()); setShowResume(false); setInitialized(true); };
  const handleNewDraft = () => { clearDraft(); setDraft(buildEmptyDraft()); setShowResume(false); setInitialized(true); };

  useEffect(() => {
    if (!initialized) return;
    autoSaveRef.current = setInterval(() => { saveDraft(draft); }, 10_000);
    return () => clearInterval(autoSaveRef.current);
  }, [draft, initialized]);

  const update = useCallback((partial: Partial<ReportDraft>) => {
    setDraft((d) => { const next = { ...d, ...partial }; saveDraft(next); return next; });
  }, []);

  const toggleTile = (id: string) => {
    update({ selectedTiles: draft.selectedTiles.includes(id) ? draft.selectedTiles.filter((t) => t !== id) : [...draft.selectedTiles, id] });
  };

  const updateField = (id: string, value: string) => update({ customFields: { ...draft.customFields, [id]: value } });

  const updateSignature = (sigId: string, data: string | null) => {
    update({ signatures: { ...draft.signatures, [sigId]: data } });
  };

  const handleGenerate = () => {
    const profile = getProfile();
    try {
      const meta = generateReport(profile, draft, {
        pdfTitle, templateName, fields: allFields, tiles: allTiles, signatureFields,
      });
      addReportToHistory(meta);
      toast.success("Raport PDF wygenerowany!");
      clearDraft();
      navigate("/");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Błąd generowania PDF");
    }
  };

  const handleClearDraft = () => { clearDraft(); setDraft(buildEmptyDraft()); setStep(0); toast.success("Szkic wyczyszczony"); };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <AlertDialog open={showResume} onOpenChange={setShowResume}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Niedokończony raport</AlertDialogTitle>
            <AlertDialogDescription>Masz niedokończony raport ({templateName}). Kontynuować?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNewDraft}>Zacznij od nowa</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>Kontynuuj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center gap-2 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl flex-1 truncate">{templateName}</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <SlidersHorizontal className="h-5 w-5" />
              {hiddenCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">{hiddenCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Dostosuj widoczne pola</SheetTitle></SheetHeader>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Ukryj co nie dotyczy tego zlecenia. Szablon się nie zmieni.</p>
            {allFields.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pola ({visibleFields.length}/{allFields.length})</p>
                {allFields.map((f) => {
                  const vis = !hiddenFieldIds.has(f.id);
                  return (
                    <button key={f.id} onClick={() => toggleFieldVis(f.id)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 text-left">
                      <span className={`text-sm ${vis ? "" : "text-muted-foreground line-through"}`}>{f.label}</span>
                      {vis ? <Eye className="h-4 w-4 text-accent" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            )}
            {hiddenCount > 0 && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setHiddenFieldIds(new Set()); }}>
                Pokaż wszystko ({hiddenCount} ukrytych)
              </Button>
            )}
          </SheetContent>
        </Sheet>
        <Button variant="ghost" size="icon" onClick={handleClearDraft}><Trash2 className="h-5 w-5 text-destructive" /></Button>
      </header>

      <StepIndicator steps={STEPS} current={step} />

      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {step === 0 && (
          <div className="space-y-4">
            {visibleFields.map((field) => (
              <div key={field.id}>
                {/* --- TILES-TYPE FIELD: render as grouped checkboxes --- */}
                {field.type === "tiles" ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">{field.label}</label>
                    {(field.tileOptions || []).length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {(field.tileOptions || []).map((tile) => (
                          <Button key={tile.id} variant={draft.selectedTiles.includes(tile.id) ? "tileActive" : "tile"} size="lg" className="h-auto py-4 text-sm leading-tight text-center whitespace-normal" onClick={() => toggleTile(tile.id)}>
                            {draft.selectedTiles.includes(tile.id) && <Check className="h-4 w-4 mr-1 shrink-0" />}
                            {tile.label}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Brak zdefiniowanych czynności w tej sekcji.</p>
                    )}
                  </div>
                ) : (
                  /* --- REGULAR FIELD --- */
                  <>
                    <label className="text-sm font-medium mb-1.5 block">
                      {field.label}
                      {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <div className="space-y-2">
                        <textarea className="w-full min-h-[80px] rounded-lg border-2 border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent resize-none" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                        <VoiceButton onResult={(text) => { const cur = draft.customFields[field.id] || ""; updateField(field.id, cur ? `${cur} ${text}` : text); }} />
                      </div>
                    ) : field.type === "text" ? (
                      <div className="space-y-2">
                        <input type="text" className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                        <VoiceButton onResult={(text) => { updateField(field.id, text); }} />
                      </div>
                    ) : (
                      <input type={field.type === "number" ? "number" : "date"} className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                    )}
                  </>
                )}
              </div>
            ))}

            {/* If no step 2, show note */}
            {!hasStep2 && (
              <p className="text-xs text-muted-foreground text-center pt-4">Ten szablon nie zawiera zdjęć ani podpisów.</p>
            )}
          </div>
        )}

        {step === 1 && hasStep2 && (
          <div className="space-y-6">
            {hasPhotos && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Dokumentacja fotograficzna (max 6):</p>
                <PhotoGallery photos={draft.photos} onChange={(photos) => update({ photos })} />
              </div>
            )}

            {signatureFields.map((sf) => (
              <div key={sf.id} className="space-y-4">
                <p className="text-sm text-muted-foreground">{sf.label}:</p>
                <SignatureCanvas
                  value={draft.signatures[sf.id] || null}
                  onChange={(data) => updateSignature(sf.id, data)}
                  label={sf.label}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="sticky bottom-0 bg-background border-t border-border px-5 py-4 flex gap-3">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Wstecz
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button variant="accent" size="lg" onClick={() => setStep(step + 1)} className="flex-1">
            Dalej <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button variant="accent" size="lg" onClick={handleGenerate} className="flex-1">
            <FileDown className="h-5 w-5 mr-1" /> Generuj PDF
          </Button>
        )}
      </div>
    </div>
  );
}
