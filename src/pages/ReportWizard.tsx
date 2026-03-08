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
  getTiles, getProfile, getCustomFields, addReportToHistory,
  type ReportDraft,
} from "@/lib/storage";
import { getTemplateById } from "@/lib/templates";
import { generateReport } from "@/lib/pdf-generator";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const STEPS = ["Dane i czynności", "Zdjęcia i podpis"];

export default function ReportWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template") || "";
  const template = getTemplateById(templateId);

  // Resolve fields and tiles from template
  const { allFields, allTiles, pdfTitle, templateName } = useMemo(() => {
    if (template && template.fields.length > 0) {
      return {
        allFields: template.fields,
        allTiles: template.tiles,
        pdfTitle: template.pdfTitle,
        templateName: template.name,
      };
    }
    // Fallback: user's custom fields/tiles from settings (legacy)
    return {
      allFields: getCustomFields(),
      allTiles: getTiles(),
      pdfTitle: "RAPORT SERWISOWY",
      templateName: "Raport serwisowy",
    };
  }, [template]);

  // --- Field filter (session-only, not saved) ---
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set());
  const [hiddenTileIds, setHiddenTileIds] = useState<Set<string>>(new Set());

  const visibleFields = useMemo(
    () => allFields.filter((f) => !hiddenFieldIds.has(f.id)),
    [allFields, hiddenFieldIds]
  );
  const visibleTiles = useMemo(
    () => allTiles.filter((t) => !hiddenTileIds.has(t.id)),
    [allTiles, hiddenTileIds]
  );

  const toggleFieldVisibility = (fieldId: string) => {
    setHiddenFieldIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId); else next.add(fieldId);
      return next;
    });
  };

  const toggleTileVisibility = (tileId: string) => {
    setHiddenTileIds((prev) => {
      const next = new Set(prev);
      if (next.has(tileId)) next.delete(tileId); else next.add(tileId);
      return next;
    });
  };

  const hiddenCount = hiddenFieldIds.size + hiddenTileIds.size;

  // --- Draft ---
  const buildEmptyDraft = useCallback((): ReportDraft => {
    const base = getEmptyDraft();
    const cf: Record<string, string> = {};
    allFields.forEach((f) => {
      cf[f.id] = f.type === "date" ? new Date().toISOString().split("T")[0] : "";
    });
    return { ...base, customFields: cf, templateId };
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
      // Only offer resume if same template AND draft has real content
      const hasContent =
        saved.selectedTiles.length > 0 ||
        saved.photos.length > 0 ||
        !!saved.signature ||
        Object.values(saved.customFields).some((v) => v?.trim() && v !== new Date().toISOString().split("T")[0]);

      if (saved.templateId === templateId && hasContent) {
        setShowResume(true);
      } else {
        clearDraft();
        setDraft(buildEmptyDraft());
        setInitialized(true);
      }
    } else {
      setDraft(buildEmptyDraft());
      setInitialized(true);
    }
  }, [templateId, buildEmptyDraft]);

  const handleResume = () => {
    setDraft(getDraft());
    setShowResume(false);
    setInitialized(true);
  };

  const handleNewDraft = () => {
    clearDraft();
    setDraft(buildEmptyDraft());
    setShowResume(false);
    setInitialized(true);
  };

  useEffect(() => {
    if (!initialized) return;
    autoSaveRef.current = setInterval(() => { saveDraft(draft); }, 10_000);
    return () => clearInterval(autoSaveRef.current);
  }, [draft, initialized]);

  const update = useCallback((partial: Partial<ReportDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...partial };
      saveDraft(next);
      return next;
    });
  }, []);

  const toggleTile = (id: string) => {
    update({
      selectedTiles: draft.selectedTiles.includes(id)
        ? draft.selectedTiles.filter((t) => t !== id)
        : [...draft.selectedTiles, id],
    });
  };

  const updateCustomField = (fieldId: string, value: string) => {
    update({ customFields: { ...draft.customFields, [fieldId]: value } });
  };

  const handleGenerate = () => {
    const profile = getProfile();
    try {
      const meta = generateReport(profile, draft, {
        pdfTitle,
        templateName,
        fields: allFields, // Use ALL fields (not just visible) so PDF has everything filled
        tiles: allTiles,
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

  const handleClearDraft = () => {
    clearDraft();
    setDraft(buildEmptyDraft());
    setStep(0);
    toast.success("Szkic wyczyszczony");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <AlertDialog open={showResume} onOpenChange={setShowResume}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Niedokończony raport</AlertDialogTitle>
            <AlertDialogDescription>
              Masz niedokończony raport ({templateName}). Czy chcesz go kontynuować?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNewDraft}>Zacznij od nowa</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>Kontynuuj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center gap-2 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl truncate">{templateName}</h1>
        </div>

        {/* Field filter trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" title="Dostosuj widoczne pola">
              <SlidersHorizontal className="h-5 w-5" />
              {hiddenCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {hiddenCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Dostosuj pola i czynności</SheetTitle>
              <p className="text-sm text-muted-foreground">
                Ukryj pola, które nie dotyczą tego zlecenia. Szablon się nie zmieni.
              </p>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              {/* Fields toggles */}
              {allFields.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Pola ({visibleFields.length}/{allFields.length})
                  </p>
                  <div className="space-y-1">
                    {allFields.map((field) => {
                      const isVisible = !hiddenFieldIds.has(field.id);
                      return (
                        <button
                          key={field.id}
                          onClick={() => toggleFieldVisibility(field.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className={`text-sm ${isVisible ? "text-foreground" : "text-muted-foreground line-through"}`}>
                            {field.label}
                          </span>
                          {isVisible
                            ? <Eye className="h-4 w-4 text-accent shrink-0" />
                            : <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tiles toggles */}
              {allTiles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Czynności ({visibleTiles.length}/{allTiles.length})
                  </p>
                  <div className="space-y-1">
                    {allTiles.map((tile) => {
                      const isVisible = !hiddenTileIds.has(tile.id);
                      return (
                        <button
                          key={tile.id}
                          onClick={() => toggleTileVisibility(tile.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className={`text-sm ${isVisible ? "text-foreground" : "text-muted-foreground line-through"}`}>
                            {tile.label}
                          </span>
                          {isVisible
                            ? <Eye className="h-4 w-4 text-accent shrink-0" />
                            : <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hiddenCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => { setHiddenFieldIds(new Set()); setHiddenTileIds(new Set()); }}
                >
                  Pokaż wszystko ({hiddenCount} ukrytych)
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="ghost" size="icon" onClick={handleClearDraft} title="Wyczyść szkic">
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </header>

      <StepIndicator steps={STEPS} current={step} />

      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Step 0: Fields + tiles */}
        {step === 0 && (
          <div className="space-y-4">
            {visibleFields.length === 0 && allFields.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Ten szablon nie ma pól. Wróć i dodaj je w edytorze szablonu.
              </div>
            )}

            {visibleFields.length === 0 && allFields.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Wszystkie pola ukryte. Kliknij <SlidersHorizontal className="h-4 w-4 inline" /> aby przywrócić.
              </div>
            )}

            {/* Dynamic fields */}
            {visibleFields.map((field) => (
              <div key={field.id}>
                <label className="text-sm font-medium mb-1.5 block">
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                </label>
                {field.type === "textarea" ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full min-h-[80px] rounded-lg border-2 border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent transition-colors resize-none"
                      value={draft.customFields[field.id] || ""}
                      onChange={(e) => updateCustomField(field.id, e.target.value)}
                      placeholder={field.label}
                    />
                    <VoiceButton
                      onResult={(text) => {
                        const current = draft.customFields[field.id] || "";
                        updateCustomField(field.id, current ? `${current} ${text}` : text);
                      }}
                    />
                  </div>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                    className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                    value={draft.customFields[field.id] || ""}
                    onChange={(e) => updateCustomField(field.id, e.target.value)}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}

            {/* Tiles section */}
            {visibleTiles.length > 0 && (
              <div className="pt-2">
                <label className="text-sm font-medium block mb-2">Wykonane czynności</label>
                <div className="grid grid-cols-2 gap-3">
                  {visibleTiles.map((tile) => (
                    <Button
                      key={tile.id}
                      variant={draft.selectedTiles.includes(tile.id) ? "tileActive" : "tile"}
                      size="lg"
                      className="h-auto py-4 text-sm leading-tight text-center whitespace-normal"
                      onClick={() => toggleTile(tile.id)}
                    >
                      {draft.selectedTiles.includes(tile.id) && <Check className="h-4 w-4 mr-1 shrink-0" />}
                      {tile.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Photos + Signature */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Dokumentacja fotograficzna (max 6):</p>
              <PhotoGallery photos={draft.photos} onChange={(photos) => update({ photos })} />
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Podpis klienta:</p>
              <SignatureCanvas value={draft.signature} onChange={(signature) => update({ signature })} />
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
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
