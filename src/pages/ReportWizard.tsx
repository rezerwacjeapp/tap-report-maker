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
  getTiles, getProfile, getCustomFields,
  type ReportDraft,
} from "@/lib/storage";
import { generateReport } from "@/lib/pdf-generator";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STEPS = ["Klient", "Czynności", "Zdjęcia", "Podpis"];

export default function ReportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>(getEmptyDraft);
  const [showResume, setShowResume] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const tiles = getTiles();
  const customFields = getCustomFields();
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();

  // On mount: check for existing draft
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

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!initialized) return;
    autoSaveRef.current = setInterval(() => {
      saveDraft(draft);
    }, 10_000);
    return () => clearInterval(autoSaveRef.current);
  }, [draft, initialized]);

  // Also save on every change
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

  const canNext = () => {
    if (step === 0) return !!draft.clientName.trim();
    if (step === 1) return draft.selectedTiles.length > 0;
    return true;
  };

  const handleGenerate = () => {
    const profile = getProfile();
    try {
      generateReport(profile, draft);
      toast.success("Raport PDF wygenerowany!");
      clearDraft();
      navigate("/");
    } catch {
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
      {/* Resume dialog */}
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

      {/* Header */}
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

      {/* Content */}
      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Step 0: Client */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nazwa klienta *</label>
              <input
                className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                value={draft.clientName}
                onChange={(e) => update({ clientName: e.target.value })}
                placeholder="Jan Kowalski / Firma ABC"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Adres obiektu</label>
              <input
                className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                value={draft.clientAddress}
                onChange={(e) => update({ clientAddress: e.target.value })}
                placeholder="ul. Przykładowa 1, Warszawa"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Data</label>
              <input
                type="date"
                className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
                value={draft.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </div>

            {/* Custom fields on step 0 */}
            {customFields.map((field) => (
              <div key={field.id}>
                <label className="text-sm font-medium mb-1.5 block">
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border-2 border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent transition-colors resize-none"
                    value={draft.customFields[field.id] || ""}
                    onChange={(e) => updateCustomField(field.id, e.target.value)}
                    placeholder={field.label}
                  />
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
          </div>
        )}

        {/* Step 1: Tiles */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Wybierz wykonane czynności:</p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium block">Dodatkowe uwagi</label>
              <textarea
                className="w-full min-h-[80px] rounded-lg border-2 border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent transition-colors resize-none"
                value={draft.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Opcjonalne uwagi..."
              />
              <VoiceButton onResult={(text) => update({ note: draft.note ? `${draft.note} ${text}` : text })} />
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Dodaj dokumentację fotograficzną (max 6):</p>
            <PhotoGallery photos={draft.photos} onChange={(photos) => update({ photos })} />
          </div>
        )}

        {/* Step 3: Signature */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Poproś klienta o podpis:</p>
            <SignatureCanvas value={draft.signature} onChange={(signature) => update({ signature })} />
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
            disabled={!canNext()}
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
