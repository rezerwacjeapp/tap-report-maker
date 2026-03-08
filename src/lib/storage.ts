// localStorage helpers with auto-save

export interface CompanyProfile {
  companyName: string;
  nip: string;
  address: string;
  logo: string | null; // base64
}

export interface TileItem {
  id: string;
  label: string;
}

export type CustomFieldType = "text" | "textarea" | "date" | "number";

export interface CustomFieldDef {
  id: string;
  label: string;
  type: CustomFieldType;
  remember: boolean;
  order: number;
}

export interface ReportDraft {
  selectedTiles: string[];
  photos: string[]; // base64
  signature: string | null; // base64
  customFields: Record<string, string>; // fieldId -> value
  templateId?: string;
  _lastSaved?: number;
}

export interface ReportHistoryItem {
  id: string;
  filename: string;
  date: string;
  clientName: string;
  templateName: string;
  selectedTiles: string[];
  customFields: Record<string, string>;
  photosCount: number;
  hasSignature: boolean;
  createdAt: number;
}

const KEYS = {
  PROFILE: "docswift_profile",
  TILES: "docswift_tiles",
  DRAFT: "docswift_draft",
  CUSTOM_FIELDS: "docswift_custom_fields",
  REMEMBERED_VALUES: "docswift_remembered_values",
  REPORT_HISTORY: "docswift_report_history",
} as const;

const DEFAULT_TILES: TileItem[] = [
  { id: "1", label: "Przegląd szczelności" },
  { id: "2", label: "Wymiana filtrów" },
  { id: "3", label: "Czyszczenie jednostki" },
  { id: "4", label: "Kontrola ciśnienia" },
  { id: "5", label: "Uzupełnienie czynnika" },
  { id: "6", label: "Kontrola elektryczna" },
];

const DEFAULT_FIELDS: CustomFieldDef[] = [
  { id: "df_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 },
  { id: "df_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
  { id: "df_date", label: "Data", type: "date", remember: false, order: 2 },
  { id: "df_nip", label: "NIP klienta", type: "text", remember: false, order: 3 },
  { id: "df_notes", label: "Uwagi", type: "textarea", remember: false, order: 4 },
];

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

export function getProfile(): CompanyProfile {
  return get<CompanyProfile>(KEYS.PROFILE, { companyName: "", nip: "", address: "", logo: null });
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
    signature: null,
    customFields: buildDefaultCustomFields(),
  };
}

export function getDraft(): ReportDraft {
  const saved = get<ReportDraft | null>(KEYS.DRAFT, null);
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
  return { ...saved, customFields: cf };
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
