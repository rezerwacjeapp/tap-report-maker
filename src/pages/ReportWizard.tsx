import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceButton } from "@/components/VoiceButton";
import { ArrowLeft, FileDown, Check, Trash2, Eye, EyeOff, Plus, Loader2, Zap, Pause, X, MessageSquare } from "lucide-react";
import {
  getDraft, saveDraft, clearDraft, hasDraft,
  type ReportDraft,
} from "@/lib/storage";
import { getTemplateById, getAllTileOptions } from "@/lib/templates";
import { generateReport, type TemplateOptions } from "@/lib/pdf-generator";
import {
  getCloudProfile, addCloudReport, saveCloudSnapshot,
  checkReportLimit, incrementReportCount, getCloudNextReportNumber,
  saveCloudDraft, deleteCloudDraft, getCloudDraft,
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
  const draftParam = searchParams.get("draft") || "";
  const template = getTemplateById(templateId);

  // Cloud draft tracking (editing existing saved draft)
  const [cloudDraftId, setCloudDraftId] = useState<string | null>(draftParam || null);

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
  const [savingDraft, setSavingDraft] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    getCloudProfile().then(setCloudProfile).catch(() => {});
  }, []);

  // Draft
  const buildEmptyDraft = useCallback((): ReportDraft => {
    const cf: Record<string, string> = {};
    const ts: Record<string, "done" | "fail" | "na"> = {};
    allFields.forEach((f) => {
      if (f.type === "date") cf[f.id] = new Date().toISOString().split("T")[0];
      else if (f.type === "tiles") {
        (f.tileOptions || []).forEach((t) => { ts[t.id] = "na"; });
      } else if (!["tiles", "photos", "signature"].includes(f.type)) cf[f.id] = "";
    });
    return { selectedTiles: [], tileStates: ts, tileNotes: {}, photos: [], photosByField: {}, signatures: {}, customFields: cf, reportNumber: "", templateId };
  }, [allFields, templateId]);

  const [draft, setDraft] = useState<ReportDraft>(buildEmptyDraft);
  const [showResume, setShowResume] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();
  const didCheckDraft = useRef(false);

  useEffect(() => {
    if (didCheckDraft.current) return;
    didCheckDraft.current = true;

    // Loading from a saved cloud draft?
    if (draftParam) {
      getCloudDraft(draftParam).then((cd) => {
        if (cd) {
          const d = cd.draftData as ReportDraft;
          setDraft(d);
          setShowCompanyHeader(cd.showCompanyHeader);
          if (d.additionalNotes?.trim()) setShowNotes(true);
          const notesWithContent = Object.entries(d.tileNotes || {}).filter(([, v]) => v?.trim()).map(([k]) => k);
          if (notesWithContent.length) setExpandedNoteIds(new Set(notesWithContent));
        } else {
          setDraft(buildEmptyDraft());
        }
        setInitialized(true);
      }).catch(() => { setDraft(buildEmptyDraft()); setInitialized(true); });
      return;
    }

    // Existing localStorage draft?
    if (hasDraft()) {
      const saved = getDraft();
      const hasContent = saved.selectedTiles.length > 0 || saved.photos.length > 0 ||
        Object.values(saved.photosByField || {}).some((arr) => arr.length > 0) ||
        Object.values(saved.signatures || {}).some((v) => !!v) ||
        Object.values(saved.tileStates || {}).some((v) => v !== "na") ||
        Object.values(saved.tileNotes || {}).some((v) => v?.trim()) ||
        Object.values(saved.customFields).some((v) => v?.trim() && v !== new Date().toISOString().split("T")[0]);
      if (saved.templateId === templateId && hasContent) {
        setShowResume(true);
      } else { clearDraft(); setDraft(buildEmptyDraft()); setInitialized(true); }
    } else { setDraft(buildEmptyDraft()); setInitialized(true); }
  }, [templateId, buildEmptyDraft, draftParam]);

  const handleResume = () => {
    const d = getDraft();
    setDraft(d);
    if (d.additionalNotes?.trim()) setShowNotes(true);
    // Expand tile notes that have content
    const notesWithContent = Object.entries(d.tileNotes || {}).filter(([, v]) => v?.trim()).map(([k]) => k);
    if (notesWithContent.length) setExpandedNoteIds(new Set(notesWithContent));
    setShowResume(false);
    setInitialized(true);
  };
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

  const setTileState = (tileId: string, state: "done" | "fail" | "na") => {
    const newStates = { ...(draft.tileStates || {}), [tileId]: state };
    // Keep selectedTiles in sync for backward compat
    const newSelected = Object.entries(newStates).filter(([, s]) => s === "done").map(([id]) => id);
    update({ tileStates: newStates, selectedTiles: newSelected });
  };

  const setTileNote = (tileId: string, note: string) => {
    update({ tileNotes: { ...(draft.tileNotes || {}), [tileId]: note } });
  };

  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const toggleNoteExpand = (id: string) => setExpandedNoteIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

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

      // Delete cloud draft if we were editing one
      if (cloudDraftId) deleteCloudDraft(cloudDraftId).catch(() => {});

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

  const handleSaveLater = async () => {
    if (savingDraft) return;
    setSavingDraft(true);
    try {
      // Build a label from the first non-empty text field
      const firstTextField = allFields.find((f) => f.type === "text" && draft.customFields[f.id]?.trim());
      const label = firstTextField ? draft.customFields[firstTextField.id].trim() : "";

      const savedId = await saveCloudDraft({
        id: cloudDraftId || undefined,
        templateId,
        templateName,
        draftData: draft,
        showCompanyHeader,
        label,
      });

      setCloudDraftId(savedId);
      clearDraft();
      toast.success("Raport zapisany — dokończysz później");
      navigate("/");
    } catch (err) {
      console.error("Draft save error:", err);
      toast.error("Nie udało się zapisać szkicu");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleClearDraft = () => {
    if (cloudDraftId) deleteCloudDraft(cloudDraftId).catch(() => {});
    clearDraft();
    setCloudDraftId(null);
    setDraft(buildEmptyDraft());
    toast.success("Szkic wyczyszczony");
  };

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
        <button
          onClick={() => setShowCompanyHeader((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${showCompanyHeader ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}
          title={showCompanyHeader ? "Dane firmy widoczne w PDF" : "Dane firmy ukryte w PDF"}
        >
          {showCompanyHeader ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showCompanyHeader ? "Dane firmy widoczne" : "Dane firmy ukryte"}
        </button>
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
                  <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {(field.tileOptions || []).map((tile) => {
                      const state = (draft.tileStates || {})[tile.id] || "na";
                      const noteExpanded = expandedNoteIds.has(tile.id);
                      const noteText = (draft.tileNotes || {})[tile.id] || "";
                      return (
                        <div key={tile.id} className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm flex-1 min-w-0">{tile.label}</span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => setTileState(tile.id, "done")}
                                className={`w-9 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${state === "done" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              >✓</button>
                              <button
                                onClick={() => setTileState(tile.id, "fail")}
                                className={`w-9 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${state === "fail" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              >✗</button>
                              <button
                                onClick={() => setTileState(tile.id, "na")}
                                className={`w-9 h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-colors ${state === "na" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              >nd.</button>
                            </div>
                            <button
                              onClick={() => toggleNoteExpand(tile.id)}
                              className={`p-1.5 rounded-lg transition-colors ${noteExpanded || noteText ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                              title="Uwagi"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </div>
                          {noteExpanded && (
                            <input
                              type="text"
                              className="mt-2 w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:border-accent transition-colors"
                              value={noteText}
                              onChange={(e) => setTileNote(tile.id, e.target.value)}
                              placeholder="Uwagi..."
                            />
                          )}
                        </div>
                      );
                    })}
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
      </main>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-5 py-4 space-y-2">
        <button onClick={handleGenerate} disabled={generating || savingDraft} className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50">
          {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />} {generating ? "Generuję..." : "Generuj PDF"}
        </button>
        <button onClick={handleSaveLater} disabled={savingDraft || generating} className="w-full h-10 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-muted disabled:opacity-50">
          {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} {savingDraft ? "Zapisuję..." : "Dokończ później"}
        </button>
      </div>
    </div>
  );
}
