// localStorage helpers with auto-save

export interface ProfileField {
  id: string;
  label: string;
  value: string;
}

export interface CompanyProfile {
  logo: string | null; // base64
  fields: ProfileField[];
  // Legacy — kept for migration only
  companyName?: string;
  nip?: string;
  address?: string;
}

export interface TileItem {
  id: string;
  label: string;
}

export type CustomFieldType = "text" | "textarea" | "date" | "number" | "tiles" | "photos" | "signature" | "heading" | "info";

export interface CustomFieldDef {
  id: string;
  label: string;
  type: CustomFieldType;
  remember: boolean;
  order: number;
  tileOptions?: TileItem[];
  content?: string; // for "info" type — the full text block
}

export interface ReportDraft {
  selectedTiles: string[]; // kept for backward compat — derived from tileStates "done"
  tileStates?: Record<string, "done" | "fail" | "na">; // per-tile status
  tileNotes?: Record<string, string>; // per-tile notes
  photos: string[]; // base64 — legacy flat array
  photosByField: Record<string, string[]>; // fieldId -> base64[] — per-field photos
  signatures: Record<string, string | null>; // signatureFieldId -> base64
  customFields: Record<string, string>; // fieldId -> value
  additionalNotes?: string;
  reportNumber?: string;
  templateId?: string;
  _lastSaved?: number;
}

export interface ReportHistoryItem {
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
  createdAt: number;
}

const KEYS = {
  PROFILE: "docswift_profile",
  TILES: "docswift_tiles",
  DRAFT: "docswift_draft",
  CUSTOM_FIELDS: "docswift_custom_fields",
  REMEMBERED_VALUES: "docswift_remembered_values",
  REPORT_HISTORY: "docswift_report_history",
  REPORT_COUNTER: "docswift_report_counter",
} as const;

const DEFAULT_TILES: TileItem[] = [];

const DEFAULT_FIELDS: CustomFieldDef[] = [];

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_PROFILE_FIELDS: ProfileField[] = [
  { id: "pf_name", label: "Nazwa firmy", value: "" },
  { id: "pf_nip", label: "NIP", value: "" },
  { id: "pf_address", label: "Adres", value: "" },
];

export function getProfile(): CompanyProfile {
  const raw = get<any>(KEYS.PROFILE, null);
  if (!raw) return { logo: null, fields: DEFAULT_PROFILE_FIELDS.map((f) => ({ ...f })) };
  // Migration from old format (companyName/nip/address) to fields[]
  if (!raw.fields) {
    const fields: ProfileField[] = [
      { id: "pf_name", label: "Nazwa firmy", value: raw.companyName || "" },
      { id: "pf_nip", label: "NIP", value: raw.nip || "" },
      { id: "pf_address", label: "Adres", value: raw.address || "" },
    ];
    const migrated: CompanyProfile = { logo: raw.logo || null, fields };
    set(KEYS.PROFILE, migrated);
    return migrated;
  }
  return raw as CompanyProfile;
}
export function saveProfile(p: CompanyProfile) { set(KEYS.PROFILE, p); }

export function getTiles(): TileItem[] {
  return get<TileItem[]>(KEYS.TILES, DEFAULT_TILES);
}
export function saveTiles(t: TileItem[]) { set(KEYS.TILES, t); }

// Custom fields
export function getCustomFields(): CustomFieldDef[] {
  const fields = get<CustomFieldDef[]>(KEYS.CUSTOM_FIELDS, DEFAULT_FIELDS);
  // Ensure order property exists (migration)
  return fields
    .map((f, i) => ({ ...f, order: f.order ?? i }))
    .sort((a, b) => a.order - b.order);
}
export function saveCustomFields(f: CustomFieldDef[]) {
  set(KEYS.CUSTOM_FIELDS, f.map((field, i) => ({ ...field, order: i })));
}

// Remembered values for fields with remember=true
export function getRememberedValues(): Record<string, string> {
  return get<Record<string, string>>(KEYS.REMEMBERED_VALUES, {});
}
export function saveRememberedValues(v: Record<string, string>) { set(KEYS.REMEMBERED_VALUES, v); }

// Build default custom field values from remembered
function buildDefaultCustomFields(): Record<string, string> {
  const fields = getCustomFields();
  const remembered = getRememberedValues();
  const result: Record<string, string> = {};
  fields.forEach((f) => {
    if (f.type === "date") {
      result[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : new Date().toISOString().split("T")[0];
    } else {
      result[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : "";
    }
  });
  return result;
}

export function getEmptyDraft(): ReportDraft {
  return {
    selectedTiles: [],
    photos: [],
    photosByField: {},
    signatures: {},
    customFields: buildDefaultCustomFields(),
  };
}

export function getDraft(): ReportDraft {
  const saved = get<any>(KEYS.DRAFT, null);
  if (!saved) return getEmptyDraft();
  const fields = getCustomFields();
  const remembered = getRememberedValues();
  const cf = { ...saved.customFields };
  fields.forEach((f) => {
    if (!(f.id in cf)) {
      if (f.type === "date") {
        cf[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : new Date().toISOString().split("T")[0];
      } else {
        cf[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : "";
      }
    }
  });
  // Migrate old single signature to new format
  const signatures = saved.signatures ?? (saved.signature ? { sig_client: saved.signature } : {});
  const photosByField = saved.photosByField ?? {};
  return { ...saved, customFields: cf, signatures, photosByField };
}

export function hasDraft(): boolean {
  return localStorage.getItem(KEYS.DRAFT) !== null;
}

export function saveDraft(d: ReportDraft) {
  set(KEYS.DRAFT, { ...d, _lastSaved: Date.now() });
  const fields = getCustomFields();
  const remembered = getRememberedValues();
  let changed = false;
  fields.forEach((f) => {
    if (f.remember && d.customFields[f.id]) {
      remembered[f.id] = d.customFields[f.id];
      changed = true;
    }
  });
  if (changed) saveRememberedValues(remembered);
}

export function clearDraft() { localStorage.removeItem(KEYS.DRAFT); }

// Report history
export function getReportHistory(): ReportHistoryItem[] {
  return get<ReportHistoryItem[]>(KEYS.REPORT_HISTORY, [])
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addReportToHistory(report: Omit<ReportHistoryItem, "createdAt">): ReportHistoryItem {
  const history = get<ReportHistoryItem[]>(KEYS.REPORT_HISTORY, []);
  const item: ReportHistoryItem = { ...report, createdAt: Date.now() };
  history.push(item);
  // Keep max 100 reports
  if (history.length > 100) history.splice(0, history.length - 100);
  set(KEYS.REPORT_HISTORY, history);
  return item;
}

export function removeReportFromHistory(id: string) {
  const history = get<ReportHistoryItem[]>(KEYS.REPORT_HISTORY, []);
  set(KEYS.REPORT_HISTORY, history.filter((r) => r.id !== id));
}

export function clearReportHistory() {
  localStorage.removeItem(KEYS.REPORT_HISTORY);
}

// Sequential report number
export function getNextReportNumber(): string {
  const year = new Date().getFullYear();
  const counterData = get<{ year: number; count: number }>(KEYS.REPORT_COUNTER, { year, count: 0 });
  // Reset counter on new year
  if (counterData.year !== year) {
    counterData.year = year;
    counterData.count = 0;
  }
  counterData.count += 1;
  set(KEYS.REPORT_COUNTER, counterData);
  const num = String(counterData.count).padStart(3, "0");
  return `${num}/${year}`;
}
