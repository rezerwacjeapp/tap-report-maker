import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { CompanyProfile, ReportDraft, TextStyle, CustomFieldDef } from "./storage";
import { getTiles, getCustomFields } from "./storage";
import { parseTable, tableColumns, filledRows, serializeTable, colsSnapshot } from "./table-field";

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

/**
 * Watermark colors: COLORS.primary and COLORS.accent at 13% on white, as solid colors.
 * SVG opacity becomes a PDF transparency group, which some phone PDF viewers skip,
 * so the watermark vanished there. Drawn behind the content it looks the same.
 */
const WATERMARK_COLORS = { primary: "#e2e3e5", accent: "#e4f2ec" };

/** A4 (595 × 842 pt) minus 40 pt side margins. */
const CONTENT_W = 515;

/** A4 height (842 pt) minus the 40 pt top and 55 pt bottom margins. */
const CONTENT_H = 746;

/**
 * pdfmake 0.3 drops an unbreakable block that is taller than a page - the whole block,
 * not just the overflow - so a block is kept in one piece only while its estimated
 * height is safely below a page.
 */
const KEEP_H = CONTENT_H * 0.75;

/** Height of a signature block (label, image or blank space, line, name). */
const SIGNATURE_H = 140;

/** Top page margin: pdfmake measures positions on a page from its top edge. */
const PAGE_TOP = 40;

/**
 * How a block of the PDF may be split across pages, for keeping headings with what follows:
 * head - a section heading; whole - unbreakable and shorter than a page; rows - data rows
 * (label + value), `keep` when no row may split; table - header repeated on every page;
 * text - flows on to the next page. height: the whole block, first: the part of it that
 * has to fit under a heading (pt, estimated).
 */
interface Block {
  kind: "head" | "whole" | "rows" | "table" | "text";
  height: number;
  first: number;
  keep?: boolean;
}

/** Roboto in pdfmake has no "→" — swap it for a glyph it has, so the PDF shows no empty boxes. */
const pdfSafe = (t: string) => (t || "").replace(/\u2192/g, "›");

/**
 * Advance widths of the PDF font for ASCII 32-126, in 1/1000 em rounded up: Roboto Regular
 * and Roboto Medium (the face pdfmake uses for bold), from the fonts in pdfmake's vfs_fonts.
 */
const ROBOTO_W = [
  249, 258, 321, 616, 563, 733, 623, 175, 343, 349, 431, 568, 197, 277, 264, 413, 563, 563, 563, 563, 563, 563, 563, 563,
  563, 563, 243, 212, 509, 549, 523, 473, 898, 653, 624, 651, 657, 569, 553, 682, 714, 272, 552, 628, 539, 874, 714, 688,
  631, 688, 617, 594, 597, 649, 637, 888, 627, 601, 600, 266, 411, 266, 418, 452, 310, 544, 562, 524, 564, 531, 348, 562,
  551, 244, 240, 507, 244, 877, 553, 571, 562, 569, 339, 517, 328, 552, 485, 752, 497, 474, 497, 339, 245, 339, 681,
];
const ROBOTO_BOLD_W = [
  249, 265, 320, 604, 569, 737, 642, 168, 347, 350, 444, 556, 224, 340, 278, 391, 569, 569, 569, 569, 569, 569, 569, 569,
  569, 569, 264, 240, 509, 563, 520, 487, 897, 664, 632, 653, 653, 565, 551, 682, 710, 284, 556, 632, 541, 875, 710, 689,
  639, 689, 630, 606, 610, 655, 646, 881, 632, 611, 604, 272, 417, 272, 429, 448, 321, 540, 563, 522, 564, 536, 354, 567,
  556, 255, 251, 522, 255, 872, 557, 568, 563, 566, 354, 515, 334, 557, 497, 743, 503, 490, 503, 334, 249, 334, 663,
];
/** Other characters used in reports: [regular, bold]. */
const EXTRA_W: Record<string, [number, number]> = {
  "ł": [271, 291], "Ł": [539, 549], "–": [657, 643], "—": [781, 771], "…": [669, 709], "°": [374, 383],
  "µ": [567, 595], "×": [534, 533], "≤": [509, 509], "≥": [523, 520], "Δ": [706, 720], "²": [367, 370],
  "³": [367, 370], "„": [345, 375], "”": [358, 385], "“": [354, 381], "‘": [201, 219], "’": [201, 216],
  "•": [338, 350], "±": [535, 537], "§": [614, 622], "€": [563, 569],
};
/** Any other character counts as the widest ASCII glyph ("@"), so its width is never underestimated. */
const OTHER_W = 900;
/** Roboto line height (ascent + descent) in em. */
const LINE_EM = 1.172;

/** Printed width (pt) of `text` on one line. Accented letters measure as their base letter. */
function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? ROBOTO_BOLD_W : ROBOTO_W;
  let w = 0;
  for (const ch of (text || "").normalize("NFD")) {
    const c = ch.charCodeAt(0);
    if (c >= 0x300 && c <= 0x36f) continue; // combining accent
    w += c >= 32 && c <= 126 ? table[c - 32] : EXTRA_W[ch]?.[bold ? 1 : 0] ?? OTHER_W;
  }
  return (w * size) / 1000;
}

/**
 * Height (pt) of `text` wrapped in a box `width` pt wide: words are laid out line by line
 * the way the PDF does it (a word longer than a line takes several lines), rounded up.
 */
function textHeight(text: string, size: number, width: number, bold = false, lineHeight = 1): number {
  const room = Math.max(width - 1, 1);
  const space = textWidth(" ", size, bold);
  let lines = 0;
  for (const para of (text || "").split("\n")) {
    let n = 1;
    let line = 0;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const w = textWidth(word, size, bold);
      if (line > 0 && line + space + w <= room) { line += space + w; continue; }
      const k = Math.max(1, Math.ceil(w / room)); // lines this word takes
      if (line > 0) n++;
      n += k - 1;
      line = w - (k - 1) * room;
    }
    lines += n;
  }
  return lines * size * LINE_EM * lineHeight;
}

/**
 * Column widths for a table field: sized to the longest content (header words
 * may wrap), then stretched or squeezed to the page width — text columns take
 * the slack, so short codes like "B16" don't get as much room as circuit names.
 * Measured with the font's real letter widths, bold where the PDF prints bold
 * (headers and choice values), so a word like "Recommended" is never broken in two.
 */
function tableWidths(cols: import("./storage").TableColumnDef[], rows: Record<string, string>[], fontSize: number, avail: number): number[] {
  const isText = (c: import("./storage").TableColumnDef) => !c.kind || c.kind === "text";
  const longestWord = (s: string, bold: boolean) => Math.max(0, ...s.split(/\s+/).map((w) => textWidth(w, fontSize, bold)));
  // narrowest width that breaks no word of the header or of a cell (whole points, as returned)
  const wordW = cols.map((c) => Math.min(Math.ceil(Math.max(longestWord(c.label, true),
    ...rows.map((r) => longestWord((r[c.id] ?? "").toString(), c.kind === "choice"))) + 0.1), 230));
  const minW = wordW.map((x) => x + 2); // with a little room to spare
  const natural = cols.map((c, i) => {
    const cellMax = Math.max(0, ...rows.map((r) => textWidth((r[c.id] ?? "").toString(), fontSize, c.kind === "choice")));
    const words = c.label.split(/\s+/).map((w) => textWidth(w, fontSize, true));
    // non-text columns keep room for about 8 characters of their header (as before: 4 em + 10 pt)
    const header = isText(c) ? Math.max(0, ...words) : Math.min(textWidth(c.label, fontSize, true), Math.max(...words, fontSize * 4 + 7));
    return Math.max(Math.min(Math.max(Math.max(cellMax, header) + 3, 26), 230), minW[i]);
  });
  const total = natural.reduce((a, b) => a + b, 0);
  const textIdx = cols.map((c, i) => (isText(c) ? i : -1)).filter((i) => i >= 0);
  const grow = textIdx.length ? textIdx : cols.map((_, i) => i);
  const w = [...natural];
  if (total < avail) {
    const growTotal = grow.reduce((a, i) => a + natural[i], 0);
    grow.forEach((i) => { w[i] += (avail - total) * (natural[i] / growTotal); });
  } else if (total > avail) {
    // text columns share what the others leave, in proportion to their content,
    // but none gets narrower than its longest word while there is room for that
    const fixed = cols.reduce((a, _, i) => a + (grow.includes(i) ? 0 : natural[i]), 0);
    let room = Math.max(avail - fixed, grow.length * 30);
    let open = [...grow];
    while (open.length) {
      const share = room / open.reduce((a, i) => a + natural[i], 0);
      const tight = open.filter((i) => natural[i] * share < minW[i]);
      if (!tight.length) { open.forEach((i) => { w[i] = natural[i] * share; }); break; }
      tight.forEach((i) => { w[i] = minW[i]; room -= minW[i]; });
      open = open.filter((i) => !tight.includes(i));
    }
    // still too wide: every column gives up room it has beyond its longest word
    for (const floor of [minW, wordW]) {
      const excess = w.reduce((a, b) => a + b, 0) - avail;
      const slack = w.map((x, i) => Math.max(0, x - floor[i]));
      const slackTotal = slack.reduce((a, b) => a + b, 0);
      if (excess > 0 && slackTotal > 0) w.forEach((_, i) => { w[i] -= slack[i] * Math.min(1, excess / slackTotal); });
    }
    // more columns than the page can hold: everything shrinks
    const sum = w.reduce((a, b) => a + b, 0);
    if (sum > avail) w.forEach((_, i) => { w[i] *= avail / sum; });
  }
  return w.map((x) => Math.floor(x));
}

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
    alignment: style.align || undefined,
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
  watermark?: boolean;
}

/** Builds the pdfmake document + history metadata. No side effects. */
export function buildReportDocument(
  profile: CompanyProfile,
  draft: ReportDraft,
  options?: TemplateOptions,
): { docDefinition: any; meta: GeneratedReport } {
  const customFields = options?.fields ?? getCustomFields();
  const allTiles = options?.tiles ?? getTiles();
  const pdfTitle = options?.pdfTitle ?? "RAPORT SERWISOWY";
  const templateName = options?.templateName ?? "Raport serwisowy";
  const signatureFields = options?.signatureFields ?? [{ id: "sig_client", label: "Podpis klienta" }];
  const showCompanyHeader = options?.showCompanyHeader !== false;
  const watermark = options?.watermark === true;

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

  // Report number — empty (hidden or cleared in the form) means no number on the PDF
  const reportNum = (draft.reportNumber || "").trim();

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
        fit: [120, 50],
        width: "auto",
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
      type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0,
      lineWidth: 2, lineColor: COLORS.accent,
    }],
    margin: [0, 0, 0, 12] as [number, number, number, number],
  });

  // Title row
  content.push({
    columns: [
      { text: pdfTitle, style: "title", width: "*" },
      ...(reportNum ? [{ text: reportNum, style: "reportNumber", width: "auto", alignment: "right" as const }] : []),
    ],
    margin: [0, 0, 0, 16] as [number, number, number, number],
  });

  // === CONTENT IN FIELD ORDER ===
  // How each block may be split across pages (see Block); used to keep headings with what follows.
  const blocks = new Map<any, Block>();
  const add = (node: any, block: Block) => { content.push(node); blocks.set(node, block); };

  // Collect consecutive data fields into a table, then flush when we hit a special type.
  // keep: the row never splits across pages (label and value stay on the same page).
  // Only a row too tall for one page (very long text) may split - pdfmake would drop it otherwise.
  let pendingDataRows: { cells: any[]; keep: boolean; height: number }[] = [];

  const flushDataRows = () => {
    if (pendingDataRows.length === 0) return;
    // runs of rows with the same "keep" become tables that look like one
    const runs: { rows: typeof pendingDataRows; keep: boolean }[] = [];
    pendingDataRows.forEach((row) => {
      const last = runs[runs.length - 1];
      if (last && last.keep === row.keep) last.rows.push(row);
      else runs.push({ rows: [row], keep: row.keep });
    });
    runs.forEach((run, i) => add({
      table: { widths: [130, "*"], body: run.rows.map((r) => r.cells), dontBreakRows: run.keep },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0,
        hLineColor: () => "#e5e7eb",
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 5,
        paddingBottom: () => 5,
      },
      margin: [0, 0, 0, i === runs.length - 1 ? 12 : 0] as [number, number, number, number],
    }, {
      kind: "rows",
      keep: run.keep,
      height: run.rows.reduce((a, r) => a + r.height, 0),
      // a row that may split needs only its label and the first lines of its text under a heading
      first: run.keep ? run.rows[0].height : Math.min(run.rows[0].height, 50),
    }));
    pendingDataRows = [];
  };

  customFields.forEach((field) => {
    // --- HEADING (static section header) ---
    if (field.type === "heading") {
      flushDataRows();
      const height = textHeight(field.label, field.labelStyle?.bold ? 12 : 11, CONTENT_W, true) + 16;
      add(buildStyledLabel(field.label, "sectionHeader", field.labelStyle, {
        margin: [0, 10, 0, 6] as [number, number, number, number],
      }), { kind: "head", height, first: height });
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
          alignment: ls?.align || undefined,
          color: ls?.color || COLORS.primary,
          fontSize: 10,
          margin: [4, 6, 0, 4] as [number, number, number, number],
        });
      }
      if (field.content) {
        const cs = field.contentStyle;
        infoStack.push({
          text: pdfSafe(field.content),
          bold: cs?.bold || false,
          italics: cs?.italic || false,
          alignment: cs?.align || undefined,
          color: cs?.color || COLORS.gray,
          fontSize: 9,
          lineHeight: 1.4,
          margin: [4, 0, 0, 8] as [number, number, number, number],
        });
      }
      if (infoStack.length > 0) {
        const labelH = field.label ? textHeight(field.label, 10, CONTENT_W - 4, field.labelStyle?.bold ?? true) + 10 : 0;
        const contentH = field.content ? textHeight(field.content, 9, CONTENT_W - 4, field.contentStyle?.bold, 1.4) + 8 : 0;
        // label + the first two lines of the text: what has to fit at the bottom of a page
        const start = labelH + Math.min(contentH, 2 * 9 * LINE_EM * 1.4 + 8);
        // the label doesn't stay alone at the bottom of a page (see pageBreakBefore)
        if (field.label && field.content) infoStack[0].headlineLevel = start - 6;
        add({ stack: infoStack }, { kind: "text", height: labelH + contentH, first: start });
      }
      return;
    }

    // --- DATA FIELDS (text, textarea, date, number) ---
    if (["text", "textarea", "date", "number"].includes(field.type)) {
      const value = draft.customFields[field.id];
      if (!value?.trim()) return;

      if (field.type === "textarea") {
        const labelH = textHeight(field.label, 10, CONTENT_W - 8, true);
        const valueH = textHeight(value, 10, CONTENT_W - 8);
        if (valueH <= 120) {
          // short text: label and text in one row, so the label never stays alone at the bottom of a page
          pendingDataRows.push({ keep: true, height: labelH + valueH + 25, cells: [{
            stack: [
              buildStyledLabel(field.label, "fieldLabel", field.labelStyle),
              { text: pdfSafe(value), style: "fieldValue", margin: [0, 10.5, 0, 4] as [number, number, number, number] },
            ],
            colSpan: 2, border: [false, false, false, true],
          }, {}] });
        } else {
          // long text flows on to the next page
          pendingDataRows.push({ keep: false, height: labelH + 10.5, cells: [
            buildStyledLabel(field.label, "fieldLabel", field.labelStyle, { colSpan: 2, border: [false, false, false, false] }), {},
          ] });
          // no bottom margin on the text: one that doesn't fit at the bottom of a page makes pdfmake
          // start a new page, leaving only the cell's border there
          pendingDataRows.push({ keep: false, height: valueH + 10.5, cells: [
            { text: pdfSafe(value), style: "fieldValue", colSpan: 2, border: [false, false, false, true] }, {},
          ] });
        }
      } else {
        // label column 130 pt, value column the rest: 515 − 130 − cell paddings = 369 pt
        const height = Math.max(textHeight(field.label, 10, 130, true), textHeight(value, 10, 369)) + 10.5;
        pendingDataRows.push({ keep: height <= KEEP_H, height, cells: [
          buildStyledLabel(field.label, "fieldLabel", field.labelStyle, { border: [false, false, false, true] }),
          { text: pdfSafe(value), style: "fieldValue", border: [false, false, false, true] },
        ] });
      }
      return;
    }

    // --- TABLE FIELD: rows filled in the field, header repeated on every page ---
    if (field.type === "table") {
      const tv = parseTable(draft.customFields[field.id]);
      const cols = tableColumns(field, tv);
      const rows = filledRows(tv, field);
      if (!cols.length || !rows.length) return;
      flushDataRows();

      const many = cols.length > 5;
      const cellSize = many ? 8 : 9;
      const span = cols.length + 1;
      const titleRow: any[] = [
        {
          ...buildStyledLabel(field.label, "sectionHeader", field.labelStyle),
          colSpan: span,
          border: [false, false, false, false],
          margin: [-4, 4, 0, 6] as [number, number, number, number],
        },
        // spanned cells need explicit "no border" too, otherwise pdfmake draws their top edge
        ...Array.from({ length: span - 1 }, () => ({ text: "", border: [false, false, false, false] })),
      ];
      const headerRow: any[] = [
        { text: "Lp.", style: "tableHeader", fontSize: cellSize, fillColor: COLORS.primary, alignment: "center" as const },
        ...cols.map((c) => ({
          text: c.label, style: "tableHeader", fontSize: cellSize, fillColor: COLORS.primary,
          alignment: (c.kind === "number" ? "right" : "left") as "right" | "left",
        })),
      ];
      const body: any[][] = [titleRow, headerRow];
      rows.forEach((row, i) => {
        const bg = i % 2 === 0 ? COLORS.lightBg : COLORS.white;
        body.push([
          { text: `${i + 1}`, style: "tableCell", fontSize: cellSize, fillColor: bg, alignment: "center" as const },
          ...cols.map((c) => ({
            text: pdfSafe((row[c.id] ?? "").toString()), style: "tableCell", fontSize: cellSize, fillColor: bg,
            alignment: (c.kind === "number" ? "right" : "left") as "right" | "left",
            bold: c.kind === "choice",
          })),
        ]);
      });

      // content width − 20pt "Lp." column − cell paddings (4pt each side) and borders
      const widths = [20, ...tableWidths(cols, rows, cellSize, CONTENT_W - 20 - (cols.length + 1) * 8 - 2)];
      // heights: title row, column header, each row (cell paddings 3 + 3, line 0.5)
      const titleH = textHeight(field.label, field.labelStyle?.bold ? 12 : 11, CONTENT_W, true) + 16;
      const headerH = Math.max(...cols.map((c, i) => textHeight(c.label, cellSize, widths[i + 1], true))) + 6.5;
      const rowHs = rows.map((row) => Math.max(...cols.map((c, i) =>
        textHeight((row[c.id] ?? "").toString(), cellSize, widths[i + 1], c.kind === "choice"))) + 6.5);
      // rows stay in one piece, unless one is too tall for a page (pdfmake would drop it)
      const rowsFit = rowHs.every((h) => h <= KEEP_H);
      add({
        table: {
          headerRows: 2,
          keepWithHeaderRows: rowsFit ? 1 : 0,
          dontBreakRows: rowsFit,
          widths,
          body,
        },
        layout: {
          hLineWidth: (i: number) => (i === 0 ? 0 : 0.5), // no line above the title row
          vLineWidth: () => 0.5,
          hLineColor: () => "#d1d5db",
          vLineColor: () => "#d1d5db",
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
        margin: [0, 0, 0, 12] as [number, number, number, number],
      }, {
        kind: "table",
        height: titleH + headerH + rowHs.reduce((a, h) => a + h, 0) + 12,
        first: titleH + headerH + (rowsFit ? rowHs[0] : Math.min(rowHs[0], 40)),
      });
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

      // heights: title, column header, each row (item column 414 pt, a note spans 467 pt; paddings 2 + 2, line 0.5)
      const titleH = textHeight(field.label, field.labelStyle?.bold ? 12 : 11, CONTENT_W, true) + 12;
      const headerH = 9 * LINE_EM + 4.5;
      const rowHs: number[] = [];

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
        rowHs.push(textHeight(tile.label, 10, 414) + 4.5);

        // Add notes row if present
        const note = tileNotes[tile.id];
        if (note?.trim()) {
          body.push([
            { text: "", fillColor: bg },
            { text: note, style: "tableCell", fillColor: bg, italics: true, color: COLORS.gray, colSpan: 2 },
            {},
          ]);
          rowHs.push(textHeight(note, 10, 467) + 4.5);
        }
      });

      const layout = {
        hLineWidth: () => 0.5, vLineWidth: () => 0.5,
        hLineColor: () => "#d1d5db", vLineColor: () => "#d1d5db",
      };
      const height = titleH + headerH + rowHs.reduce((a, h) => a + h, 0) + 12;
      if (height <= KEEP_H) {
        // Fits on a page: header + table in an unbreakable stack so they don't split across pages
        add({
          stack: [
            buildStyledLabel(field.label, "sectionHeader", field.labelStyle, { margin: [0, 4, 0, 8] as [number, number, number, number] }),
            { table: { headerRows: 1, widths: [30, "*", 45], body }, layout },
          ],
          unbreakable: true,
          margin: [0, 0, 0, 12] as [number, number, number, number],
        }, { kind: "whole", height, first: height });
      } else {
        // Longer than a page (an unbreakable block would vanish from the PDF): rows flow on to
        // the next pages, the title and column header repeat there, like in table fields
        const noBorder = [false, false, false, false];
        const rowsFit = rowHs.every((h) => h <= KEEP_H);
        add({
          table: {
            headerRows: 2,
            keepWithHeaderRows: rowsFit ? 1 : 0,
            dontBreakRows: rowsFit,
            widths: [30, "*", 45],
            body: [
              [
                {
                  ...buildStyledLabel(field.label, "sectionHeader", field.labelStyle),
                  colSpan: 3, border: noBorder, margin: [-4, 2, 0, 6] as [number, number, number, number],
                },
                { text: "", border: noBorder },
                { text: "", border: noBorder },
              ],
              ...body,
            ],
          },
          layout: { ...layout, hLineWidth: (i: number) => (i === 0 ? 0 : 0.5) }, // no line above the title row
          margin: [0, 0, 0, 12] as [number, number, number, number],
        }, { kind: "table", height, first: titleH + headerH + (rowsFit ? rowHs[0] : Math.min(rowHs[0], 40)) });
      }
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
          { image: fieldPhotos[i], fit: [240, 180], margin: [0, 0, 5, 5] as [number, number, number, number] },
        ];
        if (fieldPhotos[i + 1]) {
          cols.push({ image: fieldPhotos[i + 1], fit: [240, 180], margin: [5, 0, 0, 5] as [number, number, number, number] });
        } else {
          cols.push({ text: "", width: 240 });
        }

        const photoRow: any[] = [{ columns: cols }];

        // First pair gets the section header attached
        if (i === 0) {
          photoRow.unshift({ text: field.label || "Dokumentacja fotograficzna", style: "sectionHeader", margin: [0, 4, 0, 8] as [number, number, number, number] });
        }

        const height = 189 + (i === 0 ? textHeight(field.label || "Dokumentacja fotograficzna", 11, CONTENT_W, true) + 12 : 0);
        add({
          stack: photoRow,
          unbreakable: true,
          margin: [0, 0, 0, 4] as [number, number, number, number],
        }, { kind: "whole", height, first: height });
      }
      content.push({ text: "", margin: [0, 0, 0, 4] as [number, number, number, number] });
      return;
    }

    // --- SIGNATURE ---
    if (field.type === "signature") {
      const sigData = (draft.signatures || {})[field.id];
      flushDataRows();
      const sigAlign = field.labelStyle?.align || "left";

      const sigStack: any[] = [
        { text: field.label, style: "sectionHeader", alignment: sigAlign, margin: [0, 8, 0, 6] as [number, number, number, number] },
      ];

      if (sigData) {
        // Signed digitally — show image
        sigStack.push({ image: sigData, fit: [150, 75], alignment: sigAlign });
      } else {
        // Empty — leave blank space for pen signature
        sigStack.push({ text: "", margin: [0, 0, 0, 55] as [number, number, number, number] });
      }

      // Signature line — position via margin
      const lineWidth = 200;
      const pageContentWidth = CONTENT_W;
      const lineMarginLeft = sigAlign === "center" ? (pageContentWidth - lineWidth) / 2
        : sigAlign === "right" ? pageContentWidth - lineWidth : 0;

      sigStack.push({
        canvas: [{ type: "line", x1: 0, y1: 0, x2: lineWidth, y2: 0, lineWidth: 0.5, lineColor: COLORS.primary }],
        margin: [lineMarginLeft, 2, 0, 8] as [number, number, number, number],
      });

      add({ stack: sigStack, unbreakable: true }, { kind: "whole", height: SIGNATURE_H, first: SIGNATURE_H });
    }
  });

  // Flush any remaining data rows
  flushDataRows();

  // === ADDITIONAL NOTES (ad-hoc, not part of template) ===
  if (draft.additionalNotes?.trim()) {
    const notes = draft.additionalNotes.trim();
    const headerH = 11 * LINE_EM + 12;
    const notesH = textHeight(notes, 10, CONTENT_W);
    // in one piece while it fits on a page; longer notes flow on to the next page
    const keep = headerH + notesH <= KEEP_H;
    const start = headerH + Math.min(notesH, 2 * 10 * LINE_EM);
    add({
      stack: [
        // the header doesn't stay alone at the bottom of a page (see pageBreakBefore)
        { text: "Uwagi dodatkowe", style: "sectionHeader", margin: [0, 4, 0, 8] as [number, number, number, number], ...(keep ? {} : { headlineLevel: start - 4 }) },
        { text: notes, style: "fieldValue" },
      ],
      unbreakable: keep,
      margin: [0, 0, 0, 12] as [number, number, number, number],
    }, keep ? { kind: "whole", height: headerH + notesH, first: headerH + notesH } : { kind: "text", height: headerH + notesH, first: start });
  }

  // === HEADINGS STAY WITH WHAT FOLLOWS ===
  // A heading goes into one unbreakable block with the start of what follows it, so pdfmake moves
  // them to the next page together. Where that can't be done (a long table, text that flows on)
  // the heading carries the room it needs below it in headlineLevel, see pageBreakBefore.
  const laidOut: any[] = [];
  for (let i = 0; i < content.length; i++) {
    const node = content[i];
    if (blocks.get(node)?.kind !== "head") { laidOut.push(node); continue; }
    const heads = [node];
    while (blocks.get(content[i + 1])?.kind === "head") heads.push(content[++i]);
    const headsH = heads.reduce((a, h) => a + blocks.get(h)!.height, 0);
    const next = content[i + 1];
    const b = blocks.get(next);
    if (!b) {
      // headings with nothing after them: at least they stay together
      if (heads.length > 1 && headsH <= KEEP_H) laidOut.push({ stack: heads, unbreakable: true });
      else laidOut.push(...heads);
    } else if ((b.kind === "whole" || b.kind === "table") && headsH + b.height <= KEEP_H) {
      laidOut.push({ stack: [...heads, next], unbreakable: true });
      i++;
    } else if (b.kind === "rows" && b.keep && headsH + b.first <= KEEP_H) {
      // the first row goes with the headings, the other rows stay a table of their own
      const rows = next.table.body;
      laidOut.push({
        stack: [...heads, { ...next, table: { ...next.table, body: rows.slice(0, 1) }, margin: rows.length > 1 ? [0, 0, 0, 0] : next.margin }],
        unbreakable: true,
      });
      if (rows.length > 1) laidOut.push({ ...next, table: { ...next.table, body: rows.slice(1) } });
      i++;
    } else {
      // measured from the top of the first heading's text (below its 10 pt top margin)
      heads[0].headlineLevel = Math.min(headsH - 10 + b.first, KEEP_H);
      laidOut.push(...heads);
    }
  }
  // A bottom margin that doesn't fit on the page makes pdfmake start a new page - after the
  // last block that page would stay empty, so the end of the report has no bottom margin.
  if (laidOut[laidOut.length - 1]?.text === "") laidOut.pop(); // spacer after photos
  for (let n = laidOut[laidOut.length - 1]; n; n = !n.unbreakable && Array.isArray(n.stack) ? n.stack[n.stack.length - 1] : undefined) {
    if (Array.isArray(n.margin)) n.margin = [n.margin[0], n.margin[1], n.margin[2], 0];
  }

  // === DOCUMENT DEFINITION ===
  // Diagonal watermark for free plan — multi-color "RaportON.pl" (ON in accent
  // green), centered and rotated, drawn behind content on every page.
  const watermarkBackground = watermark
    ? (currentPage: number, pageSize: { width: number; height: number }) => {
        const w = pageSize.width;
        const h = pageSize.height;
        const cx = w / 2;
        const cy = h / 2;
        const svg =
          `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">` +
          `<g transform="rotate(-35 ${cx} ${cy})">` +
          `<text x="${cx}" y="${cy}" font-size="64" font-weight="bold" font-family="Helvetica, Arial, sans-serif" text-anchor="middle" dominant-baseline="middle">` +
          `<tspan fill="${WATERMARK_COLORS.primary}">Raport</tspan>` +
          `<tspan dx="0" fill="${WATERMARK_COLORS.accent}">ON</tspan>` +
          `<tspan dx="0" fill="${WATERMARK_COLORS.primary}">.pl</tspan>` +
          `</text></g></svg>`;
        return { svg, width: w, height: h, absolutePosition: { x: 0, y: 0 } };
      }
    : undefined;

  const docDefinition: any = {
    pageSize: "A4",
    pageMargins: [40, PAGE_TOP, 40, 55],
    background: watermarkBackground,
    content: laidOut,
    // A heading whose headlineLevel (pt it needs below its top) doesn't fit on the rest of the
    // page moves to the next page, so it isn't left alone at the bottom.
    pageBreakBefore: (node: any) => {
      const need = node.headlineLevel;
      const at = node.startPosition;
      if (typeof need !== "number" || !at) return false;
      // top is measured from the top edge of the page; the content area ends at PAGE_TOP + inner height
      return at.top > PAGE_TOP + 20 && at.top + need > PAGE_TOP + at.pageInnerHeight;
    },
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

  // History keeps exactly what went into the PDF: tables without empty / untouched starting rows
  const historyValues: Record<string, string> = { ...draft.customFields };
  customFields.forEach((f) => {
    if (f.type !== "table") return;
    const tv = parseTable(historyValues[f.id]);
    if (!tv) return;
    const rows = filledRows(tv, f).map(({ _k, ...r }) => r);
    historyValues[f.id] = rows.length ? serializeTable({ cols: colsSnapshot(tableColumns(f, tv)), rows }) : "";
  });

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
    customFields: historyValues,
    fieldLabels,
    signatures: { ...draftSignatures },
    signatureLabels,
    photosCount: Object.values(draft.photosByField || {}).reduce((sum, arr) => sum + arr.length, 0) || draft.photos.length,
    hasPhotos: Object.values(draft.photosByField || {}).some((arr) => arr.length > 0) || draft.photos.length > 0,
  };

  return { docDefinition, meta };
}

/** Builds and downloads the PDF (legacy flow). */
export function generateReport(
  profile: CompanyProfile,
  draft: ReportDraft,
  options?: TemplateOptions,
): GeneratedReport {
  const { docDefinition, meta } = buildReportDocument(profile, draft, options);
  pdfMake.createPdf(docDefinition).download(meta.filename);
  return meta;
}

/** Builds the PDF in memory — for the "Wyślij / Pobierz" sheet. */
export async function generateReportFile(
  profile: CompanyProfile,
  draft: ReportDraft,
  options?: TemplateOptions,
): Promise<{ meta: GeneratedReport; blob: Blob }> {
  const { docDefinition, meta } = buildReportDocument(profile, draft, options);
  const blob: Blob = await (pdfMake.createPdf(docDefinition) as any).getBlob();
  return { meta, blob };
}

/**
 * Regenerate PDF from history item (without photos)
 */
export function historyTemplateOptions(
  item: import("./storage").ReportHistoryItem,
  watermark?: boolean,
): { draft: ReportDraft; options: TemplateOptions } {
  // Build fields from fieldLabels — table values carry their own column labels
  const fields: CustomFieldDef[] = Object.entries(item.fieldLabels || {}).map(([id, label], i) => {
    const tv = parseTable(item.customFields?.[id]);
    return tv
      ? { id, label, type: "table" as const, remember: false, order: i, tableColumns: tableColumns(undefined, tv) }
      : { id, label, type: "text" as const, remember: false, order: i };
  });

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

  return {
    draft,
    options: {
      pdfTitle: item.pdfTitle || item.templateName.toUpperCase(),
      templateName: item.templateName,
      fields,
      tiles,
      signatureFields,
      watermark,
    },
  };
}

export function regenerateFromHistory(
  profile: CompanyProfile,
  item: import("./storage").ReportHistoryItem,
  watermark?: boolean
) {
  const { draft, options } = historyTemplateOptions(item, watermark);
  generateReport(profile, draft, options);
}
