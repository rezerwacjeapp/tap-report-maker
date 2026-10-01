/**
 * Supabase data layer — async CRUD for profiles, reports, snapshots, plan limits.
 * Draft stays in localStorage (temporary data, no need to sync).
 */

import { supabase } from "./supabase";
import type { CompanyProfile, ReportHistoryItem } from "./storage";
import type { GeneratedReport } from "./pdf-generator";

// ─── PROFILE ────────────────────────────────────────────────

export async function getCloudProfile(): Promise<CompanyProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("custom_fields")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return { logo: null, fields: [
      { id: "pf_name", label: "Nazwa firmy", value: "" },
      { id: "pf_nip", label: "NIP", value: "" },
      { id: "pf_address", label: "Adres", value: "" },
    ]};
  }

  const cf = data.custom_fields as any;
  if (cf && cf.fields) {
    return { logo: cf.logo || null, fields: cf.fields };
  }
  return { logo: null, fields: [
    { id: "pf_name", label: "Nazwa firmy", value: "" },
    { id: "pf_nip", label: "NIP", value: "" },
    { id: "pf_address", label: "Adres", value: "" },
  ]};
}

export async function saveCloudProfile(profile: CompanyProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      company_name: profile.fields[0]?.value || "",
      custom_fields: { fields: profile.fields, logo: profile.logo },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}

// ─── CONSENT ────────────────────────────────────────────────

export async function hasAcceptedTerms(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", user.id)
    .single();

  return !!data?.terms_accepted_at;
}

export async function saveConsent(marketing: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date().toISOString();
  await supabase
    .from("profiles")
    .update({
      terms_accepted_at: now,
      marketing_consent_at: marketing ? now : null,
    })
    .eq("id", user.id);
}

// ─── REPORTS ────────────────────────────────────────────────

// Everything the lists need — without `signatures` (PNG images, the heaviest column).
const HISTORY_COLUMNS =
  "id, filename, date, client_name, template_name, template_id, pdf_title, report_number, " +
  "selected_tiles, tile_labels, custom_fields, field_labels, signature_labels, photos_count, has_photos, created_at";
const HISTORY_PAGE = 500; // Supabase returns at most 1000 rows per request

let historyCache: { userId: string; at: number; items: ReportHistoryItem[] } | null = null;
const HISTORY_TTL = 60_000;

/** Call after adding or removing a report. */
export function invalidateReportHistory() {
  historyCache = null;
}

async function fetchHistoryRows(userId: string, columns: string): Promise<any[]> {
  const rows: any[] = [];
  for (let from = 0; ; from += HISTORY_PAGE) {
    const { data, error } = await supabase
      .from("reports")
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + HISTORY_PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < HISTORY_PAGE) return rows;
  }
}

/** All of the user's reports, newest first (no 100-report cap). */
export async function getCloudReportHistory(): Promise<ReportHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  if (historyCache && historyCache.userId === user.id && Date.now() - historyCache.at < HISTORY_TTL) {
    return historyCache.items;
  }

  let data: any[];
  try {
    // signed_count = small SQL function in Supabase that counts filled signatures
    data = await fetchHistoryRows(user.id, `${HISTORY_COLUMNS}, signed_count`);
  } catch {
    try {
      data = await fetchHistoryRows(user.id, HISTORY_COLUMNS);
    } catch {
      return [];
    }
  }

  const items: ReportHistoryItem[] = data.map((r: any) => ({
    id: r.id,
    filename: r.filename,
    date: r.date,
    clientName: r.client_name,
    templateName: r.template_name,
    templateId: r.template_id,
    pdfTitle: r.pdf_title,
    reportNumber: r.report_number,
    selectedTiles: r.selected_tiles || [],
    tileLabels: r.tile_labels || [],
    customFields: r.custom_fields || {},
    fieldLabels: r.field_labels || {},
    signatures: {},
    signatureLabels: r.signature_labels || {},
    signedCount: typeof r.signed_count === "number" ? r.signed_count : undefined,
    photosCount: r.photos_count || 0,
    hasPhotos: r.has_photos || false,
    createdAt: new Date(r.created_at).getTime(),
  }));
  historyCache = { userId: user.id, at: Date.now(), items };
  return items;
}

/** Signature images of one report (history view, PDF rebuilt without a snapshot). */
export async function getCloudReportSignatures(id: string): Promise<Record<string, string | null>> {
  const { data, error } = await supabase.from("reports").select("signatures").eq("id", id).maybeSingle();
  if (error || !data) return {};
  return (data.signatures as Record<string, string | null>) || {};
}

export async function addCloudReport(report: GeneratedReport): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      template_id: null, // templates not in Supabase yet
      template_name: report.templateName,
      filename: report.filename,
      report_number: report.reportNumber || "",
      client_name: report.clientName,
      date: report.date,
      custom_fields: report.customFields,
      field_labels: report.fieldLabels,
      selected_tiles: report.selectedTiles,
      tile_labels: report.tileLabels,
      signatures: report.signatures,
      signature_labels: report.signatureLabels,
      photos_count: report.photosCount,
      has_photos: report.hasPhotos,
      pdf_title: report.pdfTitle,
      additional_notes: (report as any).additionalNotes || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  invalidateReportHistory();
  return data.id;
}

export async function removeCloudReport(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reports").delete().eq("id", id).eq("user_id", user.id);
  invalidateReportHistory();
}

// ─── SNAPSHOTS ──────────────────────────────────────────────

export async function saveCloudSnapshot(reportId: string, snapshotData: unknown): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("report_snapshots")
    .insert({
      report_id: reportId,
      user_id: user.id,
      snapshot_data: snapshotData,
    });
}

export async function getCloudSnapshot(reportId: string): Promise<any | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("report_snapshots")
    .select("snapshot_data")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data.snapshot_data;
}

export async function deleteCloudSnapshot(reportId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("report_snapshots").delete().eq("report_id", reportId).eq("user_id", user.id);
}

// ─── DRAFTS (cloud) ──────────────────────────────────────

export interface CloudDraft {
  id: string;
  templateId: string;
  templateName: string;
  draftData: any; // ReportDraft JSON
  showCompanyHeader: boolean;
  label: string; // first text field value or fallback
  updatedAt: string;
}

export async function getCloudDrafts(): Promise<CloudDraft[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((d: any) => ({
    id: d.id,
    templateId: d.template_id,
    templateName: d.template_name,
    draftData: d.draft_data,
    showCompanyHeader: d.show_company_header ?? true,
    label: d.label || "",
    updatedAt: d.updated_at,
  }));
}

export async function saveCloudDraft(draft: {
  id?: string;
  templateId: string;
  templateName: string;
  draftData: any;
  showCompanyHeader: boolean;
  label: string;
}): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (draft.id) {
    // Update existing draft
    await supabase
      .from("drafts")
      .update({
        draft_data: draft.draftData,
        show_company_header: draft.showCompanyHeader,
        label: draft.label,
        template_name: draft.templateName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draft.id)
      .eq("user_id", user.id);
    return draft.id;
  }

  // Insert new draft
  const { data, error } = await supabase
    .from("drafts")
    .insert({
      user_id: user.id,
      template_id: draft.templateId,
      template_name: draft.templateName,
      draft_data: draft.draftData,
      show_company_header: draft.showCompanyHeader,
      label: draft.label,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteCloudDraft(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("drafts").delete().eq("id", id).eq("user_id", user.id);
}

export async function getCloudDraft(id: string): Promise<CloudDraft | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    templateId: data.template_id,
    templateName: data.template_name,
    draftData: data.draft_data,
    showCompanyHeader: data.show_company_header ?? true,
    label: data.label || "",
    updatedAt: data.updated_at,
  };
}

// ─── PLAN & LIMITS ──────────────────────────────────────────

const TRIAL_DAYS = 7;

export async function checkReportLimit(): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  plan: string;
  trial?: boolean;
  trialDaysLeft?: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, count: 0, limit: Infinity, plan: "free" };

  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sub && sub.plan === "solo" && sub.status === "active") {
    return { allowed: true, count: 0, limit: Infinity, plan: "solo" };
  }

  // Check trial period (first 7 days after registration)
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const isTrial = diffDays < TRIAL_DAYS;
  const trialDaysLeft = Math.max(0, TRIAL_DAYS - diffDays);

  if (isTrial) {
    return { allowed: true, count: 0, limit: Infinity, plan: "trial", trial: true, trialDaysLeft };
  }

  // Free plan — unlimited reports, but every PDF carries a watermark.
  // We still track the monthly count for analytics / display, but it never blocks.
  const month = new Date().toISOString().slice(0, 7); // '2026-03'
  const { data: countRow } = await supabase
    .from("report_counts")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle();

  const count = countRow?.count || 0;
  return { allowed: true, count, limit: Infinity, plan: "free" };
}

export async function incrementReportCount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const month = new Date().toISOString().slice(0, 7);

  // Try atomic RPC first (requires running the SQL migration in Supabase)
  const { error: rpcError } = await supabase.rpc("increment_report_count", {
    p_user_id: user.id,
    p_month: month,
  });

  if (!rpcError) return; // Success — atomic increment done

  // Fallback: non-atomic (for backward compatibility before migration)
  const { data: existing } = await supabase
    .from("report_counts")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("report_counts")
      .update({ count: existing.count + 1 })
      .eq("user_id", user.id)
      .eq("month", month);
  } else {
    await supabase
      .from("report_counts")
      .insert({ user_id: user.id, month, count: 1 });
  }
}

// ─── REPORT NUMBER ──────────────────────────────────────────

const REPORT_NUMBER_RE = /^\s*(\d+)\s*\/\s*(\d{4})\s*$/;

/**
 * Next free number "NNN/YYYY": the highest number used this year + 1.
 * (Counting reports gave duplicates after a report was deleted.)
 */
export async function getCloudNextReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const format = (n: number) => `${String(n).padStart(3, "0")}/${year}`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return format(1);

  let max = 0;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("reports")
      .select("report_number")
      .eq("user_id", user.id)
      .like("report_number", `%/${year}`)
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data || []) {
      const m = REPORT_NUMBER_RE.exec(row.report_number || "");
      if (m && Number(m[2]) === year) max = Math.max(max, Number(m[1]));
    }
    if (!data || data.length < 1000) break;
  }
  return format(max + 1);
}

/** A saved report that already has this number, if any. */
export async function findReportByNumber(reportNumber: string): Promise<{ id: string; date: string; clientName: string } | null> {
  const num = reportNumber.trim();
  if (!num) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reports")
    .select("id, date, client_name")
    .eq("user_id", user.id)
    .eq("report_number", num)
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  return row ? { id: row.id, date: row.date, clientName: row.client_name } : null;
}
// ─── USER TEMPLATES ─────────────────────────────────────────

import type { ReportTemplate } from "./templates";

export async function getCloudUserTemplates(): Promise<ReportTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_templates")
    .select("id, template_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row: any) => ({ ...row.template_data, id: row.id }));
}

export async function saveCloudUserTemplate(template: ReportTemplate): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { id, ...rest } = template;
  await supabase
    .from("user_templates")
    .upsert({
      id,
      user_id: user.id,
      template_data: { ...rest, id },
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,id" });
}

export async function deleteCloudUserTemplate(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_templates").delete().eq("id", id).eq("user_id", user.id);
}

export async function migrateLocalTemplatesToCloud(templates: ReportTemplate[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || templates.length === 0) return;

  const rows = templates.map((t) => ({
    id: t.id,
    user_id: user.id,
    template_data: t,
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from("user_templates")
    .upsert(rows, { onConflict: "user_id,id" });
}

// ─── SHARED TEMPLATES (link sharing) ────────────────────────

function generateCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function shareTemplate(template: ReportTemplate): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const code = generateCode();
  const { error } = await supabase
    .from("shared_templates")
    .insert({
      code,
      created_by: user.id,
      template_data: template,
      template_name: template.name,
    });

  if (error) throw error;
  return code;
}

export async function getSharedTemplate(code: string): Promise<{ name: string; template: ReportTemplate } | null> {
  const { data, error } = await supabase
    .from("shared_templates")
    .select("template_data, template_name")
    .eq("code", code)
    .single();

  if (error || !data) return null;
  return { name: data.template_name, template: data.template_data as ReportTemplate };
}
