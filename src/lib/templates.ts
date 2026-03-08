import type { CustomFieldDef, TileItem } from "./storage";

// ============================================================
// DATA MODEL
// ============================================================

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

  // --- Klimatyzacja / HVAC ---
  {
    id: "fb_refrigerant",
    category: "Klimatyzacja / HVAC",
    label: "Rodzaj czynnika",
    fields: [{ id: "f_refrig", label: "Rodzaj czynnika", type: "text", remember: true, order: 0 }],
  },
  {
    id: "fb_refrigerant_amount",
    category: "Klimatyzacja / HVAC",
    label: "Ilość czynnika [kg]",
    fields: [{ id: "f_refrig_amt", label: "Ilość czynnika [kg]", type: "number", remember: false, order: 0 }],
  },
  {
    id: "fb_pressure",
    category: "Klimatyzacja / HVAC",
    label: "Ciśnienie [bar]",
    fields: [{ id: "f_pressure", label: "Ciśnienie [bar]", type: "text", remember: false, order: 0 }],
  },

  // --- Pomiary / Elektryka ---
  {
    id: "fb_meter_type",
    category: "Pomiary",
    label: "Typ miernika",
    fields: [{ id: "f_meter_type", label: "Typ miernika", type: "text", remember: true, order: 0 }],
  },
  {
    id: "fb_meter_serial",
    category: "Pomiary",
    label: "Nr seryjny miernika",
    fields: [{ id: "f_meter_sn", label: "Nr seryjny miernika", type: "text", remember: true, order: 0 }],
  },
  {
    id: "fb_meter_cert",
    category: "Pomiary",
    label: "Data ważności świadectwa wzorcowania",
    fields: [{ id: "f_meter_cert", label: "Data ważności świadectwa", type: "date", remember: true, order: 0 }],
  },
  {
    id: "fb_result",
    category: "Pomiary",
    label: "Wynik ogólny (pozytywny/negatywny)",
    fields: [{ id: "f_result", label: "Wynik ogólny", type: "text", remember: false, order: 0 }],
  },

  // --- Nieruchomości ---
  {
    id: "fb_owner",
    category: "Nieruchomości",
    label: "Przekazujący (właściciel)",
    fields: [{ id: "f_owner", label: "Przekazujący (właściciel)", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_tenant",
    category: "Nieruchomości",
    label: "Przejmujący (najemca)",
    fields: [{ id: "f_tenant", label: "Przejmujący (najemca)", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_area",
    category: "Nieruchomości",
    label: "Powierzchnia [m²]",
    fields: [{ id: "f_area", label: "Powierzchnia [m²]", type: "number", remember: false, order: 0 }],
  },
  {
    id: "fb_rooms",
    category: "Nieruchomości",
    label: "Liczba pomieszczeń",
    fields: [{ id: "f_rooms", label: "Liczba pomieszczeń", type: "number", remember: false, order: 0 }],
  },
  {
    id: "fb_meters",
    category: "Nieruchomości",
    label: "Stany liczników (prąd, gaz, woda)",
    fields: [
      { id: "f_meter_elec", label: "Stan licznika elektrycznego", type: "text", remember: false, order: 0 },
      { id: "f_meter_gas", label: "Stan licznika gazowego", type: "text", remember: false, order: 1 },
      { id: "f_meter_water", label: "Stan licznika wody", type: "text", remember: false, order: 2 },
    ],
  },
  {
    id: "fb_keys",
    category: "Nieruchomości",
    label: "Liczba kluczy",
    fields: [{ id: "f_keys", label: "Liczba przekazanych kluczy", type: "number", remember: false, order: 0 }],
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
  // --- Klimatyzacja ---
  { id: "tb_klima_leak", category: "Klimatyzacja", label: "Sprawdzenie szczelności", tiles: [{ id: "t_klima_leak", label: "Sprawdzenie szczelności" }] },
  { id: "tb_klima_pressure", category: "Klimatyzacja", label: "Kontrola ciśnienia", tiles: [{ id: "t_klima_pres", label: "Kontrola ciśnienia" }] },
  { id: "tb_klima_refill", category: "Klimatyzacja", label: "Uzupełnienie czynnika", tiles: [{ id: "t_klima_refill", label: "Uzupełnienie czynnika" }] },
  { id: "tb_klima_filters", category: "Klimatyzacja", label: "Czyszczenie filtrów", tiles: [{ id: "t_klima_filt", label: "Czyszczenie filtrów" }] },
  { id: "tb_klima_int", category: "Klimatyzacja", label: "Czyszczenie jedn. wewnętrznej", tiles: [{ id: "t_klima_int", label: "Czyszczenie jednostki wewnętrznej" }] },
  { id: "tb_klima_ext", category: "Klimatyzacja", label: "Czyszczenie jedn. zewnętrznej", tiles: [{ id: "t_klima_ext", label: "Czyszczenie jednostki zewnętrznej" }] },
  { id: "tb_klima_drain", category: "Klimatyzacja", label: "Kontrola odpływu skroplin", tiles: [{ id: "t_klima_drain", label: "Kontrola odpływu skroplin" }] },
  { id: "tb_klima_elec", category: "Klimatyzacja", label: "Kontrola połączeń elektrycznych", tiles: [{ id: "t_klima_elec", label: "Kontrola połączeń elektrycznych" }] },
  { id: "tb_klima_cool", category: "Klimatyzacja", label: "Test chłodzenia", tiles: [{ id: "t_klima_cool", label: "Test w trybie chłodzenia" }] },
  { id: "tb_klima_heat", category: "Klimatyzacja", label: "Test grzania", tiles: [{ id: "t_klima_heat", label: "Test w trybie grzania" }] },
  { id: "tb_klima_remote", category: "Klimatyzacja", label: "Test pilota / sterowania", tiles: [{ id: "t_klima_remote", label: "Test pilota / sterowania" }] },
  { id: "tb_klima_temp", category: "Klimatyzacja", label: "Pomiar temperatur", tiles: [{ id: "t_klima_temp", label: "Pomiar temperatur" }] },

  // --- Elektryka ---
  { id: "tb_elec_inspect", category: "Elektryka", label: "Oględziny instalacji", tiles: [{ id: "t_elec_insp", label: "Oględziny instalacji" }] },
  { id: "tb_elec_insul", category: "Elektryka", label: "Pomiar rezystancji izolacji", tiles: [{ id: "t_elec_insul", label: "Pomiar rezystancji izolacji" }] },
  { id: "tb_elec_loop", category: "Elektryka", label: "Pomiar impedancji pętli zwarcia", tiles: [{ id: "t_elec_loop", label: "Pomiar impedancji pętli zwarcia" }] },
  { id: "tb_elec_ground", category: "Elektryka", label: "Pomiar rezystancji uziemienia", tiles: [{ id: "t_elec_gnd", label: "Pomiar rezystancji uziemienia" }] },
  { id: "tb_elec_rcd", category: "Elektryka", label: "Sprawdzenie wyłączników RCD", tiles: [{ id: "t_elec_rcd", label: "Sprawdzenie wyłączników RCD" }] },
  { id: "tb_elec_pe", category: "Elektryka", label: "Sprawdzenie ciągłości PE", tiles: [{ id: "t_elec_pe", label: "Sprawdzenie ciągłości PE" }] },
  { id: "tb_elec_voltage", category: "Elektryka", label: "Pomiar napięcia i częstotliwości", tiles: [{ id: "t_elec_volt", label: "Pomiar napięcia i częstotliwości" }] },
  { id: "tb_elec_breakers", category: "Elektryka", label: "Sprawdzenie zabezpieczeń nadprądowych", tiles: [{ id: "t_elec_brkr", label: "Sprawdzenie zabezpieczeń nadprądowych" }] },

  // --- Nieruchomości ---
  { id: "tb_prop_walls", category: "Nieruchomości", label: "Ściany i sufity", tiles: [{ id: "t_prop_walls", label: "Ściany i sufity — bez uszkodzeń" }] },
  { id: "tb_prop_floors", category: "Nieruchomości", label: "Podłogi", tiles: [{ id: "t_prop_floors", label: "Podłogi — bez uszkodzeń" }] },
  { id: "tb_prop_windows", category: "Nieruchomości", label: "Okna i drzwi", tiles: [{ id: "t_prop_win", label: "Okna i drzwi — sprawne" }] },
  { id: "tb_prop_electric", category: "Nieruchomości", label: "Instalacja elektryczna", tiles: [{ id: "t_prop_elec", label: "Instalacja elektryczna — sprawna" }] },
  { id: "tb_prop_plumbing", category: "Nieruchomości", label: "Instalacja wod-kan", tiles: [{ id: "t_prop_plumb", label: "Instalacja wod-kan — sprawna" }] },
  { id: "tb_prop_heating", category: "Nieruchomości", label: "Ogrzewanie", tiles: [{ id: "t_prop_heat", label: "Ogrzewanie — sprawne" }] },
  { id: "tb_prop_kitchen", category: "Nieruchomości", label: "Kuchnia", tiles: [{ id: "t_prop_kitchen", label: "Kuchnia — kompletne wyposażenie" }] },
  { id: "tb_prop_bathroom", category: "Nieruchomości", label: "Łazienka", tiles: [{ id: "t_prop_bath", label: "Łazienka — kompletne wyposażenie" }] },

  // --- Ogólne ---
  { id: "tb_gen_visual", category: "Ogólne", label: "Oględziny wizualne", tiles: [{ id: "t_gen_visual", label: "Oględziny wizualne" }] },
  { id: "tb_gen_clean", category: "Ogólne", label: "Czyszczenie", tiles: [{ id: "t_gen_clean", label: "Czyszczenie" }] },
  { id: "tb_gen_test", category: "Ogólne", label: "Test działania", tiles: [{ id: "t_gen_test", label: "Test działania" }] },
  { id: "tb_gen_replace", category: "Ogólne", label: "Wymiana elementu", tiles: [{ id: "t_gen_replace", label: "Wymiana elementu" }] },
  { id: "tb_gen_repair", category: "Ogólne", label: "Naprawa", tiles: [{ id: "t_gen_repair", label: "Naprawa" }] },
  { id: "tb_gen_calibrate", category: "Ogólne", label: "Kalibracja", tiles: [{ id: "t_gen_calib", label: "Kalibracja" }] },
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
