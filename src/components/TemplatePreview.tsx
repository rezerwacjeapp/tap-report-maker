import { useLayoutEffect, useRef, useState, Fragment } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { CustomFieldDef, CompanyProfile, TextStyle } from "@/lib/storage";

/**
 * Live HTML mirror of the generated PDF.
 *
 * This is NOT a real PDF — pdfmake can't be re-rendered cheaply on every
 * keystroke. It's a faithful visual copy so the user sees the layout live.
 *
 * IMPORTANT: COLORS and the field rendering below must stay in sync with
 * src/lib/pdf-generator.ts. If you change the PDF layout there, mirror it here.
 */

const COLORS = {
  primary: "#1e2a38",
  accent: "#2f9e6e",
  lightBg: "#f3f4f6",
  white: "#ffffff",
  gray: "#6b7280",
};

// A4 width at ~96dpi. The whole page is scaled to fit its container.
const PAGE_W = 794;

const styleToCss = (s?: TextStyle): React.CSSProperties => {
  const css: React.CSSProperties = {};
  if (!s) return css;
  if (s.bold) css.fontWeight = 700;
  if (s.italic) css.fontStyle = "italic";
  if (s.color) css.color = s.color;
  if (s.align) css.textAlign = s.align;
  return css;
};

export type PreviewMode = "edit" | "fill" | "final";

export interface TemplatePreviewProps {
  mode: PreviewMode;
  pdfTitle: string;
  fields: CustomFieldDef[];
  showCompanyHeader: boolean;
  profile?: CompanyProfile | null;
  reportNumber?: string;
  /** fill/final mode data */
  values?: Record<string, string>;
  tileStates?: Record<string, "done" | "fail" | "na">;
  tileNotes?: Record<string, string>;
  signatures?: Record<string, string | null>;
  photosByField?: Record<string, string[]>;
  additionalNotes?: string;
  /** show diagonal free-plan watermark */
  watermark?: boolean;
  /** Etap 2 — click a field in the preview to jump to it in the form */
  onFieldClick?: (fieldId: string) => void;
}

export function TemplatePreview({
  mode,
  pdfTitle,
  fields,
  showCompanyHeader,
  profile,
  reportNumber,
  values = {},
  tileStates = {},
  tileNotes = {},
  signatures = {},
  photosByField = {},
  additionalNotes,
  watermark = false,
  onFieldClick,
}: TemplatePreviewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [pageH, setPageH] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Measure container width + page height with guards so a scrollbar
  // toggling can never start a setState feedback loop (white-screen bug).
  // We observe the page element (transform doesn't affect offsetHeight, so
  // it stays stable) and the wrapper (no vertical scrollbar → stable width).
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const page = pageRef.current;
    if (!wrap || !page) return;
    const update = () => {
      const w = wrap.clientWidth;
      const h = page.offsetHeight;
      setContainerW((prev) => (prev === w ? prev : w));
      setPageH((prev) => (Math.abs(prev - h) < 0.5 ? prev : h));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(page);
    return () => ro.disconnect();
  }, []);

  const fit = containerW > 0 ? Math.min((containerW - 4) / PAGE_W, 1) : 0.5;
  const scale = fit * zoom;

  // Double-tap to toggle zoom
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) setZoom((z) => (z > 1 ? 1 : 1.6));
    lastTap.current = now;
  };

  const isFill = mode === "fill" || mode === "final";
  const clickable = mode === "fill" && !!onFieldClick;

  // ---- field renderers ----
  const renderField = (field: CustomFieldDef, idx: number) => {
    const labelCss = styleToCss(field.labelStyle);

    if (field.type === "heading") {
      return (
        <div key={field.id} style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, margin: "14px 0 6px", ...labelCss }}>
          {field.label || (mode === "edit" ? "Nagłówek sekcji" : "")}
        </div>
      );
    }

    if (field.type === "info") {
      const contentCss = styleToCss(field.contentStyle);
      return (
        <div key={field.id} style={{ margin: "8px 0" }}>
          {field.label && (
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, marginBottom: 3, ...labelCss }}>{field.label}</div>
          )}
          {(field.content || mode === "edit") && (
            <div style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.5, ...contentCss }}>
              {field.content || (mode === "edit" ? "Treść tekstu informacyjnego…" : "")}
            </div>
          )}
        </div>
      );
    }

    // data fields
    if (["text", "textarea", "date", "number"].includes(field.type)) {
      const raw = values[field.id];
      const filled = !!raw?.trim();
      if (isFill && !filled) return null; // PDF skips empty data fields

      const valueNode = filled ? (
        <span style={{ fontSize: 13, color: COLORS.primary }}>{raw}</span>
      ) : (
        <span style={{ fontSize: 13, color: "#cbd5e1", fontStyle: "italic" }}>[{field.label || "wartość"}]</span>
      );

      const rowProps = clickable
        ? { onClick: () => onFieldClick!(field.id), style: { cursor: "pointer" as const } }
        : {};

      if (field.type === "textarea") {
        return (
          <div key={field.id} {...rowProps} style={{ margin: "6px 0", ...(rowProps as any).style }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray, ...labelCss }}>{field.label}</div>
            <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 4, marginTop: 2 }}>{valueNode}</div>
          </div>
        );
      }
      return (
        <div key={field.id} {...rowProps} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: "1px solid #e5e7eb", ...(rowProps as any).style }}>
          <div style={{ flex: "0 0 42%", fontSize: 12, fontWeight: 700, color: COLORS.gray, ...labelCss }}>{field.label}</div>
          <div style={{ flex: 1 }}>{valueNode}</div>
        </div>
      );
    }

    // tiles
    if (field.type === "tiles" && field.tileOptions?.length) {
      return (
        <div key={field.id} style={{ margin: "10px 0 12px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, margin: "4px 0 8px", ...labelCss }}>{field.label}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "0.5px solid #d1d5db" }}>
            <thead>
              <tr style={{ background: COLORS.primary, color: COLORS.white }}>
                <th style={{ width: 36, padding: "5px 4px", fontWeight: 700, fontSize: 12 }}>Lp.</th>
                <th style={{ padding: "5px 4px", textAlign: "left", fontWeight: 700, fontSize: 12 }}>Opis czynności</th>
                <th style={{ width: 54, padding: "5px 4px", fontWeight: 700, fontSize: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(field.tileOptions || []).map((tile, i) => {
                const state = isFill ? (tileStates[tile.id] || "na") : "na";
                const statusText = state === "done" ? "TAK" : state === "fail" ? "NIE" : "nd.";
                const bg = i % 2 === 0 ? COLORS.lightBg : COLORS.white;
                const note = isFill ? tileNotes[tile.id] : undefined;
                return (
                  <Fragment key={tile.id}>
                    <tr style={{ background: bg, borderTop: "0.5px solid #d1d5db" }}>
                      <td style={{ textAlign: "center", padding: "5px 4px", color: COLORS.primary }}>{i + 1}</td>
                      <td style={{ padding: "5px 4px", color: COLORS.primary }}>{tile.label}</td>
                      <td style={{ textAlign: "center", padding: "5px 4px", fontWeight: 700, color: "#18181b" }}>{statusText}</td>
                    </tr>
                    {note?.trim() && (
                      <tr style={{ background: bg }}>
                        <td />
                        <td colSpan={2} style={{ padding: "2px 4px 5px", fontStyle: "italic", color: COLORS.gray }}>{note}</td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // photos
    if (field.type === "photos") {
      const photos = isFill ? (photosByField[field.id] || []) : [];
      if (isFill && photos.length === 0) return null;
      return (
        <div key={field.id} style={{ margin: "10px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, margin: "4px 0 8px", ...labelCss }}>
            {field.label || "Dokumentacja fotograficzna"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {isFill
              ? photos.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb" }} />
                ))
              : [0, 1].map((i) => (
                  <div key={i} style={{ height: 120, borderRadius: 4, border: "1px dashed #cbd5e1", background: COLORS.lightBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12 }}>
                    Zdjęcie
                  </div>
                ))}
          </div>
        </div>
      );
    }

    // signature
    if (field.type === "signature") {
      const sig = isFill ? signatures[field.id] : null;
      const align = (field.labelStyle?.align || "left") as "left" | "center" | "right";
      const items = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
      return (
        <div key={field.id} style={{ margin: "14px 0 4px", display: "flex", flexDirection: "column", alignItems: items }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, marginBottom: 6, ...labelCss }}>{field.label}</div>
          {sig ? (
            <img src={sig} alt="" style={{ height: 70, objectFit: "contain" }} />
          ) : (
            <div style={{ height: 56 }} />
          )}
          <div style={{ width: 220, borderTop: "1px solid " + COLORS.primary, marginTop: 2 }} />
        </div>
      );
    }

    return null;
  };

  const profileFields = profile?.fields || [];
  const companyName = profileFields[0]?.value?.trim();
  const detailFields = profileFields.slice(1).filter((f) => f.value?.trim());
  const reportNumLabel = reportNumber?.trim() || (mode === "edit" ? "Nr __/____" : "");

  return (
    <div ref={wrapRef} className="relative w-full overflow-x-auto" onClick={handleTap}>
      {/* zoom controls — sticky so they stay visible while scrolling the column */}
      <div className="sticky top-2 z-10 flex justify-end pr-2 -mb-9 pointer-events-none">
        <div className="flex gap-1 pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(2))); }}
            className="w-8 h-8 rounded-full bg-card/90 border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-card"
            aria-label="Pomniejsz"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(2))); }}
            className="w-8 h-8 rounded-full bg-card/90 border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-card"
            aria-label="Powiększ"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-center pt-1">
        {/* Outer box takes the real scaled footprint so layout/scroll behave;
            inner page is scaled from top-left to overlap it exactly. */}
        <div style={{ width: PAGE_W * scale, height: pageH ? pageH * scale : undefined }}>
          <div
            ref={pageRef}
            style={{
              width: PAGE_W,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: COLORS.white,
              color: COLORS.primary,
              fontFamily: "Roboto, system-ui, -apple-system, sans-serif",
              padding: "48px 50px 60px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
          {watermark && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", overflow: "hidden", zIndex: 5 }}>
              <div style={{ transform: "rotate(-35deg)", fontSize: 64, fontWeight: 700, whiteSpace: "nowrap", opacity: 0.13, fontFamily: "Helvetica, Arial, sans-serif" }}>
                <span style={{ color: COLORS.primary }}>Raport</span>
                <span style={{ color: COLORS.accent }}>ON</span>
                <span style={{ color: COLORS.primary }}>.pl</span>
              </div>
            </div>
          )}
          {/* company header */}
          {showCompanyHeader && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              {profile?.logo && <img src={profile.logo} alt="" style={{ maxHeight: 50, maxWidth: 120, objectFit: "contain" }} />}
              <div>
                <div style={{ fontSize: 21, fontWeight: 700, color: companyName ? COLORS.primary : "#cbd5e1" }}>
                  {companyName || "Nazwa firmy"}
                </div>
                {detailFields.length > 0
                  ? detailFields.map((f) => (
                      <div key={f.id} style={{ fontSize: 12, color: COLORS.gray, lineHeight: 1.4 }}>
                        {f.label ? `${f.label}: ${f.value}` : f.value}
                      </div>
                    ))
                  : mode === "edit" && (
                      <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.4 }}>NIP, adres, telefon…</div>
                    )}
              </div>
            </div>
          )}

          {/* accent line */}
          <div style={{ height: 2, background: COLORS.accent, marginBottom: 12 }} />

          {/* title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: COLORS.primary }}>{pdfTitle || "TYTUŁ DOKUMENTU"}</div>
            {reportNumLabel && <div style={{ fontSize: 12, color: COLORS.gray }}>{reportNumLabel}</div>}
          </div>

          {/* fields */}
          {fields.length === 0 ? (
            <div style={{ fontSize: 13, color: "#cbd5e1", fontStyle: "italic", padding: "24px 0" }}>
              Dodaj pola — pojawią się tutaj na podglądzie.
            </div>
          ) : (
            fields.map((f, i) => renderField(f, i))
          )}

          {isFill && additionalNotes?.trim() && (
            <div style={{ margin: "10px 0" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.primary, margin: "4px 0 8px" }}>Uwagi dodatkowe</div>
              <div style={{ fontSize: 13, color: COLORS.primary }}>{additionalNotes}</div>
            </div>
          )}

          {/* footer */}
          <div style={{ marginTop: 28, paddingTop: 8, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.gray }}>
            <span>Wygenerowano: __.__.____ • {companyName || "RaportON"}</span>
            <span>Strona 1 z 1</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
