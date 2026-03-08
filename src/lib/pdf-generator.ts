import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { CompanyProfile, ReportDraft } from "./storage";
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

export interface GeneratedReport {
  id: string;
  filename: string;
  date: string;
  clientName: string;
  templateName: string;
  selectedTiles: string[];
  customFields: Record<string, string>;
  photosCount: number;
  hasSignature: boolean;
}

export interface TemplateOptions {
  pdfTitle: string;
  templateName: string;
  fields: import("./storage").CustomFieldDef[];
  tiles: import("./storage").TileItem[];
}

export function generateReport(
  profile: CompanyProfile,
  draft: ReportDraft,
  options?: TemplateOptions
): GeneratedReport {
  const customFields = options?.fields ?? getCustomFields();
  const allTiles = options?.tiles ?? getTiles();
  const pdfTitle = options?.pdfTitle ?? "RAPORT SERWISOWY";
  const templateName = options?.templateName ?? "Raport serwisowy";
  const selectedLabels = draft.selectedTiles
    .map((id) => allTiles.find((t) => t.id === id)?.label)
    .filter(Boolean) as string[];

  const filledFields = customFields.filter(
    (f) => draft.customFields[f.id]?.trim()
  );

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
  const reportNum = `RS/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`;

  // --- Build PDF content ---
  const content: any[] = [];

  // === HEADER ===
  const headerCols: any[] = [];

  if (profile.logo) {
    headerCols.push({
      image: profile.logo,
      width: 50,
      height: 50,
    });
  }

  headerCols.push({
    stack: [
      { text: profile.companyName || "Firma", style: "companyName" },
      ...(profile.nip ? [{ text: `NIP: ${profile.nip}`, style: "companyDetail" }] : []),
      ...(profile.address ? [{ text: profile.address, style: "companyDetail" }] : []),
    ],
    width: "*",
    margin: [profile.logo ? 10 : 0, 2, 0, 0] as [number, number, number, number],
  });

  content.push({ columns: headerCols, margin: [0, 0, 0, 8] as [number, number, number, number] });

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

  // === CUSTOM FIELDS ===
  if (filledFields.length > 0) {
    const rows: any[][] = [];

    filledFields.forEach((field) => {
      const value = draft.customFields[field.id];
      if (field.type === "textarea") {
        rows.push([
          { text: field.label, style: "fieldLabel", colSpan: 2, border: [false, false, false, false] }, {},
        ]);
        rows.push([
          { text: value, style: "fieldValue", colSpan: 2, border: [false, false, false, true], margin: [0, 0, 0, 4] as [number, number, number, number] }, {},
        ]);
      } else {
        rows.push([
          { text: field.label, style: "fieldLabel", border: [false, false, false, true] },
          { text: value, style: "fieldValue", border: [false, false, false, true] },
        ]);
      }
    });

    content.push({
      table: { widths: [130, "*"], body: rows },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#e5e7eb",
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 16] as [number, number, number, number],
    });
  }

  // === ACTIVITIES TABLE ===
  if (selectedLabels.length > 0) {
    content.push({ text: "Wykonane czynności", style: "sectionHeader", margin: [0, 0, 0, 8] as [number, number, number, number] });

    const body: any[][] = [
      [
        { text: "Lp.", style: "tableHeader", fillColor: COLORS.primary },
        { text: "Opis czynności", style: "tableHeader", fillColor: COLORS.primary },
        { text: "Status", style: "tableHeader", fillColor: COLORS.primary, alignment: "center" as const },
      ],
    ];

    selectedLabels.forEach((label, i) => {
      const bg = i % 2 === 0 ? COLORS.lightBg : COLORS.white;
      body.push([
        { text: `${i + 1}`, style: "tableCell", fillColor: bg, alignment: "center" as const },
        { text: label, style: "tableCell", fillColor: bg },
        { text: "✔", style: "tableCell", fillColor: bg, alignment: "center" as const, color: COLORS.accent, bold: true },
      ]);
    });

    content.push({
      table: { headerRows: 1, widths: [30, "*", 45], body },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => "#d1d5db",
        vLineColor: () => "#d1d5db",
      },
      margin: [0, 0, 0, 16] as [number, number, number, number],
    });
  }

  // === PHOTOS ===
  if (draft.photos.length > 0) {
    content.push({ text: "Dokumentacja fotograficzna", style: "sectionHeader", margin: [0, 0, 0, 8] as [number, number, number, number] });

    for (let i = 0; i < draft.photos.length; i += 2) {
      const cols: any[] = [
        { image: draft.photos[i], width: 240, height: 180, margin: [0, 0, 5, 5] as [number, number, number, number] },
      ];
      if (draft.photos[i + 1]) {
        cols.push({ image: draft.photos[i + 1], width: 240, height: 180, margin: [5, 0, 0, 5] as [number, number, number, number] });
      } else {
        cols.push({ text: "", width: 240 });
      }
      content.push({ columns: cols });
    }

    content.push({ text: "", margin: [0, 0, 0, 10] as [number, number, number, number] });
  }

  // === SIGNATURE ===
  if (draft.signature) {
    content.push({ text: "Podpis klienta", style: "sectionHeader", margin: [0, 10, 0, 6] as [number, number, number, number] });
    content.push({ image: draft.signature, width: 150, height: 75 });
    content.push({
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 0.5, lineColor: COLORS.primary }],
      margin: [0, 2, 0, 0] as [number, number, number, number],
    });
  }

  // === DOCUMENT DEFINITION ===
  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 55],
    content,
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        { text: `Wygenerowano: ${new Date().toLocaleDateString("pl-PL")} • ${profile.companyName || "DocSwift"}`, style: "footer", alignment: "left" as const },
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

  pdfMake.createPdf(docDefinition).download(filename);

  // Build metadata for report history
  const clientField = customFields.find(
    (f) => f.id === "df_client" || f.label.toLowerCase().includes("klient")
  );
  const clientName = clientField ? draft.customFields[clientField.id] || "—" : "—";

  return {
    id: Date.now().toString(),
    filename,
    date: datepart,
    clientName,
    templateName,
    selectedTiles: [...draft.selectedTiles],
    customFields: { ...draft.customFields },
    photosCount: draft.photos.length,
    hasSignature: !!draft.signature,
  };
}

/**
 * Share PDF via Web Share API (mobile) or download fallback
 */
export async function shareReport(
  profile: CompanyProfile,
  draft: ReportDraft
): Promise<GeneratedReport> {
  const customFields = getCustomFields();
  const dateField = customFields.find((f) => f.type === "date" && draft.customFields[f.id]?.trim());
  const firstTextField = customFields.find((f) => f.type === "text" && draft.customFields[f.id]?.trim());
  const namepart = firstTextField
    ? draft.customFields[firstTextField.id].replace(/\s+/g, "_").replace(/[^a-zA-Z0-9ąęśźćłóżńĄĘŚŹĆŁÓŻŃ_-]/g, "")
    : "serwis";
  const datepart = dateField
    ? draft.customFields[dateField.id]
    : new Date().toISOString().split("T")[0];
  const filename = `raport_${namepart}_${datepart}.pdf`;

  // Build the same doc definition but get blob instead of downloading
  const meta = generateReport(profile, draft);

  // Try Web Share API
  if (navigator.share && navigator.canShare) {
    try {
      // We need to regenerate to get blob — for now, the download already happened
      // Future: refactor to get blob first, then decide share vs download
    } catch {
      // Fallback: download already happened
    }
  }

  return meta;
}
