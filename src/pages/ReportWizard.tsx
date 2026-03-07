import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/StepIndicator";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceButton } from "@/components/VoiceButton";
import { ArrowLeft, ArrowRight, FileDown, Check, Trash2 } from "lucide-react";
import {
  getDraft, saveDraft, clearDraft, getEmptyDraft, hasDraft,
  getTiles, getProfile, getCustomFields, addReportToHistory,
  type ReportDraft,
} from "@/lib/storage";
import { generateReport } from "@/lib/pdf-generator";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STEPS = ["Dane i czynności", "Zdjęcia i podpis"];

export default function ReportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>(getEmptyDraft);
  const [showResume, setShowResume] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const tiles = getTiles();
  const customFields = getCustomFields();
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (hasDraft()) {
      setShowResume(true);
    } else {
      setDraft(getEmptyDraft());
      setInitialized(true);
    }
  }, []);

  const handleResume = () => {
    setDraft(getDraft());
    setShowResume(false);
    setInitialized(true);
  };

  const handleNewDraft = () => {
    clearDraft();
    setDraft(getEmptyDraft());
    setShowResume(false);
    setInitialized(true);
  };

  useEffect(() => {
    if (!initialized) return;
    autoSaveRef.current = setInterval(() => {
      saveDraft(draft);
    }, 10_000);
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
      const meta = generateReport(profile, draft);
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
    setDraft(getEmptyDraft());
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
              Masz niedokończony raport. Czy chcesz go kontynuować?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNewDraft}>Zacznij od nowa</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>Kontynuuj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center gap-3 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl flex-1">Nowy raport</h1>
        <Button variant="ghost" size="icon" onClick={handleClearDraft} title="Wyczyść szkic">
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </header>

      <StepIndicator steps={STEPS} current={step} />

      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Step 0: All data fields + tiles */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Dynamic custom fields */}
            {customFields.map((field) => (
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
            {tiles.length > 0 && (
              <>
                <div className="pt-2">
                  <label className="text-sm font-medium block mb-2">Wykonane czynności</label>
                  <div className="grid grid-cols-2 gap-3">
                    {tiles.map((tile) => (
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
              </>
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
          <Button
            variant="accent"
            size="lg"
            onClick={() => setStep(step + 1)}
            className="flex-1"
          >
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
