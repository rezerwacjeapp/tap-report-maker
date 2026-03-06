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

export interface ReportDraft {
  clientName: string;
  clientAddress: string;
  date: string;
  selectedTiles: string[];
  note: string;
  photos: string[]; // base64
  signature: string | null; // base64
}

const KEYS = {
  PROFILE: "docswift_profile",
  TILES: "docswift_tiles",
  DRAFT: "docswift_draft",
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

export function getDraft(): ReportDraft {
  return get<ReportDraft>(KEYS.DRAFT, {
    clientName: "", clientAddress: "", date: new Date().toISOString().split("T")[0],
    selectedTiles: [], note: "", photos: [], signature: null,
  });
}
export function saveDraft(d: ReportDraft) { set(KEYS.DRAFT, d); }
export function clearDraft() { localStorage.removeItem(KEYS.DRAFT); }
