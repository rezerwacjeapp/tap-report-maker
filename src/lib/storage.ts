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
  remember: boolean; // "Zapamiętaj na stałe"
}

export interface ReportDraft {
  clientName: string;
  clientAddress: string;
  date: string;
  selectedTiles: string[];
  note: string;
  photos: string[]; // base64
  signature: string | null; // base64
  customFields: Record<string, string>; // fieldId -> value
  _lastSaved?: number; // timestamp
}

const KEYS = {
  PROFILE: "docswift_profile",
  TILES: "docswift_tiles",
  DRAFT: "docswift_draft",
  CUSTOM_FIELDS: "docswift_custom_fields",
  REMEMBERED_VALUES: "docswift_remembered_values",
} as const;

const DEFAULT_TILES: TileItem[] = [
  { id: "1", label: "Przegląd szczelności" },
  { id: "2", label: "Wymiana filtrów" },
  { id: "3", label: "Czyszczenie jednostki" },
  { id: "4", label: "Kontrola ciśnienia" },
  { id: "5", label: "Uzupełnienie czynnika" },
  { id: "6", label: "Kontrola elektryczna" },
  { id: "7", label: "Wymiana termostatu" },
  { id: "8", label: "Serwis sprężarki" },
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
  return get<CustomFieldDef[]>(KEYS.CUSTOM_FIELDS, []);
}
export function saveCustomFields(f: CustomFieldDef[]) { set(KEYS.CUSTOM_FIELDS, f); }

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
    result[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : "";
  });
  return result;
}

export function getEmptyDraft(): ReportDraft {
  return {
    clientName: "",
    clientAddress: "",
    date: new Date().toISOString().split("T")[0],
    selectedTiles: [],
    note: "",
    photos: [],
    signature: null,
    customFields: buildDefaultCustomFields(),
  };
}

export function getDraft(): ReportDraft {
  const saved = get<ReportDraft | null>(KEYS.DRAFT, null);
  if (!saved) return getEmptyDraft();
  // Ensure customFields has all current field keys
  const fields = getCustomFields();
  const remembered = getRememberedValues();
  const cf = { ...saved.customFields };
  fields.forEach((f) => {
    if (!(f.id in cf)) {
      cf[f.id] = f.remember && remembered[f.id] ? remembered[f.id] : "";
    }
  });
  return { ...saved, customFields: cf };
}

export function hasDraft(): boolean {
  return localStorage.getItem(KEYS.DRAFT) !== null;
}

export function saveDraft(d: ReportDraft) {
  set(KEYS.DRAFT, { ...d, _lastSaved: Date.now() });

  // Update remembered values for fields with remember=true
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
