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

export async function getCloudReportHistory(): Promise<ReportHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((r: any) => ({
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
    signatures: r.signatures || {},
    signatureLabels: r.signature_labels || {},
    photosCount: r.photos_count || 0,
    hasPhotos: r.has_photos || false,
    createdAt: new Date(r.created_at).getTime(),
  }));
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
  return data.id;
}

export async function removeCloudReport(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reports").delete().eq("id", id).eq("user_id", user.id);
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

const FREE_LIMIT = 5;
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
  if (!user) return { allowed: false, count: 0, limit: FREE_LIMIT, plan: "free" };

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

  // Free plan — check monthly count
  const month = new Date().toISOString().slice(0, 7); // '2026-03'
  const { data: countRow } = await supabase
    .from("report_counts")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", month)
    .maybeSingle();

  const count = countRow?.count || 0;
  return { allowed: count < FREE_LIMIT, count, limit: FREE_LIMIT, plan: "free" };
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

export async function getCloudNextReportNumber(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const year = new Date().getFullYear();
    return `001/${year}`;
  }

  const year = new Date().getFullYear();
  const startOfYear = `${year}-01-01`;

  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date", startOfYear);

  const num = (error ? 0 : (count || 0)) + 1;
  return `${String(num).padStart(3, "0")}/${year}`;
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
