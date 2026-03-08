import type { CustomFieldDef, TileItem } from "./storage";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: string;
  builtIn: boolean;
  fields: CustomFieldDef[];
  tiles: TileItem[];
  pdfTitle: string; // title shown in generated PDF
}

// ============================================================
// BUILT-IN TEMPLATES
// ============================================================

const TEMPLATE_KLIMATYZACJA: ReportTemplate = {
  id: "tpl_klima",
  name: "Uruchomienie klimatyzacji",
  description: "Protokół uruchomienia / przeglądu klimatyzacji",
  icon: "Wind",
  category: "HVAC",
  builtIn: true,
  pdfTitle: "PROTOKÓŁ URUCHOMIENIA KLIMATYZACJI",
  fields: [
    { id: "tk_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 },
    { id: "tk_nip", label: "NIP klienta", type: "text", remember: false, order: 1 },
    { id: "tk_address", label: "Adres obiektu", type: "text", remember: false, order: 2 },
    { id: "tk_date", label: "Data wykonania", type: "date", remember: false, order: 3 },
    { id: "tk_device_model", label: "Model urządzenia", type: "text", remember: false, order: 4 },
    { id: "tk_device_serial", label: "Numer seryjny", type: "text", remember: false, order: 5 },
    { id: "tk_device_location", label: "Lokalizacja jednostki", type: "text", remember: false, order: 6 },
    { id: "tk_refrigerant", label: "Rodzaj czynnika", type: "text", remember: true, order: 7 },
    { id: "tk_refrigerant_amount", label: "Ilość czynnika [kg]", type: "number", remember: false, order: 8 },
    { id: "tk_notes", label: "Uwagi", type: "textarea", remember: false, order: 9 },
  ],
  tiles: [
    { id: "tk_t1", label: "Sprawdzenie szczelności" },
    { id: "tk_t2", label: "Kontrola ciśnienia" },
    { id: "tk_t3", label: "Uzupełnienie czynnika" },
    { id: "tk_t4", label: "Czyszczenie filtrów" },
    { id: "tk_t5", label: "Czyszczenie jednostki wewnętrznej" },
    { id: "tk_t6", label: "Czyszczenie jednostki zewnętrznej" },
    { id: "tk_t7", label: "Kontrola odpływu skroplin" },
    { id: "tk_t8", label: "Kontrola połączeń elektrycznych" },
    { id: "tk_t9", label: "Test w trybie chłodzenia" },
    { id: "tk_t10", label: "Test w trybie grzania" },
    { id: "tk_t11", label: "Test pilota / sterowania" },
    { id: "tk_t12", label: "Pomiar temperatur" },
  ],
};

const TEMPLATE_ELEKTRYKA: ReportTemplate = {
  id: "tpl_elektr",
  name: "Pomiary elektryczne",
  description: "Protokół pomiarów instalacji elektrycznej",
  icon: "Zap",
  category: "Elektryka",
  builtIn: true,
  pdfTitle: "PROTOKÓŁ POMIARÓW ELEKTRYCZNYCH",
  fields: [
    { id: "te_client", label: "Nazwa klienta / Zleceniodawca", type: "text", remember: false, order: 0 },
    { id: "te_nip", label: "NIP klienta", type: "text", remember: false, order: 1 },
    { id: "te_address", label: "Adres obiektu", type: "text", remember: false, order: 2 },
    { id: "te_date", label: "Data pomiarów", type: "date", remember: false, order: 3 },
    { id: "te_meter_type", label: "Typ miernika", type: "text", remember: true, order: 4 },
    { id: "te_meter_serial", label: "Nr seryjny miernika", type: "text", remember: true, order: 5 },
    { id: "te_cert_date", label: "Data ważności świadectwa wzorcowania", type: "date", remember: true, order: 6 },
    { id: "te_circuit_count", label: "Liczba obwodów", type: "number", remember: false, order: 7 },
    { id: "te_result", label: "Wynik ogólny (pozytywny/negatywny)", type: "text", remember: false, order: 8 },
    { id: "te_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 9 },
  ],
  tiles: [
    { id: "te_t1", label: "Oględziny instalacji" },
    { id: "te_t2", label: "Pomiar rezystancji izolacji" },
    { id: "te_t3", label: "Pomiar impedancji pętli zwarcia" },
    { id: "te_t4", label: "Pomiar rezystancji uziemienia" },
    { id: "te_t5", label: "Sprawdzenie wyłączników RCD" },
    { id: "te_t6", label: "Sprawdzenie ciągłości PE" },
    { id: "te_t7", label: "Pomiar napięcia i częstotliwości" },
    { id: "te_t8", label: "Sprawdzenie zabezpieczeń nadprądowych" },
    { id: "te_t9", label: "Kontrola oznaczeń obwodów" },
    { id: "te_t10", label: "Sprawdzenie tablic rozdzielczych" },
  ],
};

const TEMPLATE_ZDAWCZO_ODBIORCZY: ReportTemplate = {
  id: "tpl_zdawczo",
  name: "Zdawczo-odbiorczy",
  description: "Protokół zdawczo-odbiorczy mieszkania / lokalu",
  icon: "Home",
  category: "Nieruchomości",
  builtIn: true,
  pdfTitle: "PROTOKÓŁ ZDAWCZO-ODBIORCZY",
  fields: [
    { id: "tz_owner", label: "Przekazujący (właściciel)", type: "text", remember: false, order: 0 },
    { id: "tz_tenant", label: "Przejmujący (najemca)", type: "text", remember: false, order: 1 },
    { id: "tz_address", label: "Adres lokalu", type: "text", remember: false, order: 2 },
    { id: "tz_date", label: "Data przekazania", type: "date", remember: false, order: 3 },
    { id: "tz_area", label: "Powierzchnia [m²]", type: "number", remember: false, order: 4 },
    { id: "tz_rooms", label: "Liczba pomieszczeń", type: "number", remember: false, order: 5 },
    { id: "tz_meter_electric", label: "Stan licznika elektrycznego", type: "text", remember: false, order: 6 },
    { id: "tz_meter_gas", label: "Stan licznika gazowego", type: "text", remember: false, order: 7 },
    { id: "tz_meter_water", label: "Stan licznika wody", type: "text", remember: false, order: 8 },
    { id: "tz_keys", label: "Liczba przekazanych kluczy", type: "number", remember: false, order: 9 },
    { id: "tz_condition", label: "Stan ogólny lokalu", type: "textarea", remember: false, order: 10 },
    { id: "tz_notes", label: "Uwagi i zastrzeżenia", type: "textarea", remember: false, order: 11 },
  ],
  tiles: [
    { id: "tz_t1", label: "Ściany i sufity — bez uszkodzeń" },
    { id: "tz_t2", label: "Podłogi — bez uszkodzeń" },
    { id: "tz_t3", label: "Okna i drzwi — sprawne" },
    { id: "tz_t4", label: "Instalacja elektryczna — sprawna" },
    { id: "tz_t5", label: "Instalacja wod-kan — sprawna" },
    { id: "tz_t6", label: "Ogrzewanie — sprawne" },
    { id: "tz_t7", label: "Kuchnia — kompletne wyposażenie" },
    { id: "tz_t8", label: "Łazienka — kompletne wyposażenie" },
    { id: "tz_t9", label: "Oświetlenie — sprawne" },
    { id: "tz_t10", label: "Domofon / wideodomofon — sprawny" },
  ],
};

// General / custom template (uses user's own fields & tiles from settings)
const TEMPLATE_CUSTOM: ReportTemplate = {
  id: "tpl_custom",
  name: "Raport serwisowy",
  description: "Własny szablon z Twoimi polami i czynnościami",
  icon: "FileText",
  category: "Ogólny",
  builtIn: true,
  pdfTitle: "RAPORT SERWISOWY",
  fields: [], // will use user's custom fields from settings
  tiles: [],  // will use user's custom tiles from settings
};

export const BUILT_IN_TEMPLATES: ReportTemplate[] = [
  TEMPLATE_CUSTOM,
  TEMPLATE_KLIMATYZACJA,
  TEMPLATE_ELEKTRYKA,
  TEMPLATE_ZDAWCZO_ODBIORCZY,
];

export function getTemplateById(id: string): ReportTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

export function getAllTemplates(): ReportTemplate[] {
  // In the future, add user-created templates here
  return [...BUILT_IN_TEMPLATES];
}
