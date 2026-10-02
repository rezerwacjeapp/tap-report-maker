import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { PhotoGallery } from "@/components/PhotoGallery";
import { VoiceButton } from "@/components/VoiceButton";
import { TemplatePreview } from "@/components/TemplatePreview";
import { ArrowLeft, FileDown, Check, Trash2, Eye, EyeOff, Plus, Loader2, Zap, Pause, X, MessageSquare, History } from "lucide-react";
import {
  getDraft, saveDraft, clearDraft, hasDraft, getRememberedValues, rememberTemplateValues,
  type ReportDraft, type TextStyle, type CustomFieldDef,
} from "@/lib/storage";
import { getTemplateById, getAllTileOptions } from "@/lib/templates";
// PDF engine (pdfmake + fonts, ~1.8 MB) loads only when needed — prefetched when the wizard opens
const loadPdf = () => import("@/lib/pdf-generator");
import { TableFieldInput } from "@/components/TableFieldInput";
import { ReportReadySheet } from "@/components/ReportReadySheet";
import { initialTableValue, isTableValue, tableHasContent } from "@/lib/table-field";
import {
  todayISO, mainDateFieldId, isNextDateLabel, addMonthsISO, isISODate, buildReuseDraft, formatDatePL,
} from "@/lib/report-utils";
import {
  getCloudProfile, addCloudReport, saveCloudSnapshot,
  checkReportLimit, incrementReportCount, getCloudNextReportNumber, findReportByNumber,
  saveCloudDraft, deleteCloudDraft, getCloudDraft,
} from "@/lib/supabase-storage";
import { uploadSnapshotImages } from "@/lib/image-storage";
import { useAuth } from "@/hooks/use-auth";
import type { CompanyProfile } from "@/lib/storage";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const textStyleToCss = (s?: TextStyle): React.CSSProperties | undefined => {
  if (!s) return undefined;
  const css: React.CSSProperties = {};
  if (s.bold) css.fontWeight = "bold";
  if (s.italic) css.fontStyle = "italic";
  if (s.color) css.color = s.color;
  if (s.align) css.textAlign = s.align;
  return Object.keys(css).length > 0 ? css : undefined;
};

export default function ReportWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template") || "";
  const draftParam = searchParams.get("draft") || "";
  const reuseParam = searchParams.get("reuse") === "1";
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

  // Field visibility
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set());
  const [showNotes, setShowNotes] = useState(false);
  const [showCompanyHeader, setShowCompanyHeader] = useState(true);

  useEffect(() => { setShowCompanyHeader(defaultShowCompanyHeader); }, [defaultShowCompanyHeader]);
  const visibleFields = useMemo(() => allFields.filter((f) => !hiddenFieldIds.has(f.id)), [allFields, hiddenFieldIds]);
  const toggleFieldVis = (id: string) => setHiddenFieldIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Hidden fields must disappear from the PDF and the preview too — not just the
  // form. Tiles render inside the field loop and signatures derive from fields,
  // so we rebuild both from the visible set only. Legacy template-level tiles
  // (not tied to a field) stay, since they can't be hidden individually.
  const legacyTiles = useMemo(() => (template?.tiles || []), [template]);
  const visibleTiles = useMemo(() => [
    ...visibleFields.filter((f) => f.type === "tiles").flatMap((f) => f.tileOptions || []),
    ...legacyTiles,
  ], [visibleFields, legacyTiles]);
  const visibleSignatureFields = useMemo(() =>
    visibleFields.filter((f) => f.type === "signature").map((f) => ({ id: f.id, label: f.label })),
    [visibleFields]
  );

  // Etap 2 — live preview + click-a-field-in-preview to jump to the form
  const [mobileView, setMobileView] = useState<"fill" | "preview">("fill");
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const jumpToField = (id: string) => {
    // Reveal if hidden, switch to the form on mobile, then scroll + focus
    setHiddenFieldIds((p) => { if (!p.has(id)) return p; const n = new Set(p); n.delete(id); return n; });
    setMobileView("fill");
    setTimeout(() => {
      const el = fieldRefs.current[id];
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.querySelector<HTMLElement>("input, textarea")?.focus();
    }, 80);
  };

  // Profile from Supabase (needed for PDF generation)
  const [cloudProfile, setCloudProfile] = useState<CompanyProfile | null>(null);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ count: number; limit: number } | null>(null);

  useEffect(() => {
    getCloudProfile().then(setCloudProfile).catch(() => {});
    checkReportLimit().then((l) => setIsFreePlan(l.plan === "free")).catch(() => {});
    loadPdf().catch(() => {}); // warm up the PDF engine while the form is being filled
  }, []);

  // Draft
  // New report: protocol date = today, other dates empty (a pre-filled "today" in
  // e.g. "Data ważności legalizacji" would be wrong), "remember" fields prefilled.
  const buildEmptyDraft = useCallback((): ReportDraft => {
    const cf: Record<string, string> = {};
    const ts: Record<string, "done" | "fail" | "na"> = {};
    const remembered = getRememberedValues();
    const mainDate = mainDateFieldId(allFields);
    allFields.forEach((f) => {
      const mem = f.remember && remembered[f.id] ? remembered[f.id] : undefined;
      if (f.type === "date") cf[f.id] = mem ?? (f.id === mainDate ? todayISO() : "");
      else if (f.type === "tiles") {
        (f.tileOptions || []).forEach((t) => { ts[t.id] = "na"; });
      } else if (f.type === "table") cf[f.id] = initialTableValue(f);
      else if (!["photos", "signature", "heading", "info"].includes(f.type)) cf[f.id] = mem ?? "";
    });
    return { selectedTiles: [], tileStates: ts, tileNotes: {}, photos: [], photosByField: {}, signatures: {}, customFields: cf, reportNumber: "", templateId };
  }, [allFields, templateId]);

  // "Nowy na podstawie" — fields copied from a previous report, flagged until edited
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [reuseInfo, setReuseInfo] = useState<string | null>(null);

  // PDF ready sheet
  const [ready, setReady] = useState<{ blob: Blob; filename: string; subtitle: string } | null>(null);

  const [draft, setDraft] = useState<ReportDraft>(buildEmptyDraft);
  const [showResume, setShowResume] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval>>();
  const didCheckDraft = useRef(false);
  // set once the PDF is generated: the report is closed, nothing may write it back as a draft
  const finishedRef = useRef(false);
  const [resumeHasSignatures, setResumeHasSignatures] = useState(false);

  useEffect(() => {
    if (didCheckDraft.current) return;
    didCheckDraft.current = true;

    // Starting from a previous report ("Nowy na podstawie")?
    if (reuseParam) {
      try {
        const raw = sessionStorage.getItem("raporton_reuse");
        sessionStorage.removeItem("raporton_reuse");
        const payload = raw ? JSON.parse(raw) : null;
        if (payload?.draft) {
          const { draft: d, copiedIds: ids } = buildReuseDraft(allFields, buildEmptyDraft(), payload.draft);
          clearDraft();
          setDraft(d);
          setCopiedIds(new Set(ids));
          setReuseInfo(payload.label || "poprzedniego protokołu");
          setInitialized(true);
          return;
        }
      } catch { /* fall through to a normal start */ }
    }

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
      const empty = buildEmptyDraft();
      const fieldById = new Map(allFields.map((f) => [f.id, f] as [string, CustomFieldDef]));
      const hasContent = saved.selectedTiles.length > 0 || saved.photos.length > 0 ||
        Object.values(saved.photosByField || {}).some((arr) => arr.length > 0) ||
        Object.values(saved.tileStates || {}).some((v) => v !== "na") ||
        Object.values(saved.tileNotes || {}).some((v) => v?.trim()) ||
        Object.entries(saved.customFields).some(([id, v]) => {
          if (isTableValue(v)) return tableHasContent(v, fieldById.get(id));
          return !!v?.trim() && v !== (empty.customFields[id] ?? "") && v !== new Date().toISOString().split("T")[0];
        });
      if (saved.templateId === templateId && hasContent) {
        setResumeHasSignatures(Object.values(saved.signatures || {}).some((v) => !!v));
        setShowResume(true);
      } else { clearDraft(); setDraft(buildEmptyDraft()); setInitialized(true); }
    } else { setDraft(buildEmptyDraft()); setInitialized(true); }
  }, [templateId, buildEmptyDraft, draftParam, reuseParam, allFields]);

  // Interrupted report (call, closed browser…): data comes back, signatures don't —
  // the client signs again, so nobody can edit what was already signed.
  const handleResume = () => {
    const saved = getDraft();
    const d: ReportDraft = { ...saved, signatures: {} };
    saveDraft(d);
    setDraft(d);
    if (resumeHasSignatures) toast("Podpisy z przerwanego raportu zostały usunięte - zbierz je ponownie.");
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
    if (!draft.reportNumber && !draft.autoNumber) {
      getCloudNextReportNumber().then((num) => {
        setDraft((d) => ({ ...d, reportNumber: num, autoNumber: num }));
      }).catch(() => {});
    }
  }, [initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialized || finishedRef.current) return;
    autoSaveRef.current = setInterval(() => { if (!finishedRef.current) saveDraft(draft); }, 10_000);
    return () => clearInterval(autoSaveRef.current);
  }, [draft, initialized]);

  const update = useCallback((partial: Partial<ReportDraft>) => {
    setDraft((d) => { const next = { ...d, ...partial }; if (!finishedRef.current) saveDraft(next); return next; });
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

  const updateField = (id: string, value: string) => {
    if (copiedIds.has(id)) setCopiedIds((p) => { const n = new Set(p); n.delete(id); return n; });
    update({ customFields: { ...draft.customFields, [id]: value } });
  };

  // Quick picks for "Data następnego przeglądu" — counted from the protocol date
  const mainDateId = mainDateFieldId(allFields);
  const baseDate = (mainDateId && isISODate(draft.customFields[mainDateId]) ? draft.customFields[mainDateId] : todayISO());
  const NEXT_DATE_PICKS: { label: string; months: number }[] = [
    { label: "+1 mies.", months: 1 }, { label: "+6 mies.", months: 6 }, { label: "+1 rok", months: 12 }, { label: "+5 lat", months: 60 },
  ];
  const copiedTag = (id: string) => copiedIds.has(id)
    ? <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 align-middle"><History className="h-3 w-3" />z poprzedniego</span>
    : null;
  const updateSignature = (sigId: string, data: string | null) => update({ signatures: { ...draft.signatures, [sigId]: data } });

  // A typed-in number that already exists in history → ask before generating
  const [numberConflict, setNumberConflict] = useState<{ current: string; next: string; takenDate: string; takenClient: string } | null>(null);

  /**
   * Final report number. Hidden → none. An automatic number that was taken in the
   * meantime (another report generated, a "Dokończ później" draft) moves to the next
   * free one; a number typed by hand that already exists opens a question instead.
   */
  const resolveReportNumber = async (): Promise<string | null> => {
    if (hiddenFieldIds.has("__reportNumber")) return "";
    let num = (draft.reportNumber || "").trim();
    if (!num && !draft.autoNumber) num = await getCloudNextReportNumber().catch(() => "");
    if (!num) return "";

    const taken = await findReportByNumber(num).catch(() => null);
    if (!taken) return num;

    const next = await getCloudNextReportNumber().catch(() => "");
    if (num === draft.autoNumber && next) {
      update({ reportNumber: next, autoNumber: next });
      toast(`Numer ${num} był już zajęty, raport dostał numer ${next}.`);
      return next;
    }
    setNumberConflict({
      current: num,
      next,
      takenDate: isISODate(taken.date) ? formatDatePL(taken.date) : taken.date || "",
      takenClient: taken.clientName && taken.clientName !== "—" ? taken.clientName : "",
    });
    return null;
  };

  const handleGenerate = async (chosenNumber?: string) => {
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

      const reportNumber = chosenNumber ?? (await resolveReportNumber());
      if (reportNumber === null) { setGenerating(false); return; } // waiting for the answer in the dialog
      const finalDraft: ReportDraft = { ...draft, reportNumber };

      // Load profile from Supabase (use cached if available)
      const profile = cloudProfile || await getCloudProfile();

      // Watermark only on free plan (not trial, not solo)
      const watermark = limit.plan === "free";

      const { generateReportFile } = await loadPdf();
      const { meta, blob } = await generateReportFile(profile, finalDraft, {
        pdfTitle, templateName, fields: visibleFields, tiles: visibleTiles, signatureFields: visibleSignatureFields, showCompanyHeader, watermark,
      });

      // Save to Supabase
      const cloudId = await addCloudReport(meta);

      // Save snapshot — upload images to Storage, save lightweight data to DB
      const snapshotOptions = { pdfTitle, templateName, fields: visibleFields, tiles: visibleTiles, signatureFields: visibleSignatureFields, showCompanyHeader };
      uploadSnapshotImages(user!.id, cloudId, finalDraft, profile, snapshotOptions)
        .then((lightSnapshot) => saveCloudSnapshot(cloudId, lightSnapshot))
        .catch((e) => console.warn("Snapshot save failed:", e));

      // Increment report count for free plan
      incrementReportCount().catch(() => {});

      // Delete cloud draft if we were editing one
      if (cloudDraftId) deleteCloudDraft(cloudDraftId).catch(() => {});

      // "Zapamiętaj" fields (company data, certificates, instruments) prefill the next report
      rememberTemplateValues(allFields, draft.customFields);

      // the report is done: stop autosave for good and drop the local draft
      finishedRef.current = true;
      clearInterval(autoSaveRef.current);
      clearDraft();
      setReady({
        blob,
        filename: meta.filename,
        subtitle: [meta.clientName !== "—" ? meta.clientName : "", templateName].filter(Boolean).join(" • "),
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Błąd generowania PDF. Sprawdź internet i spróbuj ponownie.");
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
      // the cloud draft ("Dokończ później") is now the only copy — keep autosave from writing a local one back
      finishedRef.current = true;
      clearInterval(autoSaveRef.current);
      clearDraft();
      toast.success("Raport zapisany - dokończysz później");
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
    <div className="flex flex-col min-h-[100dvh] lg:h-[100dvh] bg-background">
      {/* Resume draft dialog */}
      <AlertDialog open={showResume} onOpenChange={setShowResume}>
        <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Niedokończony raport</AlertDialogTitle>
            <AlertDialogDescription>
              Masz niedokończony raport ({templateName}). Kontynuować?
              {resumeHasSignatures && " Dane wrócą, ale podpisy trzeba będzie zebrać ponownie."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNewDraft}>Zacznij od nowa</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>Kontynuuj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Typed-in report number already used */}
      <AlertDialog open={!!numberConflict} onOpenChange={(o) => { if (!o) setNumberConflict(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Numer {numberConflict?.current} już jest w historii</AlertDialogTitle>
            <AlertDialogDescription>
              Ma go raport{numberConflict?.takenDate ? ` z ${numberConflict.takenDate}` : ""}{numberConflict?.takenClient ? ` (${numberConflict.takenClient})` : ""}.
              {numberConflict?.next ? ` Następny wolny numer to ${numberConflict.next}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => { const n = numberConflict?.current || ""; setNumberConflict(null); handleGenerate(n); }}
            >
              Zostaw {numberConflict?.current}
            </AlertDialogCancel>
            {numberConflict?.next && (
              <AlertDialogAction
                onClick={() => {
                  const n = numberConflict.next;
                  setNumberConflict(null);
                  update({ reportNumber: n, autoNumber: n });
                  handleGenerate(n);
                }}
              >
                Użyj {numberConflict.next}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit reached modal */}
      <AlertDialog open={showLimitModal} onOpenChange={setShowLimitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Przejdź na Solo
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Na planie Free generujesz raporty bez limitu, ale każdy PDF ma znak wodny „RaportON.pl".
              </p>
              <p>
                Przejdź na plan <strong>Solo za 19 zł/miesiąc</strong>, aby generować raporty bez znaku wodnego.
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

      <header className="flex items-center gap-2 px-5 pt-6 pb-2 shrink-0 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate("/select-template")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-lg flex-1 truncate">{templateName}</h1>
        <button
          onClick={() => setShowCompanyHeader((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${showCompanyHeader ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"}`}
          title={showCompanyHeader ? "Dane firmy widoczne w PDF" : "Dane firmy ukryte w PDF"}
        >
          {showCompanyHeader ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{showCompanyHeader ? "Dane firmy widoczne" : "Dane firmy ukryte"}</span>
        </button>
        <Button variant="ghost" size="icon" onClick={handleClearDraft}><Trash2 className="h-5 w-5 text-destructive" /></Button>
      </header>

      {/* Mobile-only tab switch */}
      <div className="flex lg:hidden justify-center py-2 shrink-0 border-b border-border">
        <div className="flex rounded-full bg-muted p-0.5">
          <button
            onClick={() => setMobileView("fill")}
            className={`px-5 py-1.5 text-xs font-medium rounded-full transition-colors ${mobileView === "fill" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >Wypełniaj</button>
          <button
            onClick={() => setMobileView("preview")}
            className={`px-5 py-1.5 text-xs font-medium rounded-full transition-colors ${mobileView === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
          >Podgląd</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 lg:flex">
        {/* ===================== FORM COLUMN ===================== */}
        <div className={`flex-col min-h-0 lg:w-[54%] lg:border-r lg:border-border ${mobileView === "preview" ? "hidden lg:flex" : "flex lg:flex"}`}>
          <main className="flex-1 px-5 py-4 space-y-4 overflow-y-auto lg:min-h-0">
        {reuseInfo && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <History className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm flex-1">
              Dane klienta i urządzenia skopiowane z {reuseInfo}. Pola oznaczone <strong>„z poprzedniego"</strong> sprawdź przed wygenerowaniem - pomiary, oceny, czynności i podpisy zaczynają się od zera.
            </p>
            <button onClick={() => setReuseInfo(null)} className="p-1 -m-1 text-muted-foreground hover:text-foreground" aria-label="Zamknij informację">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Report number — editable, hideable */}
        {!hiddenFieldIds.has("__reportNumber") && (
        <div className="relative">
          <button
            onClick={() => toggleFieldVis("__reportNumber")}
            className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground z-10"
            title="Ukryj to pole"
          >
            <EyeOff className="h-4 w-4" />
          </button>
          <label className="text-sm font-medium mb-1.5 block">Numer raportu</label>
          <input
            type="text"
            className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
            value={draft.reportNumber || ""}
            onChange={(e) => update({ reportNumber: e.target.value })}
            placeholder="np. 001/2026"
          />
        </div>
        )}

        {visibleFields.map((field) => (
          <div key={field.id} ref={(el) => { fieldRefs.current[field.id] = el; }} className="relative scroll-mt-4">
            {/* Eye toggle */}
            <button
              onClick={() => toggleFieldVis(field.id)}
              className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-foreground z-10"
              title="Ukryj to pole"
            >
              <EyeOff className="h-4 w-4" />
            </button>

            {/* HEADING — static section header */}
            {field.type === "heading" ? (
              <div className="pt-2">
                <h3 className="text-base font-bold text-foreground border-b-2 border-accent/30 pb-1" style={textStyleToCss(field.labelStyle)}>{field.label}</h3>
              </div>

            /* INFO — static text block */
            ) : field.type === "info" ? (
              <div>
                {field.label && <h4 className="text-sm font-semibold text-foreground mb-1" style={textStyleToCss(field.labelStyle)}>{field.label}</h4>}
                {field.content && (
                  <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed" style={textStyleToCss(field.contentStyle)}>
                    {field.content}
                  </div>
                )}
              </div>

            /* TILES */
            ) : field.type === "tiles" ? (
              <div>
                <label className="text-sm font-medium mb-2 block pr-6" style={textStyleToCss(field.labelStyle)}>{field.label}</label>
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
                <label className="text-sm font-medium mb-2 block pr-6" style={textStyleToCss(field.labelStyle)}>{field.label}</label>
                <PhotoGallery photos={draft.photosByField[field.id] || []} onChange={(photos) => update({ photosByField: { ...draft.photosByField, [field.id]: photos } })} />
              </div>

            /* SIGNATURE */
            ) : field.type === "signature" ? (
              <div>
                <label className="text-sm font-medium mb-2 block pr-6" style={textStyleToCss(field.labelStyle)}>{field.label}</label>
                <SignatureCanvas
                  value={draft.signatures[field.id] || null}
                  onChange={(data) => updateSignature(field.id, data)}
                  label={field.label}
                />
              </div>

            /* TABLE */
            ) : field.type === "table" ? (
              <div>
                <label className="text-sm font-medium mb-1 block pr-6" style={textStyleToCss(field.labelStyle)}>
                  {field.label}{copiedTag(field.id)}
                </label>
                <TableFieldInput field={field} value={draft.customFields[field.id]} onChange={(raw) => updateField(field.id, raw)} />
              </div>

            /* TEXTAREA */
            ) : field.type === "textarea" ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6" style={textStyleToCss(field.labelStyle)}>
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                  {copiedTag(field.id)}
                </label>
                <div className="space-y-2">
                  <textarea className="w-full min-h-[80px] rounded-xl border border-border bg-card px-4 py-3 text-base focus:outline-none focus:border-accent resize-none" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                  <VoiceButton onResult={(text) => { const cur = draft.customFields[field.id] || ""; updateField(field.id, cur ? `${cur} ${text}` : text); }} />
                </div>
              </div>

            /* TEXT */
            ) : field.type === "text" ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6" style={textStyleToCss(field.labelStyle)}>
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                  {copiedTag(field.id)}
                </label>
                <div className="space-y-2">
                  <input type="text" className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                  <VoiceButton onResult={(text) => { updateField(field.id, text); }} />
                </div>
              </div>

            /* NUMBER / DATE */
            ) : (
              <div>
                <label className="text-sm font-medium mb-1.5 block pr-6" style={textStyleToCss(field.labelStyle)}>
                  {field.label}
                  {field.remember && <span className="text-xs text-muted-foreground ml-1">(zapamiętane)</span>}
                  {copiedTag(field.id)}
                </label>
                <input type={field.type === "number" ? "number" : "date"} className="w-full h-12 rounded-xl border border-border bg-card px-4 text-base focus:outline-none focus:border-accent" value={draft.customFields[field.id] || ""} onChange={(e) => updateField(field.id, e.target.value)} placeholder={field.label} />
                {field.type === "date" && isNextDateLabel(field.label) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-muted-foreground mr-0.5">od {formatDatePL(baseDate)}:</span>
                    {NEXT_DATE_PICKS.map((p) => {
                      const v = addMonthsISO(baseDate, p.months);
                      const on = draft.customFields[field.id] === v;
                      return (
                        <button
                          key={p.months}
                          type="button"
                          onClick={() => updateField(field.id, v)}
                          className={`h-8 rounded-lg px-2.5 text-xs font-medium border transition-colors ${on ? "bg-accent text-white border-accent" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Hidden fields indicator */}
        {hiddenFieldIds.size > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{hiddenFieldIds.size} ukrytych pól</span>
            <div className="flex gap-2 flex-wrap">
              {hiddenFieldIds.has("__reportNumber") && (
                <button onClick={() => toggleFieldVis("__reportNumber")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-card rounded px-2 py-1 border border-border">
                  <Eye className="h-3 w-3" /> Numer raportu
                </button>
              )}
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

          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-5 py-4 space-y-2 lg:static">
            <button onClick={() => handleGenerate()} disabled={generating || savingDraft} className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg disabled:opacity-50">
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />} {generating ? "Generuję..." : "Generuj PDF"}
            </button>
            <button onClick={handleSaveLater} disabled={savingDraft || generating} className="w-full h-10 rounded-xl border border-border text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-muted disabled:opacity-50">
              {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} {savingDraft ? "Zapisuję..." : "Dokończ później"}
            </button>
          </div>
        </div>

        {/* ===================== PREVIEW COLUMN ===================== */}
        <div className={`flex-col min-h-0 flex-1 bg-muted/30 ${mobileView === "fill" ? "hidden lg:flex" : "flex lg:flex"}`}>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-5" style={{ scrollbarGutter: "stable" }}>
            <TemplatePreview
              mode="fill"
              pdfTitle={pdfTitle}
              fields={visibleFields}
              showCompanyHeader={showCompanyHeader}
              profile={cloudProfile}
              watermark={isFreePlan}
              reportNumber={hiddenFieldIds.has("__reportNumber") ? "" : draft.reportNumber}
              values={draft.customFields}
              tileStates={draft.tileStates || {}}
              tileNotes={draft.tileNotes || {}}
              signatures={draft.signatures}
              photosByField={draft.photosByField}
              additionalNotes={draft.additionalNotes}
              onFieldClick={jumpToField}
            />
          </div>
        </div>
      </div>

      <ReportReadySheet
        open={!!ready}
        blob={ready?.blob ?? null}
        filename={ready?.filename ?? ""}
        subtitle={ready?.subtitle}
        closeLabel="Wróć na pulpit"
        onClose={() => { clearDraft(); setReady(null); navigate("/"); }}
      />
    </div>
  );
}
