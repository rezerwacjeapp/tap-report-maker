import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { CompanyProfile, ReportDraft, TextStyle } from "./storage";
import { getTiles, getCustomFields } from "./storage";

// Register Roboto font (includes Polish: ą, ę, ś, ź, ć, ł, ó, ż, ń)
try {
  const vfs = (pdfFonts as any)?.pdfMake?.vfs ?? pdfFonts;
  (pdfMake as any).vfs = vfs;
} catch {
  console.warn("Could not load pdfmake fonts");
}

const COLORS = {
  primary: "#1e2a38",
  accent: "#2f9e6e",
  lightBg: "#f3f4f6",
  white: "#ffffff",
  gray: "#6b7280",
};

/** Build a pdfmake label object with optional TextStyle overrides.
 *  When labelStyle is provided, we skip the named style to avoid conflicts
 *  (e.g. fieldLabel has bold:true by default, making bold toggle invisible). */
const buildStyledLabel = (text: string, baseStyle: string, style?: TextStyle, extra?: any): any => {
  if (!style) return { text, style: baseStyle, ...extra };
  // Resolve base style properties manually
  const STYLE_DEFAULTS: Record<string, any> = {
    fieldLabel: { fontSize: 9, bold: true, color: COLORS.gray },
    sectionHeader: { fontSize: 11, bold: true, color: COLORS.primary },
  };
  const base = STYLE_DEFAULTS[baseStyle] || {};
  return {
    text,
    fontSize: style.bold ? base.fontSize + 1 : base.fontSize,
    color: style.color || base.color,
    bold: style.bold ?? base.bold ?? false,
    italics: style.italic || false,
    ...extra,
  };
};

export interface GeneratedReport {
  id: string;
  filename: string;
  date: string;
  clientName: string;
  templateName: string;
  templateId?: string;
  pdfTitle?: string;
  reportNumber?: string;
  selectedTiles: string[];
  tileLabels: string[];
  customFields: Record<string, string>;
  fieldLabels: Record<string, string>;
  signatures: Record<string, string | null>;
  signatureLabels: Record<string, string>;
  photosCount: number;
  hasPhotos: boolean;
}

export interface TemplateOptions {
  pdfTitle: string;
  templateName: string;
  fields: import("./storage").CustomFieldDef[];
  tiles: import("./storage").TileItem[];
  signatureFields: { id: string; label: string }[];
  showCompanyHeader?: boolean;
}

export function generateReport(
  profile: CompanyProfile,
  draft: ReportDraft,
  options?: TemplateOptions,
): GeneratedReport {
  const customFields = options?.fields ?? getCustomFields();
  const allTiles = options?.tiles ?? getTiles();
  const pdfTitle = options?.pdfTitle ?? "RAPORT SERWISOWY";
  const templateName = options?.templateName ?? "Raport serwisowy";
  const signatureFields = options?.signatureFields ?? [{ id: "sig_client", label: "Podpis klienta" }];
  const showCompanyHeader = options?.showCompanyHeader !== false;

  // Derive selected tiles from tileStates (done) or legacy selectedTiles
  const tileStates = draft.tileStates || {};
  const effectiveSelectedTiles = Object.keys(tileStates).length > 0
    ? Object.entries(tileStates).filter(([, s]) => s === "done").map(([id]) => id)
    : draft.selectedTiles;

  const selectedLabels = effectiveSelectedTiles
    .map((id) => allTiles.find((t) => t.id === id)?.label)
    .filter(Boolean) as string[];

  // Build filename
  const firstTextField = customFields.find(
    (f) => f.type === "text" && draft.customFields[f.id]?.trim()
  );
  const dateField = customFields.find(
    (f) => f.type === "date" && draft.customFields[f.id]?.trim()
  );
  const namepart = firstTextField
    ? draft.customFields[firstTextField.id].replace(/\s+/g, "_").replace(/[^a-zA-Z0-9ąęśźćłóżńĄĘŚŹĆŁÓŻŃ_-]/g, "")
    : "serwis";
  const datepart = dateField
    ? draft.customFields[dateField.id]
    : new Date().toISOString().split("T")[0];
  const filename = `raport_${namepart}_${datepart}.pdf`;

  // Report number
  const reportNum = draft.reportNumber || `${new Date().getFullYear()}`;

  // Generation date for footer (frozen at generation time)
  const generationDate = new Date().toLocaleDateString("pl-PL");

  // --- Build PDF content ---
  const content: any[] = [];

  // === HEADER ===
  const profileFields = profile.fields || [];

  if (showCompanyHeader) {
    const headerCols: any[] = [];

    if (profile.logo) {
      headerCols.push({
        image: profile.logo,
        width: 50,
        height: 50,
      });
    }

    // Build header text from profile fields
    const firstField = profileFields[0];
    const restFields = profileFields.slice(1).filter((f) => f.value?.trim());

    headerCols.push({
      stack: [
        { text: firstField?.value || "Firma", style: "companyName" },
        ...restFields.map((f) => ({
          text: f.label ? `${f.label}: ${f.value}` : f.value,
          style: "companyDetail",
        })),
      ],
      width: "*",
      margin: [profile.logo ? 10 : 0, 2, 0, 0] as [number, number, number, number],
    });

    content.push({ columns: headerCols, margin: [0, 0, 0, 8] as [number, number, number, number] });
  }

  // Accent line
  content.push({
    canvas: [{
      type: "line", x1: 0, y1: 0, x2: 515, y2: 0,
      lineWidth: 2, lineColor: COLORS.accent,
    }],
    margin: [0, 0, 0, 12] as [number, number, number, number],
  });

  // Title row
  content.push({
    columns: [
      { text: pdfTitle, style: "title", width: "*" },
      { text: reportNum, style: "reportNumber", width: "auto", alignment: "right" as const },
    ],
    margin: [0, 0, 0, 16] as [number, number, number, number],
  });

  // === CONTENT IN FIELD ORDER ===
  // Collect consecutive data fields into a table, then flush when we hit a special type
  let pendingDataRows: any[][] = [];

  const flushDataRows = () => {
    if (pendingDataRows.length === 0) return;
    content.push({
      table: { widths: [130, "*"], body: [...pendingDataRows] },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#e5e7eb",
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 12] as [number, number, number, number],
    });
    pendingDataRows = [];
  };

  customFields.forEach((field) => {
    // --- HEADING (static section header) ---
    if (field.type === "heading") {
      flushDataRows();
      content.push(buildStyledLabel(field.label, "sectionHeader", field.labelStyle, {
        margin: [0, 10, 0, 6] as [number, number, number, number],
      }));
      return;
    }

    // --- INFO (static text block) ---
    if (field.type === "info") {
      flushDataRows();
      const infoStack: any[] = [];
      if (field.label) {
        const ls = field.labelStyle;
        infoStack.push({
          text: field.label,
          bold: ls?.bold ?? true,
          italics: ls?.italic || false,
          color: ls?.color || COLORS.primary,
          fontSize: 10,
          margin: [4, 6, 0, 4] as [number, number, number, number],
        });
      }
      if (field.content) {
        const cs = field.contentStyle;
        infoStack.push({
          text: field.content,
          bold: cs?.bold || false,
          italics: cs?.italic || false,
          color: cs?.color || COLORS.gray,
          fontSize: 9,
          lineHeight: 1.4,
          margin: [4, 0, 0, 8] as [number, number, number, number],
        });
      }
      if (infoStack.length > 0) {
        content.push({ stack: infoStack });
      }
      return;
    }

    // --- DATA FIELDS (text, textarea, date, number) ---
    if (["text", "textarea", "date", "number"].includes(field.type)) {
      const value = draft.customFields[field.id];
      if (!value?.trim()) return;

      if (field.type === "textarea") {
        pendingDataRows.push([
          buildStyledLabel(field.label, "fieldLabel", field.labelStyle, { colSpan: 2, border: [false, false, false, false] }), {},
        ]);
        pendingDataRows.push([
          { text: value, style: "fieldValue", colSpan: 2, border: [false, false, false, true], margin: [0, 0, 0, 4] as [number, number, number, number] }, {},
        ]);
      } else {
        pendingDataRows.push([
          buildStyledLabel(field.label, "fieldLabel", field.labelStyle, { border: [false, false, false, true] }),
          { text: value, style: "fieldValue", border: [false, false, false, true] },
        ]);
      }
      return;
    }

    // --- TILES FIELD: show ALL options with ✔/✗ ---
    if (field.type === "tiles" && field.tileOptions?.length) {
      flushDataRows();

      const body: any[][] = [
        [
          { text: "Lp.", style: "tableHeader", fillColor: COLORS.primary },
          { text: "Opis czynności", style: "tableHeader", fillColor: COLORS.primary },
          { text: "Status", style: "tableHeader", fillColor: COLORS.primary, alignment: "center" as const },
        ],
      ];

      const tileStates = draft.tileStates || {};
      const tileNotes = draft.tileNotes || {};

      (field.tileOptions || []).forEach((tile, i) => {
        // Determine state: new tileStates > legacy selectedTiles > default "na"
        let state: "done" | "fail" | "na" = "na";
        if (tileStates[tile.id]) {
          state = tileStates[tile.id];
        } else if (draft.selectedTiles.includes(tile.id)) {
          state = "done";
        }

        const bg = i % 2 === 0 ? COLORS.lightBg : COLORS.white;
        const statusText = state === "done" ? "TAK" : state === "fail" ? "NIE" : "nd.";

        body.push([
          { text: `${i + 1}`, style: "tableCell", fillColor: bg, alignment: "center" as const },
          { text: tile.label, style: "tableCell", fillColor: bg },
          {
            text: statusText,
            style: "tableCell", fillColor: bg, alignment: "center" as const,
            color: "#18181b",
            bold: true,
          },
        ]);

        // Add notes row if present
        const note = tileNotes[tile.id];
        if (note?.trim()) {
          body.push([
            { text: "", fillColor: bg },
            { text: note, style: "tableCell", fillColor: bg, italics: true, color: COLORS.gray, colSpan: 2 },
            {},
          ]);
        }
      });

      // Wrap header + table in unbreakable stack so they don't split across pages
      content.push({
        stack: [
          buildStyledLabel(field.label, "sectionHeader", field.labelStyle, { margin: [0, 4, 0, 8] as [number, number, number, number] }),
          {
            table: { headerRows: 1, widths: [30, "*", 45], body },
            layout: {
              hLineWidth: () => 0.5, vLineWidth: () => 0.5,
              hLineColor: () => "#d1d5db", vLineColor: () => "#d1d5db",
            },
          },
        ],
        unbreakable: true,
        margin: [0, 0, 0, 12] as [number, number, number, number],
      });
      return;
    }

    // --- PHOTOS ---
    if (field.type === "photos") {
      const fieldPhotos = (draft.photosByField || {})[field.id] || draft.photos || [];
      if (fieldPhotos.length === 0) return;
      flushDataRows();

      // Each photo pair is wrapped as unbreakable so a single row of photos
      // never splits across pages. The section header stays with the first pair.
      for (let i = 0; i < fieldPhotos.length; i += 2) {
        const cols: any[] = [
          { image: fieldPhotos[i], width: 240, height: 180, margin: [0, 0, 5, 5] as [number, number, number, number] },
        ];
        if (fieldPhotos[i + 1]) {
          cols.push({ image: fieldPhotos[i + 1], width: 240, height: 180, margin: [5, 0, 0, 5] as [number, number, number, number] });
        } else {
          cols.push({ text: "", width: 240 });
        }

        const photoRow: any[] = [{ columns: cols }];

        // First pair gets the section header attached
        if (i === 0) {
          photoRow.unshift({ text: field.label || "Dokumentacja fotograficzna", style: "sectionHeader", margin: [0, 4, 0, 8] as [number, number, number, number] });
        }

        content.push({
          stack: photoRow,
          unbreakable: true,
          margin: [0, 0, 0, 4] as [number, number, number, number],
        });
      }
      content.push({ text: "", margin: [0, 0, 0, 4] as [number, number, number, number] });
      return;
    }

    // --- SIGNATURE ---
    if (field.type === "signature") {
      const sigData = (draft.signatures || {})[field.id];
      flushDataRows();

      const sigStack: any[] = [
        { text: field.label, style: "sectionHeader", margin: [0, 8, 0, 6] as [number, number, number, number] },
      ];

      if (sigData) {
        // Signed digitally — show image
        sigStack.push({ image: sigData, width: 150, height: 75 });
      } else {
        // Empty — leave blank space for pen signature
        sigStack.push({ text: "", margin: [0, 0, 0, 55] as [number, number, number, number] });
      }

      sigStack.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: COLORS.primary }],
        margin: [0, 2, 0, 8] as [number, number, number, number],
      });

      content.push({ stack: sigStack, unbreakable: true });
    }
  });

  // Flush any remaining data rows
  flushDataRows();

  // === ADDITIONAL NOTES (ad-hoc, not part of template) ===
  if (draft.additionalNotes?.trim()) {
    content.push({
      stack: [
        { text: "Uwagi dodatkowe", style: "sectionHeader", margin: [0, 4, 0, 8] as [number, number, number, number] },
        { text: draft.additionalNotes.trim(), style: "fieldValue" },
      ],
      unbreakable: true,
      margin: [0, 0, 0, 12] as [number, number, number, number],
    });
  }

  // === DOCUMENT DEFINITION ===
  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 55],
    content,
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Wygenerowano: ${generationDate} • ${profileFields[0]?.value || "RaportON"}`, style: "footer", alignment: "left" as const },
        { text: `Strona ${currentPage} z ${pageCount}`, style: "footer", alignment: "right" as const },
      ],
      margin: [40, 12, 40, 0] as [number, number, number, number],
    }),
    styles: {
      companyName: { fontSize: 16, bold: true, color: COLORS.primary },
      companyDetail: { fontSize: 9, color: COLORS.gray, lineHeight: 1.3 },
      title: { fontSize: 14, bold: true, color: COLORS.primary },
      reportNumber: { fontSize: 9, color: COLORS.gray, margin: [0, 4, 0, 0] as [number, number, number, number] },
      sectionHeader: { fontSize: 11, bold: true, color: COLORS.primary },
      fieldLabel: { fontSize: 9, bold: true, color: COLORS.gray },
      fieldValue: { fontSize: 10, color: COLORS.primary },
      tableHeader: { fontSize: 9, bold: true, color: COLORS.white },
      tableCell: { fontSize: 10 },
      footer: { fontSize: 7, color: COLORS.gray },
    },
    defaultStyle: { font: "Roboto" },
  };

  // Build metadata for report history
  const clientField = customFields.find(
    (f) => f.id === "df_client" || f.id.includes("_client") || f.label.toLowerCase().includes("klient") || f.label.toLowerCase().includes("zleceniodawca")
  );
  const clientName = clientField ? draft.customFields[clientField.id] || "—" : "—";

  // Build label maps for history display
  const fieldLabels: Record<string, string> = {};
  customFields.forEach((f) => { fieldLabels[f.id] = f.label; });

  const signatureLabels: Record<string, string> = {};
  const draftSignatures: Record<string, string | null> = (draft as any).signatures ?? {};
  signatureFields.forEach((sf) => { signatureLabels[sf.id] = sf.label; });

  const meta: GeneratedReport = {
    id: Date.now().toString(),
    filename,
    date: datepart,
    clientName,
    templateName,
    templateId: draft.templateId,
    pdfTitle,
    reportNumber: reportNum,
    selectedTiles: [...effectiveSelectedTiles],
    tileLabels: selectedLabels,
    customFields: { ...draft.customFields },
    fieldLabels,
    signatures: { ...draftSignatures },
    signatureLabels,
    photosCount: Object.values(draft.photosByField || {}).reduce((sum, arr) => sum + arr.length, 0) || draft.photos.length,
    hasPhotos: Object.values(draft.photosByField || {}).some((arr) => arr.length > 0) || draft.photos.length > 0,
  };

  // Download PDF
  pdfMake.createPdf(docDefinition).download(filename);

  return meta;
}

/**
 * Regenerate PDF from history item (without photos)
 */
export function regenerateFromHistory(
  profile: CompanyProfile,
  item: import("./storage").ReportHistoryItem
) {
  // Build fields from fieldLabels
  const fields = Object.entries(item.fieldLabels || {}).map(([id, label], i) => ({
    id, label, type: "text" as const, remember: false, order: i,
  }));

  // Build tiles from tileLabels
  const tiles = (item.tileLabels || []).map((label, i) => ({
    id: item.selectedTiles[i] || `t_${i}`, label,
  }));

  // Build signature fields from signatureLabels
  const signatureFields = Object.entries(item.signatureLabels || {}).map(([id, label]) => ({ id, label }));

  // Build a fake draft
  const draft: ReportDraft = {
    selectedTiles: item.selectedTiles,
    photos: [],
    photosByField: {},
    signatures: item.signatures || {},
    customFields: item.customFields,
    reportNumber: item.reportNumber,
    templateId: item.templateId,
  };

  generateReport(profile, draft, {
    pdfTitle: item.pdfTitle || item.templateName.toUpperCase(),
    templateName: item.templateName,
    fields,
    tiles,
    signatureFields,
  });
}
