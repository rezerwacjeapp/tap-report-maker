import type { CustomFieldDef, TileItem } from "./storage";

// ============================================================
// DATA MODEL
// ============================================================

export interface SignatureFieldDef {
  id: string;
  label: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  builtIn: boolean;
  pdfTitle: string;
  fields: CustomFieldDef[];
  tiles: TileItem[];
  hasPhotos: boolean;
  signatureFields: SignatureFieldDef[];
}

// A catalog block = a group of related fields or tiles the user can toggle on/off
export interface FieldBlock {
  id: string;
  category: string;
  label: string;
  fields: CustomFieldDef[];
}

export interface TileBlock {
  id: string;
  category: string;
  label: string;
  tiles: TileItem[];
}

// ============================================================
// FIELD CATALOG — ready-made blocks grouped by category
// ============================================================

export const FIELD_CATALOG: FieldBlock[] = [
  // --- Dane klienta ---
  {
    id: "fb_client_name",
    category: "Dane klienta",
    label: "Nazwa klienta",
    fields: [{ id: "f_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_client_nip",
    category: "Dane klienta",
    label: "NIP klienta",
    fields: [{ id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_client_address",
    category: "Dane klienta",
    label: "Adres obiektu",
    fields: [{ id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_client_phone",
    category: "Dane klienta",
    label: "Telefon klienta",
    fields: [{ id: "f_phone", label: "Telefon klienta", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_client_email",
    category: "Dane klienta",
    label: "Email klienta",
    fields: [{ id: "f_email", label: "Email klienta", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_contact_person",
    category: "Dane klienta",
    label: "Osoba kontaktowa",
    fields: [{ id: "f_contact", label: "Osoba kontaktowa", type: "text", remember: false, order: 0 }],
  },

  // --- Data i czas ---
  {
    id: "fb_date",
    category: "Data i czas",
    label: "Data wykonania",
    fields: [{ id: "f_date", label: "Data wykonania", type: "date", remember: false, order: 0 }],
  },
  {
    id: "fb_date_next",
    category: "Data i czas",
    label: "Data następnego przeglądu",
    fields: [{ id: "f_date_next", label: "Data następnego przeglądu", type: "date", remember: false, order: 0 }],
  },
  {
    id: "fb_contract_nr",
    category: "Data i czas",
    label: "Numer umowy / zlecenia",
    fields: [{ id: "f_contract", label: "Numer umowy / zlecenia", type: "text", remember: false, order: 0 }],
  },

  // --- Urządzenie ---
  {
    id: "fb_device_model",
    category: "Urządzenie",
    label: "Model urządzenia",
    fields: [{ id: "f_dev_model", label: "Model urządzenia", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_device_serial",
    category: "Urządzenie",
    label: "Numer seryjny",
    fields: [{ id: "f_dev_serial", label: "Numer seryjny", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_device_manufacturer",
    category: "Urządzenie",
    label: "Producent",
    fields: [{ id: "f_dev_mfr", label: "Producent", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_device_location",
    category: "Urządzenie",
    label: "Lokalizacja urządzenia",
    fields: [{ id: "f_dev_loc", label: "Lokalizacja urządzenia", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_device_year",
    category: "Urządzenie",
    label: "Rok produkcji",
    fields: [{ id: "f_dev_year", label: "Rok produkcji", type: "number", remember: false, order: 0 }],
  },

  // --- Inne ---
  {
    id: "fb_notes",
    category: "Inne",
    label: "Uwagi",
    fields: [{ id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 0 }],
  },
  {
    id: "fb_condition",
    category: "Inne",
    label: "Stan ogólny",
    fields: [{ id: "f_condition", label: "Stan ogólny", type: "textarea", remember: false, order: 0 }],
  },
  {
    id: "fb_recommendations",
    category: "Inne",
    label: "Zalecenia",
    fields: [{ id: "f_recommend", label: "Zalecenia", type: "textarea", remember: false, order: 0 }],
  },
];

// ============================================================
// TILE CATALOG — ready-made activity groups
// ============================================================

export const TILE_CATALOG: TileBlock[] = [
  { id: "tb_gen_visual", category: "Ogólne", label: "Oględziny wizualne", tiles: [{ id: "t_gen_visual", label: "Oględziny wizualne" }] },
  { id: "tb_gen_clean", category: "Ogólne", label: "Czyszczenie", tiles: [{ id: "t_gen_clean", label: "Czyszczenie" }] },
  { id: "tb_gen_test", category: "Ogólne", label: "Test działania", tiles: [{ id: "t_gen_test", label: "Test działania" }] },
  { id: "tb_gen_replace", category: "Ogólne", label: "Wymiana elementu", tiles: [{ id: "t_gen_replace", label: "Wymiana elementu" }] },
  { id: "tb_gen_repair", category: "Ogólne", label: "Naprawa", tiles: [{ id: "t_gen_repair", label: "Naprawa" }] },
  { id: "tb_gen_calibrate", category: "Ogólne", label: "Kalibracja", tiles: [{ id: "t_gen_calib", label: "Kalibracja" }] },
  { id: "tb_gen_measure", category: "Ogólne", label: "Pomiar", tiles: [{ id: "t_gen_measure", label: "Pomiar" }] },
  { id: "tb_gen_check", category: "Ogólne", label: "Kontrola / sprawdzenie", tiles: [{ id: "t_gen_check", label: "Kontrola / sprawdzenie" }] },
  { id: "tb_gen_install", category: "Ogólne", label: "Montaż / instalacja", tiles: [{ id: "t_gen_install", label: "Montaż / instalacja" }] },
  { id: "tb_gen_demount", category: "Ogólne", label: "Demontaż", tiles: [{ id: "t_gen_demount", label: "Demontaż" }] },
];

// ============================================================
// BUILT-IN TEMPLATE STARTERS (presets)
// ============================================================

export const STARTER_TEMPLATES: ReportTemplate[] = [
  {
    id: "starter_klima",
    name: "Przegląd klimatyzacji",
    description: "Protokół przeglądu / uruchomienia klimatyzacji",
    icon: "Wind",
    category: "HVAC",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU KLIMATYZACJI",
    fields: [
      { id: "f_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data wykonania", type: "date", remember: false, order: 3 },
      { id: "f_dev_model", label: "Model urządzenia", type: "text", remember: false, order: 4 },
      { id: "f_dev_serial", label: "Numer seryjny", type: "text", remember: false, order: 5 },
      { id: "f_dev_loc", label: "Lokalizacja jednostki", type: "text", remember: false, order: 6 },
      { id: "f_refrig", label: "Rodzaj czynnika", type: "text", remember: true, order: 7 },
      { id: "f_refrig_amt", label: "Ilość czynnika [kg]", type: "number", remember: false, order: 8 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 9 },
    ],
    tiles: [
      { id: "t_klima_leak", label: "Sprawdzenie szczelności" },
      { id: "t_klima_pres", label: "Kontrola ciśnienia" },
      { id: "t_klima_refill", label: "Uzupełnienie czynnika" },
      { id: "t_klima_filt", label: "Czyszczenie filtrów" },
      { id: "t_klima_int", label: "Czyszczenie jednostki wewnętrznej" },
      { id: "t_klima_ext", label: "Czyszczenie jednostki zewnętrznej" },
      { id: "t_klima_drain", label: "Kontrola odpływu skroplin" },
      { id: "t_klima_elec", label: "Kontrola połączeń elektrycznych" },
      { id: "t_klima_cool", label: "Test w trybie chłodzenia" },
      { id: "t_klima_heat", label: "Test w trybie grzania" },
      { id: "t_klima_remote", label: "Test pilota / sterowania" },
      { id: "t_klima_temp", label: "Pomiar temperatur" },
    ],
    hasPhotos: true,
    signatureFields: [{ id: "sig_client", label: "Podpis klienta" }],
  },
  {
    id: "starter_elektr",
    name: "Pomiary elektryczne",
    description: "Protokół pomiarów instalacji elektrycznej",
    icon: "Zap",
    category: "Elektryka",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ POMIARÓW ELEKTRYCZNYCH",
    fields: [
      { id: "f_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data pomiarów", type: "date", remember: false, order: 3 },
      { id: "f_meter_type", label: "Typ miernika", type: "text", remember: true, order: 4 },
      { id: "f_meter_sn", label: "Nr seryjny miernika", type: "text", remember: true, order: 5 },
      { id: "f_meter_cert", label: "Data ważności świadectwa", type: "date", remember: true, order: 6 },
      { id: "f_result", label: "Wynik ogólny", type: "text", remember: false, order: 7 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 8 },
    ],
    tiles: [
      { id: "t_elec_insp", label: "Oględziny instalacji" },
      { id: "t_elec_insul", label: "Pomiar rezystancji izolacji" },
      { id: "t_elec_loop", label: "Pomiar impedancji pętli zwarcia" },
      { id: "t_elec_gnd", label: "Pomiar rezystancji uziemienia" },
      { id: "t_elec_rcd", label: "Sprawdzenie wyłączników RCD" },
      { id: "t_elec_pe", label: "Sprawdzenie ciągłości PE" },
      { id: "t_elec_volt", label: "Pomiar napięcia i częstotliwości" },
      { id: "t_elec_brkr", label: "Sprawdzenie zabezpieczeń nadprądowych" },
    ],
    hasPhotos: true,
    signatureFields: [{ id: "sig_client", label: "Podpis klienta" }],
  },
  {
    id: "starter_zdawczo",
    name: "Zdawczo-odbiorczy",
    description: "Protokół zdawczo-odbiorczy lokalu",
    icon: "Home",
    category: "Nieruchomości",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ ZDAWCZO-ODBIORCZY",
    fields: [
      { id: "f_owner", label: "Przekazujący (właściciel)", type: "text", remember: false, order: 0 },
      { id: "f_tenant", label: "Przejmujący (najemca)", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres lokalu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data przekazania", type: "date", remember: false, order: 3 },
      { id: "f_area", label: "Powierzchnia [m²]", type: "number", remember: false, order: 4 },
      { id: "f_rooms", label: "Liczba pomieszczeń", type: "number", remember: false, order: 5 },
      { id: "f_meter_elec", label: "Stan licznika elektrycznego", type: "text", remember: false, order: 6 },
      { id: "f_meter_gas", label: "Stan licznika gazowego", type: "text", remember: false, order: 7 },
      { id: "f_meter_water", label: "Stan licznika wody", type: "text", remember: false, order: 8 },
      { id: "f_keys", label: "Liczba przekazanych kluczy", type: "number", remember: false, order: 9 },
      { id: "f_condition", label: "Stan ogólny lokalu", type: "textarea", remember: false, order: 10 },
      { id: "f_notes", label: "Uwagi i zastrzeżenia", type: "textarea", remember: false, order: 11 },
    ],
    tiles: [
      { id: "t_prop_walls", label: "Ściany i sufity — bez uszkodzeń" },
      { id: "t_prop_floors", label: "Podłogi — bez uszkodzeń" },
      { id: "t_prop_win", label: "Okna i drzwi — sprawne" },
      { id: "t_prop_elec", label: "Instalacja elektryczna — sprawna" },
      { id: "t_prop_plumb", label: "Instalacja wod-kan — sprawna" },
      { id: "t_prop_heat", label: "Ogrzewanie — sprawne" },
      { id: "t_prop_kitchen", label: "Kuchnia — kompletne wyposażenie" },
      { id: "t_prop_bath", label: "Łazienka — kompletne wyposażenie" },
    ],
    hasPhotos: true,
    signatureFields: [
      { id: "sig_owner", label: "Podpis przekazującego" },
      { id: "sig_tenant", label: "Podpis przejmującego" },
    ],
  },
];

// ============================================================
// USER TEMPLATES — CRUD (localStorage)
// ============================================================

const USER_TEMPLATES_KEY = "docswift_user_templates";

function getStoredTemplates(): ReportTemplate[] {
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredTemplates(templates: ReportTemplate[]) {
  localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(templates));
}

export function getUserTemplates(): ReportTemplate[] {
  return getStoredTemplates();
}

export function saveUserTemplate(template: ReportTemplate): ReportTemplate {
  const templates = getStoredTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  saveStoredTemplates(templates);
  return template;
}

export function deleteUserTemplate(id: string) {
  const templates = getStoredTemplates().filter((t) => t.id !== id);
  saveStoredTemplates(templates);
}

export function duplicateTemplate(source: ReportTemplate, newName: string): ReportTemplate {
  const newTemplate: ReportTemplate = {
    ...source,
    id: `user_${Date.now()}`,
    name: newName,
    builtIn: false,
  };
  return saveUserTemplate(newTemplate);
}

export function createBlankTemplate(name: string): ReportTemplate {
  return saveUserTemplate({
    id: `user_${Date.now()}`,
    name,
    description: "",
    icon: "FileText",
    category: "Własne",
    builtIn: false,
    pdfTitle: name.toUpperCase(),
    fields: [],
    tiles: [],
    hasPhotos: true,
    signatureFields: [{ id: `sig_${Date.now()}`, label: "Podpis klienta" }],
  });
}

// ============================================================
// UNIFIED ACCESS
// ============================================================

export function getAllTemplates(): ReportTemplate[] {
  return [...STARTER_TEMPLATES, ...getUserTemplates()];
}

export function getTemplateById(id: string): ReportTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id);
}

// Helper: get catalog categories
export function getFieldCategories(): string[] {
  return [...new Set(FIELD_CATALOG.map((b) => b.category))];
}

export function getTileCategories(): string[] {
  return [...new Set(TILE_CATALOG.map((b) => b.category))];
}

// Helper: check which catalog blocks are active in a template
export function getActiveFieldBlockIds(template: ReportTemplate): Set<string> {
  const fieldIds = new Set(template.fields.map((f) => f.id));
  const active = new Set<string>();
  FIELD_CATALOG.forEach((block) => {
    if (block.fields.some((f) => fieldIds.has(f.id))) {
      active.add(block.id);
    }
  });
  return active;
}

export function getActiveTileBlockIds(template: ReportTemplate): Set<string> {
  const tileIds = new Set(template.tiles.map((t) => t.id));
  const active = new Set<string>();
  TILE_CATALOG.forEach((block) => {
    if (block.tiles.some((t) => tileIds.has(t.id))) {
      active.add(block.id);
    }
  });
  return active;
}
