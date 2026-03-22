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
  showCompanyHeader?: boolean;
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

  // --- Obiekt / miejsce ---
  {
    id: "fb_object_name",
    category: "Obiekt / miejsce",
    label: "Nazwa obiektu",
    fields: [{ id: "f_obj_name", label: "Nazwa obiektu", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_object_location",
    category: "Obiekt / miejsce",
    label: "Lokalizacja",
    fields: [{ id: "f_obj_loc", label: "Lokalizacja", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_object_number",
    category: "Obiekt / miejsce",
    label: "Numer / oznaczenie",
    fields: [{ id: "f_obj_num", label: "Numer / oznaczenie", type: "text", remember: false, order: 0 }],
  },
  {
    id: "fb_object_desc",
    category: "Obiekt / miejsce",
    label: "Opis",
    fields: [{ id: "f_obj_desc", label: "Opis", type: "textarea", remember: false, order: 0 }],
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

export const TILE_CATALOG: TileBlock[] = [];

// ============================================================
// BUILT-IN TEMPLATE STARTERS (presets)
// ============================================================

export const STARTER_TEMPLATES: ReportTemplate[] = [
  // ===================== 1. HVAC / KLIMATYZACJA =====================
  {
    id: "starter_klima",
    name: "Przegląd klimatyzacji",
    description: "Protokół serwisu klimatyzacji z kontrolą F-gaz",
    icon: "Wind",
    category: "HVAC",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU KLIMATYZACJI",
    fields: [
      { id: "f_client", label: "Nazwa klienta", type: "text", remember: false, order: 0 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 3 },
      { id: "f_dev_int", label: "Jedn. wewnętrzna (marka, model, nr fab.)", type: "text", remember: false, order: 4 },
      { id: "f_dev_ext", label: "Jedn. zewnętrzna (marka, model, nr fab.)", type: "text", remember: false, order: 5 },
      { id: "f_refrig", label: "Rodzaj czynnika (R32, R410A...)", type: "text", remember: true, order: 6 },
      { id: "f_refrig_kg", label: "Ilość czynnika [kg]", type: "number", remember: false, order: 7 },
      { id: "f_refrig_add", label: "Ilość uzupełnionego czynnika [kg]", type: "number", remember: false, order: 8 },
      { id: "f_pressure_s", label: "Ciśnienie ssania [bar]", type: "text", remember: false, order: 9 },
      { id: "f_pressure_t", label: "Ciśnienie tłoczenia [bar]", type: "text", remember: false, order: 10 },
      { id: "f_fgaz_cert", label: "Nr certyfikatu F-gaz", type: "text", remember: true, order: 11 },
      { id: "f_klima_tiles", label: "Czynności serwisowe", type: "tiles", remember: false, order: 12, tileOptions: [
        { id: "t_k1", label: "Kontrola szczelności instalacji chłodniczej" },
        { id: "t_k2", label: "Sprawdzenie parametrów czynnika chłodniczego" },
        { id: "t_k3", label: "Czyszczenie filtrów jednostki wewnętrznej" },
        { id: "t_k4", label: "Czyszczenie i dezynfekcja jednostki wewnętrznej" },
        { id: "t_k5", label: "Czyszczenie wymiennika jednostki zewnętrznej" },
        { id: "t_k6", label: "Kontrola drożności odprowadzenia skroplin" },
        { id: "t_k7", label: "Sprawdzenie pompki skroplin" },
        { id: "t_k8", label: "Sprawdzenie instalacji elektrycznej urządzenia" },
        { id: "t_k9", label: "Sprawdzenie parametrów prądowych" },
        { id: "t_k10", label: "Kontrola izolacji termicznej" },
        { id: "t_k11", label: "Sprawdzenie zamocowań i podpór" },
        { id: "t_k12", label: "Sprawdzenie urządzeń sterowniczych / pilota" },
        { id: "t_k13", label: "Test w trybie chłodzenia" },
        { id: "t_k14", label: "Test w trybie grzania" },
        { id: "t_k15", label: "Sprawdzenie obwodów zasilania i zabezpieczeń" },
        { id: "t_k16", label: "Uszczelnienie i uzupełnienie czynnika (w razie potrzeby)" },
      ]},
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 13 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 14 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 15 },
      { id: "sig_tech", label: "Podpis serwisanta", type: "signature", remember: false, order: 16 },
      { id: "sig_client", label: "Podpis klienta", type: "signature", remember: false, order: 17 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 2. POMIARY ELEKTRYCZNE =====================
  {
    id: "starter_elektr",
    name: "Pomiary elektryczne",
    description: "Protokół pomiarów instalacji elektrycznej (SEP)",
    icon: "Zap",
    category: "Elektryka",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ POMIARÓW INSTALACJI ELEKTRYCZNEJ",
    fields: [
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data pomiarów", type: "date", remember: false, order: 2 },
      { id: "f_type", label: "Rodzaj badania (odbiorcze / okresowe)", type: "text", remember: false, order: 3 },
      { id: "f_network", label: "Układ sieci (TN-S / TN-C-S / TT)", type: "text", remember: false, order: 4 },
      { id: "f_meter", label: "Przyrząd pomiarowy (typ, nr)", type: "text", remember: true, order: 5 },
      { id: "f_meter_cal", label: "Data ważności kalibracji", type: "date", remember: true, order: 6 },
      { id: "f_sep_e", label: "Nr świadectwa SEP (wykonujący)", type: "text", remember: true, order: 7 },
      { id: "f_sep_d", label: "Nr świadectwa SEP (sprawdzający)", type: "text", remember: true, order: 8 },
      { id: "f_elec_tiles", label: "Wykonane pomiary i oględziny", type: "tiles", remember: false, order: 9, tileOptions: [
        { id: "t_e1", label: "Oględziny instalacji elektrycznej" },
        { id: "t_e2", label: "Sprawdzenie doboru zabezpieczeń i aparatury" },
        { id: "t_e3", label: "Kontrola oznakowania przewodów N, PE, L" },
        { id: "t_e4", label: "Sprawdzenie ochrony przeciwporażeniowej" },
        { id: "t_e5", label: "Pomiar rezystancji izolacji" },
        { id: "t_e6", label: "Pomiar impedancji pętli zwarcia" },
        { id: "t_e7", label: "Badanie wyłączników RCD" },
        { id: "t_e8", label: "Pomiar rezystancji uziemienia" },
        { id: "t_e9", label: "Sprawdzenie ciągłości przewodów PE" },
        { id: "t_e10", label: "Kontrola tablic rozdzielczych" },
        { id: "t_e11", label: "Sprawdzenie wyłącznika ppoż. prądu" },
        { id: "t_e12", label: "Sprawdzenie stanu opraw i osprzętu" },
      ]},
      { id: "f_result", label: "Wynik ogólny (pozytywny / negatywny)", type: "text", remember: false, order: 10 },
      { id: "f_next_date", label: "Data następnego badania", type: "date", remember: false, order: 11 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 12 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 13 },
      { id: "sig_exec", label: "Podpis wykonującego (SEP E)", type: "signature", remember: false, order: 14 },
      { id: "sig_check", label: "Podpis sprawdzającego (SEP D)", type: "signature", remember: false, order: 15 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 16 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 3. INSTALACJE GAZOWE =====================
  {
    id: "starter_gaz",
    name: "Przegląd gazowy",
    description: "Protokół kontroli instalacji gazowej i kotła",
    icon: "Flame",
    category: "Gaz",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU INSTALACJI GAZOWEJ",
    fields: [
      { id: "f_client", label: "Właściciel / zarządca", type: "text", remember: false, order: 0 },
      { id: "f_tenant", label: "Lokator / najemca", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres budynku / lokalu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 3 },
      { id: "f_g3d", label: "Nr uprawnień G3D kontrolującego", type: "text", remember: true, order: 4 },
      { id: "f_gas_type", label: "Rodzaj gazu (sieciowy / butlowy)", type: "text", remember: false, order: 5 },
      { id: "f_meter_nr", label: "Nr gazomierza / odczyt", type: "text", remember: false, order: 6 },
      { id: "f_boiler", label: "Kocioł (marka, typ, moc, nr fab.)", type: "text", remember: false, order: 7 },
      { id: "f_analyzer", label: "Analizator spalin (typ, nr, legalizacja)", type: "text", remember: true, order: 8 },
      { id: "f_co_ppm", label: "Stężenie CO [ppm]", type: "text", remember: false, order: 9 },
      { id: "f_efficiency", label: "Sprawność paleniskowa [%]", type: "text", remember: false, order: 10 },
      { id: "f_gas_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 11, tileOptions: [
        { id: "t_g1", label: "Kontrola szczelności instalacji gazowej" },
        { id: "t_g2", label: "Ocena stanu przewodów gazowych i połączeń" },
        { id: "t_g3", label: "Sprawdzenie zaworu odcinającego (główny)" },
        { id: "t_g4", label: "Kontrola drożności wentylacji nawiewnej" },
        { id: "t_g5", label: "Kontrola drożności wentylacji wywiewnej" },
        { id: "t_g6", label: "Sprawdzenie ciągu kominowego" },
        { id: "t_g7", label: "Sprawdzenie czujnika tlenku węgla" },
        { id: "t_g8", label: "Kontrola pracy kotła w trybie CO" },
        { id: "t_g9", label: "Kontrola pracy kotła w trybie CWU" },
        { id: "t_g10", label: "Czyszczenie wymiennika ciepła" },
        { id: "t_g11", label: "Analiza spalin" },
        { id: "t_g12", label: "Kontrola palnika / czyszczenie palnika" },
        { id: "t_g13", label: "Kontrola elektrody zapłonowo-jonizacyjnej" },
        { id: "t_g14", label: "Czyszczenie syfonu kondensatu" },
        { id: "t_g15", label: "Kontrola zaworu bezpieczeństwa" },
        { id: "t_g16", label: "Sprawdzenie szczelności układu spalinowego" },
      ]},
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 12 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 13 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 14 },
      { id: "sig_tech", label: "Podpis kontrolującego", type: "signature", remember: false, order: 15 },
      { id: "sig_client", label: "Podpis właściciela / lokatora", type: "signature", remember: false, order: 16 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 4. OCHRONA PPOŻ — GAŚNICE =====================
  {
    id: "starter_gasnice",
    name: "Przegląd gaśnic",
    description: "Protokół przeglądu i konserwacji gaśnic",
    icon: "ShieldAlert",
    category: "PPOŻ",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU GAŚNIC",
    fields: [
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_ext_id", label: "Nr ewidencyjny gaśnicy", type: "text", remember: false, order: 3 },
      { id: "f_ext_type", label: "Typ gaśnicy (GP/GS/GW/AS)", type: "text", remember: false, order: 4 },
      { id: "f_ext_cap", label: "Pojemność / masa [kg]", type: "text", remember: false, order: 5 },
      { id: "f_ext_serial", label: "Nr fabryczny zbiornika", type: "text", remember: false, order: 6 },
      { id: "f_ext_prod", label: "Data produkcji", type: "text", remember: false, order: 7 },
      { id: "f_ext_udt", label: "Data ważności legalizacji UDT", type: "date", remember: false, order: 8 },
      { id: "f_ext_loc", label: "Lokalizacja w obiekcie", type: "text", remember: false, order: 9 },
      { id: "f_ext_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 10, tileOptions: [
        { id: "t_x1", label: "Sprawdzenie oznakowań na zbiorniku" },
        { id: "t_x2", label: "Kontrola stanu plomby" },
        { id: "t_x3", label: "Kontrola manometru / wskaźnika ciśnienia" },
        { id: "t_x4", label: "Sprawdzenie stanu węża i dyszy" },
        { id: "t_x5", label: "Kontrola obudowy / powłoki lakierniczej" },
        { id: "t_x6", label: "Sprawdzenie czytelności instrukcji obsługi" },
        { id: "t_x7", label: "Kontrola daty legalizacji zbiornika UDT" },
        { id: "t_x8", label: "Sprawdzenie masy środka gaśniczego (zważenie)" },
        { id: "t_x9", label: "Sprawdzenie zabezpieczenia przed uruchomieniem" },
        { id: "t_x10", label: "Sprawdzenie dostępności i widoczności (max 30 m)" },
        { id: "t_x11", label: "Kontrola czy gaśnica nie jest zastawiona" },
        { id: "t_x12", label: "Kontrola stanu zaworu" },
      ]},
      { id: "f_result", label: "Ocena (sprawna / niesprawna)", type: "text", remember: false, order: 11 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 12 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 13 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 14 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 15 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 16 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 5. PPOŻ — HYDRANTY =====================
  {
    id: "starter_hydranty",
    name: "Przegląd hydrantów",
    description: "Protokół przeglądu hydrantów wewnętrznych",
    icon: "Droplets",
    category: "PPOŻ",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU HYDRANTÓW WEWNĘTRZNYCH",
    fields: [
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_hyd_loc", label: "Lokalizacja hydrantu (budynek, piętro)", type: "text", remember: false, order: 3 },
      { id: "f_hyd_type", label: "Typ hydrantu (DN25 / DN52)", type: "text", remember: false, order: 4 },
      { id: "f_press_stat", label: "Ciśnienie statyczne [MPa]", type: "text", remember: false, order: 5 },
      { id: "f_press_dyn", label: "Ciśnienie dynamiczne [MPa]", type: "text", remember: false, order: 6 },
      { id: "f_flow", label: "Wydajność [dm³/s]", type: "text", remember: false, order: 7 },
      { id: "f_gauge", label: "Nr świadectwa wzorcowania manometru", type: "text", remember: true, order: 8 },
      { id: "f_hyd_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 9, tileOptions: [
        { id: "t_h1", label: "Sprawdzenie lokalizacji i oznakowania" },
        { id: "t_h2", label: "Sprawdzenie dostępności (nie jest zastawiony)" },
        { id: "t_h3", label: "Kontrola stanu szafki hydrantowej" },
        { id: "t_h4", label: "Kontrola wizualna węża" },
        { id: "t_h5", label: "Sprawdzenie sprawności zaworu" },
        { id: "t_h6", label: "Sprawdzenie obrotu bębna/zwijadła" },
        { id: "t_h7", label: "Pomiar ciśnienia statycznego" },
        { id: "t_h8", label: "Pomiar ciśnienia dynamicznego" },
        { id: "t_h9", label: "Sprawdzenie stanu prądownicy" },
        { id: "t_h10", label: "Próba ciśnieniowa węża (co 5 lat)" },
        { id: "t_h11", label: "Oznakowanie etykietą SPRAWDZONY" },
      ]},
      { id: "f_result", label: "Ocena (sprawny / niesprawny)", type: "text", remember: false, order: 10 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 11 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 12 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 13 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 14 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 15 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 6. ZDAWCZO-ODBIORCZY =====================
  {
    id: "starter_zdawczo",
    name: "Zdawczo-odbiorczy",
    description: "Protokół zdawczo-odbiorczy lokalu mieszkalnego",
    icon: "Home",
    category: "Nieruchomości",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ ZDAWCZO-ODBIORCZY",
    fields: [
      { id: "f_owner", label: "Przekazujący (imię, nazwisko, PESEL)", type: "text", remember: false, order: 0 },
      { id: "f_tenant", label: "Przejmujący (imię, nazwisko, PESEL)", type: "text", remember: false, order: 1 },
      { id: "f_address", label: "Adres lokalu", type: "text", remember: false, order: 2 },
      { id: "f_date", label: "Data przekazania", type: "date", remember: false, order: 3 },
      { id: "f_area", label: "Powierzchnia [m²]", type: "number", remember: false, order: 4 },
      { id: "f_rooms", label: "Liczba pomieszczeń", type: "number", remember: false, order: 5 },
      { id: "f_meter_e", label: "Licznik energii (nr + stan kWh)", type: "text", remember: false, order: 6 },
      { id: "f_meter_g", label: "Gazomierz (nr + stan m³)", type: "text", remember: false, order: 7 },
      { id: "f_meter_wz", label: "Wodomierz zimna (nr + stan m³)", type: "text", remember: false, order: 8 },
      { id: "f_meter_wc", label: "Wodomierz ciepła (nr + stan m³)", type: "text", remember: false, order: 9 },
      { id: "f_keys", label: "Liczba kluczy (drzwi, brama, piwnica)", type: "text", remember: false, order: 10 },
      { id: "f_deposit", label: "Kwota kaucji [PLN]", type: "number", remember: false, order: 11 },
      { id: "f_room_tiles", label: "Stan pomieszczeń", type: "tiles", remember: false, order: 12, tileOptions: [
        { id: "t_z1", label: "Kuchnia — blat, szafki, sprzęt AGD — OK" },
        { id: "t_z2", label: "Kuchnia — bateria, zlew, okap — OK" },
        { id: "t_z3", label: "Łazienka — wanna/kabina, toaleta, umywalka — OK" },
        { id: "t_z4", label: "Łazienka — baterie, odpływy, fuga — OK" },
        { id: "t_z5", label: "Pokój 1 — podłoga, ściany, okna — OK" },
        { id: "t_z6", label: "Pokój 2 — podłoga, ściany, okna — OK" },
        { id: "t_z7", label: "Przedpokój — drzwi wejściowe, domofon — OK" },
        { id: "t_z8", label: "Instalacja elektryczna — gniazdka, włączniki — OK" },
        { id: "t_z9", label: "Instalacja wodno-kanalizacyjna — OK" },
        { id: "t_z10", label: "Ogrzewanie / grzejniki — OK" },
        { id: "t_z11", label: "Balkon / taras — OK" },
      ]},
      { id: "f_equip", label: "Wyposażenie / inwentarz", type: "textarea", remember: false, order: 13 },
      { id: "f_damage", label: "Stwierdzone uszkodzenia / uwagi", type: "textarea", remember: false, order: 14 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 15 },
      { id: "sig_owner", label: "Podpis przekazującego", type: "signature", remember: false, order: 16 },
      { id: "sig_tenant", label: "Podpis przejmującego", type: "signature", remember: false, order: 17 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 7. WINDY / DŹWIGI =====================
  {
    id: "starter_winda",
    name: "Konserwacja windy",
    description: "Dziennik konserwacji dźwigu osobowego (UDT)",
    icon: "ArrowUpDown",
    category: "UDT",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ KONSERWACJI DŹWIGU",
    fields: [
      { id: "f_client", label: "Właściciel / zarządca budynku", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_dev_type", label: "Typ dźwigu (osobowy / towarowy)", type: "text", remember: false, order: 3 },
      { id: "f_dev_prod", label: "Producent / model", type: "text", remember: true, order: 4 },
      { id: "f_dev_serial", label: "Nr fabryczny", type: "text", remember: true, order: 5 },
      { id: "f_udt_nr", label: "Nr ewidencyjny UDT", type: "text", remember: true, order: 6 },
      { id: "f_capacity", label: "Udźwig [kg] / liczba przystanków", type: "text", remember: true, order: 7 },
      { id: "f_udt_cert", label: "Nr uprawnień konserwatora", type: "text", remember: true, order: 8 },
      { id: "f_lift_tiles", label: "Czynności konserwacyjne", type: "tiles", remember: false, order: 9, tileOptions: [
        { id: "t_l1", label: "Sprawdzenie lin nośnych (zużycie, pęknięcia)" },
        { id: "t_l2", label: "Kontrola hamulca — skuteczność" },
        { id: "t_l3", label: "Sprawdzenie rygli / zamków drzwi przystankowych" },
        { id: "t_l4", label: "Kontrola mechanizmu drzwi kabinowych i szybowych" },
        { id: "t_l5", label: "Test przycisku STOP" },
        { id: "t_l6", label: "Sprawdzenie oświetlenia kabiny" },
        { id: "t_l7", label: "Kontrola ogranicznika prędkości" },
        { id: "t_l8", label: "Sprawdzenie komunikacji alarmowej / interkomu" },
        { id: "t_l9", label: "Kontrola prowadnic kabiny i przeciwwagi" },
        { id: "t_l10", label: "Sprawdzenie buforów / zderzaków" },
        { id: "t_l11", label: "Kontrola wciągarki / napędu" },
        { id: "t_l12", label: "Smarowanie elementów ruchomych" },
        { id: "t_l13", label: "Sprawdzenie wyłączników krańcowych" },
        { id: "t_l14", label: "Kontrola chwytaczy" },
        { id: "t_l15", label: "Sprawdzenie dokładności zatrzymywania" },
        { id: "t_l16", label: "Kontrola instalacji elektrycznej" },
      ]},
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 10 },
      { id: "f_notes", label: "Stwierdzone usterki i uwagi", type: "textarea", remember: false, order: 11 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 12 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 13 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 8. HYDRAULIKA / CO =====================
  {
    id: "starter_co",
    name: "Przegląd kotła / CO",
    description: "Protokół przeglądu instalacji grzewczej i kotła",
    icon: "Thermometer",
    category: "Ogrzewanie",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU INSTALACJI GRZEWCZEJ",
    fields: [
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_boiler", label: "Kocioł (marka, model, moc kW)", type: "text", remember: false, order: 3 },
      { id: "f_boiler_sn", label: "Nr fabryczny kotła / rok produkcji", type: "text", remember: false, order: 4 },
      { id: "f_fuel", label: "Typ paliwa (gaz / olej / stałe / pompa ciepła)", type: "text", remember: false, order: 5 },
      { id: "f_press_co", label: "Ciśnienie w instalacji CO [bar]", type: "text", remember: false, order: 6 },
      { id: "f_press_vessel", label: "Ciśnienie w naczyniu wzbiorczym [bar]", type: "text", remember: false, order: 7 },
      { id: "f_analyzer", label: "Analizator spalin (typ, nr)", type: "text", remember: true, order: 8 },
      { id: "f_co_ppm", label: "CO [ppm] / sprawność [%]", type: "text", remember: false, order: 9 },
      { id: "f_co_tiles", label: "Czynności serwisowe", type: "tiles", remember: false, order: 10, tileOptions: [
        { id: "t_c1", label: "Kontrola wizualna kotła po zdjęciu obudowy" },
        { id: "t_c2", label: "Czyszczenie wymiennika od strony spalin" },
        { id: "t_c3", label: "Mycie bloku kotła środkiem chemicznym" },
        { id: "t_c4", label: "Kontrola palnika / czyszczenie palnika" },
        { id: "t_c5", label: "Kontrola elektrody zapłonowo-jonizacyjnej" },
        { id: "t_c6", label: "Kontrola uszczelki komory spalania" },
        { id: "t_c7", label: "Czyszczenie syfonu kondensatu" },
        { id: "t_c8", label: "Czyszczenie filtrów wody i gazu" },
        { id: "t_c9", label: "Sprawdzenie stanu anody magnezowej (CWU)" },
        { id: "t_c10", label: "Kontrola pracy w trybie CO i CWU" },
        { id: "t_c11", label: "Sprawdzenie historii alarmów / kodów błędów" },
        { id: "t_c12", label: "Analiza spalin — wydruk" },
        { id: "t_c13", label: "Kontrola naczynia wzbiorczego" },
        { id: "t_c14", label: "Odpowietrzenie instalacji CO" },
        { id: "t_c15", label: "Kontrola zaworów bezpieczeństwa" },
        { id: "t_c16", label: "Sprawdzenie pompy obiegowej" },
      ]},
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 11 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 12 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 13 },
      { id: "sig_tech", label: "Podpis serwisanta", type: "signature", remember: false, order: 14 },
      { id: "sig_client", label: "Podpis klienta", type: "signature", remember: false, order: 15 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 9. FOTOWOLTAIKA =====================
  {
    id: "starter_pv",
    name: "Przegląd fotowoltaiki",
    description: "Protokół przeglądu instalacji PV (PN-EN 62446)",
    icon: "Sun",
    category: "OZE",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU INSTALACJI FOTOWOLTAICZNEJ",
    fields: [
      { id: "f_client", label: "Właściciel instalacji", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres instalacji", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_power", label: "Moc zainstalowana [kWp]", type: "text", remember: false, order: 3 },
      { id: "f_panels", label: "Moduły PV (producent, typ, ilość)", type: "text", remember: false, order: 4 },
      { id: "f_inverter", label: "Falownik (producent, typ, nr seryjny)", type: "text", remember: false, order: 5 },
      { id: "f_strings", label: "Ilość stringów / konfiguracja", type: "text", remember: false, order: 6 },
      { id: "f_meter", label: "Przyrząd pomiarowy (typ, nr, kalibracja)", type: "text", remember: true, order: 7 },
      { id: "f_sep", label: "Nr uprawnień SEP", type: "text", remember: true, order: 8 },
      { id: "f_production", label: "Odczyt produkcji z falownika [kWh]", type: "text", remember: false, order: 9 },
      { id: "f_pv_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 10, tileOptions: [
        { id: "t_p1", label: "Kontrola wizualna paneli (pęknięcia, przebarwienia)" },
        { id: "t_p2", label: "Sprawdzenie zabrudzenia / czyszczenie paneli" },
        { id: "t_p3", label: "Kontrola mocowań konstrukcji i klem" },
        { id: "t_p4", label: "Sprawdzenie kabli DC i konektorów MC4" },
        { id: "t_p5", label: "Kontrola ogranicznika przepięć DC i AC" },
        { id: "t_p6", label: "Sprawdzenie rozłącznika DC" },
        { id: "t_p7", label: "Test ciągłości uziemienia" },
        { id: "t_p8", label: "Pomiar Voc i Isc per string" },
        { id: "t_p9", label: "Pomiar rezystancji izolacji DC" },
        { id: "t_p10", label: "Sprawdzenie działania falownika" },
        { id: "t_p11", label: "Odczyt komunikatów błędów falownika" },
        { id: "t_p12", label: "Kontrola odprowadzania wody z dachu" },
        { id: "t_p13", label: "Korozja elementów metalowych" },
        { id: "t_p14", label: "Odstępy od zwodów piorunochronnych" },
      ]},
      { id: "f_result", label: "Ocena (nadaje się / nie nadaje się do eksploatacji)", type: "text", remember: false, order: 11 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 12 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 13 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 14 },
      { id: "sig_tech", label: "Podpis inspektora", type: "signature", remember: false, order: 15 },
      { id: "sig_client", label: "Podpis właściciela", type: "signature", remember: false, order: 16 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },

  // ===================== 10. WENTYLACJA MECHANICZNA =====================
  {
    id: "starter_went",
    name: "Przegląd wentylacji",
    description: "Protokół przeglądu wentylacji mechanicznej",
    icon: "Fan",
    category: "Wentylacja",
    builtIn: true,
    pdfTitle: "PROTOKÓŁ PRZEGLĄDU WENTYLACJI MECHANICZNEJ",
    fields: [
      { id: "f_client", label: "Właściciel / zarządca", type: "text", remember: false, order: 0 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 1 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 2 },
      { id: "f_ahu", label: "Centrala wentylacyjna (marka, model)", type: "text", remember: false, order: 3 },
      { id: "f_ahu_sn", label: "Nr fabryczny centrali", type: "text", remember: false, order: 4 },
      { id: "f_area", label: "Powierzchnia wentylowana [m²]", type: "number", remember: false, order: 5 },
      { id: "f_airflow", label: "Projektowy strumień powietrza [m³/h]", type: "text", remember: false, order: 6 },
      { id: "f_anemometer", label: "Anemometr (typ, nr, kalibracja)", type: "text", remember: true, order: 7 },
      { id: "f_went_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 8, tileOptions: [
        { id: "t_w1", label: "Czyszczenie czerpni i wyrzutni powietrza" },
        { id: "t_w2", label: "Czyszczenie i dezynfekcja filtrów" },
        { id: "t_w3", label: "Wymiana filtrów (jeśli wymagana)" },
        { id: "t_w4", label: "Czyszczenie kratek nawiewnych i wywiewnych" },
        { id: "t_w5", label: "Kontrola elementów ruchomych (łożyska, tuleje)" },
        { id: "t_w6", label: "Sprawdzenie urządzeń sterowniczych" },
        { id: "t_w7", label: "Pomiar spadku ciśnienia na filtrach" },
        { id: "t_w8", label: "Kontrola wydatku powietrza kratek" },
        { id: "t_w9", label: "Sprawdzenie wymiennika ciepła (obrotowy/krzyżowy)" },
        { id: "t_w10", label: "Kontrola paska napędzającego rekuperator" },
        { id: "t_w11", label: "Drożność odprowadzenia skroplin z rekuperatora" },
        { id: "t_w12", label: "Kontrola szczelności przewodów (taśmy, mastyk)" },
        { id: "t_w13", label: "Kontrola izolacji przewodów wentylacyjnych" },
        { id: "t_w14", label: "Sprawdzenie klap przeciwpożarowych" },
        { id: "t_w15", label: "Dezynfekcja i odgrzybianie (środki PZH)" },
        { id: "t_w16", label: "Kontrola poziomu hałasu" },
      ]},
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 9 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 10 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 11 },
      { id: "sig_tech", label: "Podpis wykonawcy", type: "signature", remember: false, order: 12 },
      { id: "sig_client", label: "Podpis właściciela", type: "signature", remember: false, order: 13 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
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
  const now = Date.now();
  return saveUserTemplate({
    id: `user_${now}`,
    name,
    description: "",
    icon: "FileText",
    category: "Własne",
    builtIn: false,
    pdfTitle: name.toUpperCase(),
    fields: [],
    tiles: [],
    hasPhotos: false,
    signatureFields: [],
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

/** Count total tile options across all tiles-type fields */
export function countTileOptions(template: ReportTemplate): number {
  return template.fields
    .filter((f) => f.type === "tiles")
    .reduce((sum, f) => sum + (f.tileOptions?.length || 0), 0);
}

/** Get all tile options from all tiles-type fields (flat) */
export function getAllTileOptions(template: ReportTemplate): import("./storage").TileItem[] {
  return template.fields
    .filter((f) => f.type === "tiles")
    .flatMap((f) => f.tileOptions || []);
}
