import jsPDF from "jspdf";
import type { CompanyProfile, ReportDraft } from "./storage";
import { getTiles, getCustomFields } from "./storage";

export function generateReport(profile: CompanyProfile, draft: ReportDraft) {
  const doc = new jsPDF("p", "mm", "a4");
  const W = 210;
  const margin = 15;
  const contentW = W - margin * 2;
  let y = margin;

  // Header
  if (profile.logo) {
    try {
      doc.addImage(profile.logo, "PNG", margin, y, 25, 25);
    } catch { /* skip bad logo */ }
  }
  const headerX = profile.logo ? margin + 30 : margin;
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(profile.companyName || "Firma", headerX, y + 8);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (profile.nip) doc.text(`NIP: ${profile.nip}`, headerX, y + 14);
  if (profile.address) doc.text(profile.address, headerX, y + 19);
  y += 30;

  // Line
  doc.setDrawColor(30, 42, 56);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // Report title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RAPORT SERWISOWY", W / 2, y, { align: "center" });
  y += 10;

  // All custom fields
  const customFields = getCustomFields();
  const filledFields = customFields.filter((f) => draft.customFields[f.id]?.trim());

  if (filledFields.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    filledFields.forEach((field) => {
      const value = draft.customFields[field.id];
      if (y > 270) { doc.addPage(); y = margin; }

      if (field.type === "textarea") {
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(value, contentW);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
      } else {
        doc.text(`${field.label}: ${value}`, margin, y);
        y += 6;
      }
    });
    y += 4;
  }

  // Activities table
  const allTiles = getTiles();
  const selectedLabels = draft.selectedTiles
    .map((id) => allTiles.find((t) => t.id === id)?.label)
    .filter(Boolean);

  if (selectedLabels.length > 0) {
    if (y > 240) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Czynnosci wykonane:", margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.setFillColor(30, 42, 56);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(255);
    doc.text("Lp.", margin + 2, y + 5);
    doc.text("Opis czynnosci", margin + 15, y + 5);
    doc.setTextColor(0);
    y += 7;

    selectedLabels.forEach((label, i) => {
      if (y > 270) { doc.addPage(); y = margin; }
      if (i % 2 === 0) {
        doc.setFillColor(237, 240, 244);
        doc.rect(margin, y, contentW, 7, "F");
      }
      doc.text(`${i + 1}.`, margin + 2, y + 5);
      doc.text(label!, margin + 15, y + 5);
      y += 7;
    });
    y += 4;
  }

  // Photos (2x3 grid)
  if (draft.photos.length > 0) {
    if (y > 180) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dokumentacja fotograficzna:", margin, y);
    y += 6;

    const photoW = (contentW - 5) / 2;
    const photoH = photoW * 0.75;

    draft.photos.forEach((photo, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const px = margin + col * (photoW + 5);
      const py = y + row * (photoH + 5);

      if (py + photoH > 280) return;

      try {
        doc.addImage(photo, "JPEG", px, py, photoW, photoH);
        doc.setDrawColor(30, 42, 56);
        doc.rect(px, py, photoW, photoH);
      } catch { /* skip bad photo */ }
    });

    const rows = Math.min(Math.ceil(draft.photos.length / 2), 3);
    y += rows * (photoH + 5) + 4;
  }

  // Signature
  if (draft.signature) {
    if (y > 230) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Podpis klienta:", margin, y);
    y += 4;
    try {
      doc.addImage(draft.signature, "PNG", margin, y, 60, 30);
      doc.line(margin, y + 30, margin + 60, y + 30);
    } catch { /* skip */ }
  }

  // Build filename from first text field or fallback
  const firstTextField = customFields.find((f) => f.type === "text" && draft.customFields[f.id]?.trim());
  const dateField = customFields.find((f) => f.type === "date" && draft.customFields[f.id]?.trim());
  const namepart = firstTextField ? draft.customFields[firstTextField.id].replace(/\s+/g, "_") : "serwis";
  const datepart = dateField ? draft.customFields[dateField.id] : new Date().toISOString().split("T")[0];
  const filename = `raport_${namepart}_${datepart}.pdf`;
  doc.save(filename);
}
