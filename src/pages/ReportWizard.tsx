import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceButton } from "@/components/VoiceButton";
import { ArrowLeft, FileDown, Check, Trash2, Eye, EyeOff, Plus, Loader2, Zap } from "lucide-react";
import {
  getDraft, saveDraft, clearDraft, hasDraft,
  type ReportDraft,
} from "@/lib/storage";
import { getTemplateById, getAllTileOptions } from "@/lib/templates";
import { generateReport, type TemplateOptions } from "@/lib/pdf-generator";
import {
  getCloudProfile, addCloudReport, saveCloudSnapshot,
  checkReportLimit, incrementReportCount, getCloudNextReportNumber,
} from "@/lib/supabase-storage";
import type { CompanyProfile } from "@/lib/storage";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReportWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template") || "";
  const template = getTemplateById(templateId);

  const { allFields, allTiles, pdfTitle, templateName, defaultShowCompanyHeader } = useMemo(() => {
    if (template && template.fields.length > 0) {
      const tilesFromFields = getAllTileOptions(template);
      const legacyTiles = template.tiles || [];
      return {
        allFields: template.fields,
        allTiles: [...tilesFromFields, ...legacyTiles],
        pdfTitle: template.pdfTitle,
        templateName: template.name,
        defaultShowCompanyHeader: template.showCompanyHeader !== false,
      };
    }
    return { allFields: [], allTiles: [], pdfTitle: "RAPORT SERWISOWY", templateName: template?.name || "Raport serwisowy", defaultShowCompanyHeader: true };
  }, [template]);

  // Derive signature fields from fields for PDF generator compatibility
  const signatureFields = useMemo(() =>
    allFields.filter((f) => f.type === "signature").map((f) => ({ id: f.id, label: f.label })),
    [allFields]
  );

  // Field visibility
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set());
  const [showNotes, setShowNotes] = useState(false);
  const [showCompanyHeader, setShowCompanyHeader] = useState(true);

  useEffect(() => { setShowCompanyHeader(defaultShowCompanyHeader); }, [defaultShowCompanyHeader]);
  const visibleFields = useMemo(() => allFields.filter((f) => !hiddenFieldIds.has(f.id)), [allFields, hiddenFieldIds]);
  const toggleFieldVis = (id: string) => setHiddenFieldIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Profile from Supabase (needed for PDF generation)
  const [cloudProfile, setCloudProfile] = useState<CompanyProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    getCloudProfile().then(setCloudProfile).catch(() => {});
  }, []);

  // Draft
  const buildEmptyDraft = useCallback((): ReportDraft => {
    const cf: Record<string, string> = {};
    allFields.forEach((f) => { if (f.type === "date") cf[f.id] = new Date().toISOString().split("T")[0]; else if (!["tiles", "photos", "signature"].includes(f.type)) cf[f.id] = ""; });
    return { selectedTiles: [], photos: [], photosByField: {}, signatures: {}, customFields: cf, reportNumber: "", templateId };
  }, [allFields, templateId]);

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
        Object.values(saved.photosByField || {}).some((arr) => arr.length > 0) ||
        Object.values(saved.signatures || {}).some((v) => !!v) ||
        Object.values(saved.customFields).some((v) => v?.trim() && v !== new Date().toISOString().split("T")[0]);
      if (saved.templateId === templateId && hasContent) {
        setShowResume(true);
      } else { clearDraft(); setDraft(buildEmptyDraft()); setInitialized(true); }
    } else { setDraft(buildEmptyDraft()); setInitialized(true); }
  }, [templateId, buildEmptyDraft]);

  const handleResume = () => { const d = getDraft(); setDraft(d); if (d.additionalNotes?.trim()) setShowNotes(true); setShowResume(false); setInitialized(true); };
  const handleNewDraft = () => { clearDraft(); setDraft(buildEmptyDraft()); setShowResume(false); setInitialized(true); };

  // Load report number from Supabase for new drafts
  useEffect(() => {
    if (!initialized) return;
    if (!draft.reportNumber) {
      getCloudNextReportNumber().then((num) => {
        setDraft((d) => ({ ...d, reportNumber: num }));
      }).catch(() => {});
    }
  }, [initialized]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const updateSignature = (sigId: string, data: string | null) => update({ signatures: { ...draft.signatures, [sigId]: data } });

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      // Check plan limit
      const limit = await checkReportLimit();
      if (!limit.allowed) {
        setLimitInfo({ count: limit.count, limit: limit.limit });
        setShowLimitModal(true);
        setGenerating(false);
        return;
      }

      // Load profile from Supabase (use cached if available)
      const profile = cloudProfile || await getCloudProfile();

      const meta = generateReport(profile, draft, {
        pdfTitle, templateName, fields: allFields, tiles: allTiles, signatureFields, showCompanyHeader,
      });

      // Save to Supabase
      const cloudId = await addCloudReport(meta);

      // Save snapshot for re-download
      saveCloudSnapshot(cloudId, {
        draft: { ...draft },
        profile: { ...profile },
        options: { pdfTitle, templateName, fields: allFields, tiles: allTiles, signatureFields, showCompanyHeader },
      }).catch((e) => console.warn("Snapshot save failed:", e));

      // Increment report count for free plan
      incrementReportCount().catch(() => {});

      toast.success("Raport PDF wygenerowany!");
      clearDraft();
      navigate("/");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Błąd generowania PDF");
    } finally {
      setGenerating(false);
    }
  };

  const handleClearDraft = () => { clearDraft(); setDraft(buildEmptyDraft()); toast.success("Szkic wyczyszczony"); };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Resume draft dialog */}
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

      {/* Limit reached modal */}
      <AlertDialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Limit raportów osiągnięty
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Wykorzystałeś {limitInfo?.count}/{limitInfo?.limit} darmowych raportów w tym miesiącu.
              </p>
              <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-destructive w-full" />
              </div>
              <p>
                Przejdź na plan <strong>Solo za 19 zł/miesiąc</strong> i generuj raporty bez limitu.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Zamknij</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/upgrade")}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <Zap className="h-4 w-4 mr-1" />
              Przejdź na Solo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center gap-2 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-lg flex-1 truncate">{templateName}</h1>
        <Button variant="ghost" size="icon" onClick={handleClearDraft}><Trash2 className="h-5 w-5 text-destructive" /></Button>
      </header>

      <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Report number — editable */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Numer raportu</label>
          <input
            type="text"
            className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
            value={draft.reportNumber || ""}
            onChange={(e) => update({ reportNumber: e.target.value })}
            placeholder="np. 001/2026"
          />
        </div>

        {visibleFields.map((field) => (
          <div key={field.id} className="relative">
            {/* Eye toggle */}
            <button
              onClick={() => toggleFieldVis(field.id)}
              className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground z-10"
              title="Ukryj to pole"
            >
              <EyeOff className="h-4 w-4" />
            </button>

            {/* TILES */}
            {field.type === "tiles" ? (
              <div>
                <label className="text-sm font-medium mb-2 block pr-6">{field.label}</label>
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

            /* PHOTOS */
            ) : field.type === "photos" ? (
              <div>
                <label className="text-sm font-medium mb-2 block pr-6">{field.label}</label>
                <PhotoGallery photos={draft.photosByField[field.id] || []} onChange={(photos) => update({ photosByField: { ...draft.photosByField, [field.id]: photos } })} />
              </div>

            /* SIGNATURE */
            ) : field.type === "signature" ? (
              <div>
                <label className="text-sm font-medium mb-2 block pr-6">{field.label}</label>
                <SignatureCanvas
                  value={draft.signatures[field.id] || null}
                  onChange={(data) => updateSignature(field.id, data)}
                  label={field.label}
                />
              </div>

            /* TEXTAREA */
            ) : field.type === "textarea" ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6">
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                </label>
                <div className="space-y-2">
                  <textarea className="w-full min-h-[80px] rounded-xl border border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent resize-none" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                  <VoiceButton onResult={(text) => { const cur = draft.customFields[field.id] || ""; updateField(field.id, cur ? `${cur} ${text}` : text); }} />
                </div>
              </div>

            /* TEXT */
            ) : field.type === "text" ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6">
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                </label>
                <div className="space-y-2">
                  <input type="text" className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                  <VoiceButton onResult={(text) => { updateField(field.id, text); }} />
                </div>
              </div>

            /* NUMBER / DATE */
            ) : (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6">
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                </label>
                <input type={field.type === "number" ? "number" : "date"} className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
              </div>
            )}
          </div>
        ))}

        {/* Hidden fields indicator */}
        {hiddenFieldIds.size > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{hiddenFieldIds.size} ukrytych pól</span>
            <div className="flex gap-2">
              {allFields.filter((f) => hiddenFieldIds.has(f.id)).map((f) => (
                <button key={f.id} onClick={() => toggleFieldVis(f.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-card rounded px-2 py-1 border border-border">
                  <Eye className="h-3 w-3" /> {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Additional notes — hidden by default, toggled on demand */}
        {!showNotes ? (
          <button
            onClick={() => setShowNotes(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <Plus className="h-4 w-4" /> Uwagi dodatkowe
          </button>
        ) : (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Uwagi dodatkowe</label>
            <div className="space-y-2">
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent resize-none"
                value={draft.additionalNotes || ""}
                onChange={(e) => update({ additionalNotes: e.target.value })}
                placeholder="Dodatkowe uwagi, spostrzeżenia..."
              />
              <VoiceButton onResult={(text) => { const cur = draft.additionalNotes || ""; update({ additionalNotes: cur ? `${cur} ${text}` : text }); }} />
            </div>
          </div>
        )}

        {/* Company header toggle */}
        <button
          onClick={() => setShowCompanyHeader((v) => !v)}
          className="flex items-center justify-between w-full rounded-xl border border-border bg-card px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">Dane firmy w nagłówku PDF</span>
          {showCompanyHeader ? <Eye className="h-4 w-4 text-accent" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </button>
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-5 py-4">
        <button onClick={handleGenerate} disabled={generating} className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50">
          {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />} {generating ? "Generuję..." : "Generuj PDF"}
        </button>
      </div>
    </div>
  );
}
