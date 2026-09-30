import type { ReportHistoryItem } from "./storage";
import { getCloudSnapshot } from "./supabase-storage";
import { getAllTemplates, getTemplateById } from "./templates";
import { formatDatePL } from "./report-utils";

/**
 * Prepares a new report based on an old one: finds its template and stores the
 * old values for the wizard (read once via /report?template=…&reuse=1).
 * Returns the wizard URL, or null when the template no longer exists.
 */
export async function prepareReuse(report: ReportHistoryItem): Promise<string | null> {
  const snapshot = await getCloudSnapshot(report.id).catch(() => null);
  const templateId: string | undefined =
    snapshot?.draft?.templateId || report.templateId ||
    getAllTemplates().find((t) => t.name === report.templateName)?.id;
  if (!templateId || !getTemplateById(templateId)) return null;

  sessionStorage.setItem("raporton_reuse", JSON.stringify({
    draft: { customFields: snapshot?.draft?.customFields || report.customFields },
    label: `protokołu ${report.reportNumber ? `nr ${report.reportNumber} ` : ""}z ${formatDatePL(report.date)}`,
  }));
  return `/report?template=${encodeURIComponent(templateId)}&reuse=1`;
}
