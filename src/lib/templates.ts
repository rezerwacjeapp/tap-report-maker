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
    fields: [{ id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 1 }],
  },
  {
    id: "fb_client_address",
    category: "Dane klienta",
    label: "Adres obiektu",
    fields: [{ id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 2 }],
  },
  {
    id: "fb_client_phone",
    category: "Dane klienta",
    label: "Telefon klienta",
    fields: [{ id: "f_phone", label: "Telefon klienta", type: "text", remember: false, order: 3 }],
  },
  {
    id: "fb_client_email",
    category: "Dane klienta",
    label: "Email klienta",
    fields: [{ id: "f_email", label: "Email klienta", type: "text", remember: false, order: 4 }],
  },
  {
    id: "fb_contact_person",
    category: "Dane klienta",
    label: "Osoba kontaktowa",
    fields: [{ id: "f_contact", label: "Osoba kontaktowa", type: "text", remember: false, order: 5 }],
  },

  // --- Data i czas ---
  {
    id: "fb_date",
    category: "Data i czas",
    label: "Data wykonania",
    fields: [{ id: "f_date", label: "Data wykonania", type: "date", remember: false, order: 6 }],
  },
  {
    id: "fb_date_next",
    category: "Data i czas",
    label: "Data następnego przeglądu",
    fields: [{ id: "f_date_next", label: "Data następnego przeglądu", type: "date", remember: false, order: 7 }],
  },
  {
    id: "fb_contract_nr",
    category: "Data i czas",
    label: "Numer umowy / zlecenia",
    fields: [{ id: "f_contract", label: "Numer umowy / zlecenia", type: "text", remember: false, order: 8 }],
  },

  // --- Obiekt / miejsce ---
  {
    id: "fb_object_name",
    category: "Obiekt / miejsce",
    label: "Nazwa obiektu",
    fields: [{ id: "f_obj_name", label: "Nazwa obiektu", type: "text", remember: false, order: 9 }],
  },
  {
    id: "fb_object_location",
    category: "Obiekt / miejsce",
    label: "Lokalizacja",
    fields: [{ id: "f_obj_loc", label: "Lokalizacja", type: "text", remember: false, order: 10 }],
  },
  {
    id: "fb_object_number",
    category: "Obiekt / miejsce",
    label: "Numer / oznaczenie",
    fields: [{ id: "f_obj_num", label: "Numer / oznaczenie", type: "text", remember: false, order: 11 }],
  },
  {
    id: "fb_object_desc",
    category: "Obiekt / miejsce",
    label: "Opis",
    fields: [{ id: "f_obj_desc", label: "Opis", type: "textarea", remember: false, order: 12 }],
  },

  // --- Inne ---
  {
    id: "fb_notes",
    category: "Inne",
    label: "Uwagi",
    fields: [{ id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 13 }],
  },
  {
    id: "fb_condition",
    category: "Inne",
    label: "Stan ogólny",
    fields: [{ id: "f_condition", label: "Stan ogólny", type: "textarea", remember: false, order: 14 }],
  },
  {
    id: "fb_recommendations",
    category: "Inne",
    label: "Zalecenia",
    fields: [{ id: "f_recommend", label: "Zalecenia", type: "textarea", remember: false, order: 15 }],
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
      { id: "h_legal", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 16 },
      { id: "i_legal", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 17, content: "Rozporządzenie PE i Rady (UE) 2024/573 z 7.02.2024 r. w sprawie fluorowanych gazów cieplarnianych.\nUstawa z 15.05.2015 r. o substancjach zubożających warstwę ozonową (Dz.U. z 2020 r. poz. 2065).\nArt. 62 ust. 1 pkt 1 lit. c ustawy Prawo budowlane — kontrola roczna instalacji." },
      { id: "h_client", label: "Dane klienta i obiektu", type: "heading" as CustomFieldType, remember: false, order: 18 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 19 },
      { id: "f_client", label: "Nazwa klienta", type: "text", remember: false, order: 20 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 21 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 22 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 23 },
      { id: "f_service_company", label: "Firma serwisowa (nazwa, adres, NIP)", type: "text", remember: true, order: 24 },
      { id: "h_device", label: "Dane urządzenia", type: "heading" as CustomFieldType, remember: false, order: 25 },
      { id: "f_dev_int", label: "Jedn. wewnętrzna (marka, model, nr fab.)", type: "text", remember: false, order: 26 },
      { id: "f_dev_ext", label: "Jedn. zewnętrzna (marka, model, nr fab.)", type: "text", remember: false, order: 27 },
      { id: "h_fgas", label: "Dane czynnika chłodniczego (F-gaz)", type: "heading" as CustomFieldType, remember: false, order: 28 },
      { id: "i_fgas", label: "Obowiązki F-gaz", type: "info" as CustomFieldType, remember: false, order: 29, content: "Dla urządzeń zawierających ≥5 ton ekwiwalentu CO₂ wymagane jest założenie Karty Urządzenia w CRO i uzupełnianie jej po każdej czynności serwisowej (w ciągu 15 dni roboczych). Protokół przechowywany min. 5 lat." },
      { id: "f_refrig", label: "Rodzaj czynnika (R32, R410A...)", type: "text", remember: true, order: 30 },
      { id: "f_refrig_gwp", label: "Wartość GWP czynnika", type: "number", remember: true, order: 31 },
      { id: "f_refrig_kg", label: "Ilość czynnika w instalacji [kg]", type: "number", remember: false, order: 32 },
      { id: "f_refrig_co2eq", label: "Ekwiwalent CO₂ [tony] (ilość × GWP / 1000)", type: "text", remember: false, order: 33 },
      { id: "f_refrig_add", label: "Ilość uzupełnionego czynnika [kg]", type: "number", remember: false, order: 34 },
      { id: "f_refrig_recovered", label: "Ilość odzyskanego czynnika [kg]", type: "number", remember: false, order: 35 },
      { id: "f_refrig_origin", label: "Pochodzenie czynnika (dziewiczy / odzyskany / regenerowany)", type: "text", remember: false, order: 36 },
      { id: "f_cro_card", label: "Nr Karty Urządzenia w CRO", type: "text", remember: true, order: 37 },
      { id: "f_cro_activity", label: "Rodzaj czynności CRO (serwis / kontrola szczelności / uzupełnienie)", type: "text", remember: false, order: 38 },
      { id: "h_measurements", label: "Pomiary i kontrola szczelności", type: "heading" as CustomFieldType, remember: false, order: 39 },
      { id: "f_pressure_s", label: "Ciśnienie ssania [bar]", type: "text", remember: false, order: 40 },
      { id: "f_pressure_t", label: "Ciśnienie tłoczenia [bar]", type: "text", remember: false, order: 41 },
      { id: "f_fgaz_cert", label: "Nr certyfikatu F-gaz osobistego", type: "text", remember: true, order: 42 },
      { id: "f_fgaz_cert_company", label: "Nr certyfikatu F-gaz przedsiębiorstwa", type: "text", remember: true, order: 43 },
      { id: "f_leak_result", label: "Wynik kontroli szczelności (szczelna / nieszczelna)", type: "text", remember: false, order: 44 },
      { id: "f_leak_method", label: "Metoda kontroli szczelności (detektor / ciśnieniowa / pianka)", type: "text", remember: false, order: 45 },
      { id: "f_lds", label: "System wykrywania wycieków LDS zainstalowany (tak / nie)", type: "text", remember: true, order: 46 },
      { id: "h_service", label: "Czynności serwisowe", type: "heading" as CustomFieldType, remember: false, order: 47 },
      { id: "f_klima_tiles", label: "Czynności serwisowe", type: "tiles", remember: false, order: 48, tileOptions: [
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
        { id: "t_k17", label: "Pomiar przegrzania / dochłodzenia" },
        { id: "t_k18", label: "Pomiar różnicy temperatur nawiew / wywiew" },
      ]},
      { id: "h_summary", label: "Podsumowanie i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 49 },
      { id: "f_prev_recommendations", label: "Zalecenia z poprzedniej kontroli i ich realizacja", type: "textarea", remember: false, order: 50 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 51 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 52 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 53 },
      { id: "sig_tech", label: "Podpis serwisanta", type: "signature", remember: false, order: 54 },
      { id: "sig_client", label: "Podpis klienta", type: "signature", remember: false, order: 55 },
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
      { id: "h_legal", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Art. 62 ust. 1 pkt 2 ustawy Prawo budowlane — kontrola co 5 lat.\nPN-HD 60364-6:2016-07 — Sprawdzanie instalacji elektrycznych niskiego napięcia.\nRozporządzenie MSWiA z 16.08.1999 r. (§4–6) — warunki techniczne użytkowania budynków." },
      { id: "h_obj", label: "Dane obiektu i zleceniodawcy", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 6 },
      { id: "f_building_cat", label: "Kategoria zagrożenia ludzi (ZL I–V / PM / IN)", type: "text", remember: false, order: 7 },
      { id: "f_date", label: "Data pomiarów", type: "date", remember: false, order: 8 },
      { id: "f_legal_basis", label: "Podstawa prawna (Art. 62 ust. 1 pkt 2 PB)", type: "text", remember: true, order: 9 },
      { id: "f_type", label: "Rodzaj badania (odbiorcze / okresowe)", type: "text", remember: false, order: 10 },
      { id: "f_scope", label: "Zakres kontroli (co objęto / co pominięto)", type: "textarea", remember: false, order: 11 },
      { id: "h_install", label: "Parametry instalacji", type: "heading" as CustomFieldType, remember: false, order: 12 },
      { id: "f_network", label: "Układ sieci (TN-S / TN-C-S / TT)", type: "text", remember: false, order: 13 },
      { id: "f_voltage", label: "Napięcie znamionowe Un/Uo [V] (np. 230/400)", type: "text", remember: false, order: 14 },
      { id: "h_exec", label: "Dane wykonawcy i przyrządów", type: "heading" as CustomFieldType, remember: false, order: 15 },
      { id: "i_meter", label: "Uwaga", type: "info" as CustomFieldType, remember: false, order: 16, content: "Przyrządy pomiarowe muszą posiadać aktualne świadectwa wzorcowania/kalibracji zgodnie z PN-EN 61557. Brak ważnego świadectwa unieważnia protokół." },
      { id: "f_meter", label: "Przyrząd pomiarowy (typ, nr)", type: "text", remember: true, order: 17 },
      { id: "f_meter_cal", label: "Data ważności kalibracji", type: "date", remember: true, order: 18 },
      { id: "f_conditions", label: "Warunki pomiaru (temp. °C, wilgotność %, pogoda)", type: "text", remember: false, order: 19 },
      { id: "f_company", label: "Firma wykonująca (nazwa, adres, NIP)", type: "text", remember: true, order: 20 },
      { id: "f_sep_e", label: "Wykonujący — imię, nazwisko, nr SEP E, ważność", type: "text", remember: true, order: 21 },
      { id: "f_sep_d", label: "Sprawdzający — imię, nazwisko, nr SEP D, ważność", type: "text", remember: true, order: 22 },
      { id: "h_checks", label: "Wykonane pomiary i oględziny", type: "heading" as CustomFieldType, remember: false, order: 23 },
      { id: "f_elec_tiles", label: "Wykonane pomiary i oględziny", type: "tiles", remember: false, order: 24, tileOptions: [
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
        { id: "t_e13", label: "Kontrola biegunowości łączników jednobiegunowych" },
        { id: "t_e14", label: "Sprawdzenie ograniczników przepięć (SPD)" },
        { id: "t_e15", label: "Kontrola przekrojów przewodów i spadku napięcia" },
        { id: "t_e16", label: "Sprawdzenie ochrony termicznej i przegród ogniowych" },
        { id: "t_e17", label: "Kontrola schematów i oznaczeń w tablicach" },
      ]},
      { id: "h_results", label: "Wyniki pomiarów", type: "heading" as CustomFieldType, remember: false, order: 25 },
      { id: "i_order", label: "Kolejność", type: "info" as CustomFieldType, remember: false, order: 26, content: "Zgodnie z PN-HD 60364-6 pomiary wykonuje się w kolejności: ciągłość PE → rezystancja izolacji → ochrona SELV/PELV → samoczynne wyłączanie → ochrona uzupełniająca → biegunowość → kolejność faz → próby funkcjonalne." },
      { id: "f_res_izolacja", label: "Wyniki — rezystancja izolacji (obwód / L-PE / L-N / Uprob / ocena)", type: "textarea", remember: false, order: 27 },
      { id: "f_res_petla", label: "Wyniki — impedancja pętli zwarcia (obwód / zabezp. / In / Zs zmierz. / Zs dop. / Ik / ocena)", type: "textarea", remember: false, order: 28 },
      { id: "f_res_rcd", label: "Wyniki — wyłączniki RCD (ID / typ / IΔn / czas ½× / 1× / 5× / prąd wyzw. / ocena)", type: "textarea", remember: false, order: 29 },
      { id: "f_res_pe", label: "Wyniki — ciągłość PE (obwód / R [mΩ] / ocena)", type: "textarea", remember: false, order: 30 },
      { id: "f_res_uziemienie", label: "Wyniki — rezystancja uziemienia (punkt / R [Ω] / metoda / ocena)", type: "textarea", remember: false, order: 31 },
      { id: "h_summary", label: "Podsumowanie", type: "heading" as CustomFieldType, remember: false, order: 32 },
      { id: "f_result", label: "Wynik ogólny (pozytywny / negatywny)", type: "text", remember: false, order: 33 },
      { id: "f_prev_recommendations", label: "Zalecenia z poprzedniej kontroli i ich realizacja", type: "textarea", remember: false, order: 34 },
      { id: "f_next_date", label: "Data następnego badania", type: "date", remember: false, order: 35 },
      { id: "f_notes", label: "Uwagi i zalecenia z terminami", type: "textarea", remember: false, order: 36 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 37 },
      { id: "sig_exec", label: "Podpis wykonującego (SEP E)", type: "signature", remember: false, order: 38 },
      { id: "sig_check", label: "Podpis sprawdzającego (SEP D)", type: "signature", remember: false, order: 39 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 40 },
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
      { id: "h_legal", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal3", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Art. 62 ust. 1 pkt 1 lit. c ustawy Prawo budowlane — coroczna kontrola instalacji gazowej.\n§47 Rozporządzenia MSWiA z 16.08.1999 r. — kontrola gazowa jednocześnie z kominiarską.\nPN-M-34507:2002 — Instalacja gazowa. Kontrola okresowa." },
      { id: "h_obj3", label: "Dane obiektu", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Właściciel / zarządca", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_tenant", label: "Lokator / najemca", type: "text", remember: false, order: 6 },
      { id: "f_address", label: "Adres budynku / lokalu", type: "text", remember: false, order: 7 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 8 },
      { id: "f_legal_basis", label: "Podstawa prawna (Art. 62 ust. 1 pkt 1c PB)", type: "text", remember: true, order: 9 },
      { id: "h_exec3", label: "Dane kontrolującego", type: "heading" as CustomFieldType, remember: false, order: 10 },
      { id: "i_qualif3", label: "Kwalifikacje", type: "info" as CustomFieldType, remember: false, order: 11, content: "Kontrolę instalacji gazowej może przeprowadzać osoba posiadająca uprawnienia budowlane instalacyjne (sanitarne) lub kwalifikacje dozorowe G3D." },
      { id: "f_company", label: "Firma kontrolująca (nazwa, adres, NIP)", type: "text", remember: true, order: 12 },
      { id: "f_g3d", label: "Nr uprawnień G3D kontrolującego", type: "text", remember: true, order: 13 },
      { id: "f_g3d_validity", label: "Ważność uprawnień G3D", type: "date", remember: true, order: 14 },
      { id: "h_install3", label: "Dane instalacji i urządzeń gazowych", type: "heading" as CustomFieldType, remember: false, order: 15 },
      { id: "f_gas_type", label: "Rodzaj gazu (sieciowy / butlowy)", type: "text", remember: false, order: 16 },
      { id: "f_gas_pressure", label: "Ciśnienie gazu na gazomierzu [mbar]", type: "text", remember: false, order: 17 },
      { id: "f_meter_nr", label: "Nr gazomierza / odczyt", type: "text", remember: false, order: 18 },
      { id: "f_appliances", label: "Urządzenia gazowe (typ A/B/C, marka, moc)", type: "textarea", remember: false, order: 19 },
      { id: "f_boiler", label: "Kocioł (marka, typ, moc, nr fab.)", type: "text", remember: false, order: 20 },
      { id: "h_flue3", label: "Analiza spalin", type: "heading" as CustomFieldType, remember: false, order: 21 },
      { id: "f_analyzer", label: "Analizator spalin (typ, nr, legalizacja)", type: "text", remember: true, order: 22 },
      { id: "f_co_ppm", label: "Stężenie CO [ppm]", type: "text", remember: false, order: 23 },
      { id: "f_co2_pct", label: "Zawartość CO₂ [%]", type: "text", remember: false, order: 24 },
      { id: "f_o2_pct", label: "Zawartość O₂ [%]", type: "text", remember: false, order: 25 },
      { id: "f_flue_temp", label: "Temperatura spalin [°C]", type: "text", remember: false, order: 26 },
      { id: "f_efficiency", label: "Sprawność paleniskowa [%]", type: "text", remember: false, order: 27 },
      { id: "h_vent3", label: "Wentylacja pomieszczeń", type: "heading" as CustomFieldType, remember: false, order: 28 },
      { id: "f_vent_supply", label: "Wymiary otworu nawiewnego [cm²]", type: "text", remember: false, order: 29 },
      { id: "f_vent_extract", label: "Wymiary otworu wywiewnego [cm²]", type: "text", remember: false, order: 30 },
      { id: "f_chimney_draft", label: "Ciąg kominowy [Pa]", type: "text", remember: false, order: 31 },
      { id: "h_checks3", label: "Czynności kontrolne", type: "heading" as CustomFieldType, remember: false, order: 32 },
      { id: "f_gas_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 33, tileOptions: [
        { id: "t_g1", label: "Kontrola szczelności instalacji gazowej" },
        { id: "t_g2", label: "Ocena stanu przewodów gazowych i połączeń" },
        { id: "t_g3", label: "Sprawdzenie zaworu odcinającego (główny)" },
        { id: "t_g4", label: "Kontrola złącza izolującego" },
        { id: "t_g5", label: "Kontrola drożności wentylacji nawiewnej" },
        { id: "t_g6", label: "Kontrola drożności wentylacji wywiewnej" },
        { id: "t_g7", label: "Sprawdzenie ciągu kominowego" },
        { id: "t_g8", label: "Sprawdzenie czujnika tlenku węgla" },
        { id: "t_g9", label: "Kontrola pracy kotła w trybie CO" },
        { id: "t_g10", label: "Kontrola pracy kotła w trybie CWU" },
        { id: "t_g11", label: "Czyszczenie wymiennika ciepła" },
        { id: "t_g12", label: "Analiza spalin" },
        { id: "t_g13", label: "Kontrola palnika / czyszczenie palnika" },
        { id: "t_g14", label: "Kontrola elektrody zapłonowo-jonizacyjnej" },
        { id: "t_g15", label: "Czyszczenie syfonu kondensatu" },
        { id: "t_g16", label: "Kontrola zaworu bezpieczeństwa" },
        { id: "t_g17", label: "Sprawdzenie szczelności układu spalinowego" },
        { id: "t_g18", label: "Kontrola kubatury pomieszczenia z urządzeniem gazowym" },
      ]},
      { id: "h_summary3", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 34 },
      { id: "f_result", label: "Ocena ogólna (sprawna / niesprawna / warunkowo sprawna)", type: "text", remember: false, order: 35 },
      { id: "f_prev_recommendations", label: "Zalecenia z poprzedniej kontroli i ich realizacja", type: "textarea", remember: false, order: 36 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 37 },
      { id: "f_notes", label: "Uwagi i zalecenia z terminami", type: "textarea", remember: false, order: 38 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 39 },
      { id: "sig_tech", label: "Podpis kontrolującego", type: "signature", remember: false, order: 40 },
      { id: "sig_client", label: "Podpis właściciela / lokatora", type: "signature", remember: false, order: 41 },
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
      { id: "h_legal4", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal4", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 1, content: "§3 ust. 2–3 Rozporządzenia MSWiA z 7.06.2010 r. — przegląd nie rzadziej niż raz w roku.\nPN-EN 3-7 do PN-EN 3-10 — gaśnice przenośne.\nWymiana środka gaśniczego: proszkowe co 5 lat, śniegowe co 10 lat." },
      { id: "h_obj4", label: "Dane obiektu", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 6 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 7 },
      { id: "f_service_company", label: "Firma serwisowa (nazwa, adres)", type: "text", remember: true, order: 8 },
      { id: "f_maint_type", label: "Rodzaj konserwacji (podstawowa / rozszerzona / remont)", type: "text", remember: false, order: 9 },
      { id: "h_device4", label: "Dane gaśnicy", type: "heading" as CustomFieldType, remember: false, order: 10 },
      { id: "f_ext_id", label: "Nr ewidencyjny gaśnicy", type: "text", remember: false, order: 11 },
      { id: "f_ext_type", label: "Typ gaśnicy (GP/GS/GW/GWG/AS)", type: "text", remember: false, order: 12 },
      { id: "f_ext_cap", label: "Pojemność / masa [kg]", type: "text", remember: false, order: 13 },
      { id: "f_ext_rating", label: "Skuteczność gaśnicza (np. 21A 113B C)", type: "text", remember: false, order: 14 },
      { id: "f_ext_fire_classes", label: "Klasy pożaru (A / B / C / D / F)", type: "text", remember: false, order: 15 },
      { id: "f_ext_manufacturer", label: "Producent gaśnicy", type: "text", remember: false, order: 16 },
      { id: "f_ext_serial", label: "Nr fabryczny zbiornika", type: "text", remember: false, order: 17 },
      { id: "f_ext_prod", label: "Data produkcji", type: "text", remember: false, order: 18 },
      { id: "f_ext_udt", label: "Data ważności legalizacji UDT", type: "date", remember: false, order: 19 },
      { id: "f_ext_last_extended", label: "Data ostatniego przeglądu rozszerzonego (co 5 lat)", type: "date", remember: false, order: 20 },
      { id: "f_ext_last_overhaul", label: "Data ostatniego remontu (co 10 lat)", type: "date", remember: false, order: 21 },
      { id: "f_ext_loc", label: "Lokalizacja w obiekcie", type: "text", remember: false, order: 22 },
      { id: "h_checks4", label: "Czynności kontrolne", type: "heading" as CustomFieldType, remember: false, order: 23 },
      { id: "f_ext_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 24, tileOptions: [
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
        { id: "t_x13", label: "Kontrola stanu środka gaśniczego (sypkość proszku / ważność piany)" },
        { id: "t_x14", label: "Kontrola uchwytu / wieszaka ściennego" },
        { id: "t_x15", label: "Kontrola naboju gazowego (gaśnice typ Z)" },
      ]},
      { id: "h_summary4", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 25 },
      { id: "f_result", label: "Ocena (sprawna / niesprawna / do naprawy)", type: "text", remember: false, order: 26 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 27 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 28 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 29 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 30 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 31 },
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
      { id: "h_legal5", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal5", label: "Przepisy i normy", type: "info" as CustomFieldType, remember: false, order: 1, content: "§3 ust. 2–3 Rozporządzenia MSWiA z 7.06.2010 r. — przegląd nie rzadziej niż raz w roku.\nPN-EN 671-1:2012 — hydranty wewnętrzne z wężem półsztywnym.\nPN-EN 671-3:2009 — konserwacja hydrantów.\nMin. ciśnienie dynamiczne: ≥0,2 MPa. Wydajność DN25: ≥1,0 dm³/s, DN52: ≥2,5 dm³/s.\nPróba ciśnieniowa węża: co 5 lat." },
      { id: "h_obj5", label: "Dane obiektu", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 6 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 7 },
      { id: "f_service_company", label: "Firma serwisowa (nazwa, adres)", type: "text", remember: true, order: 8 },
      { id: "f_water_supply", label: "Typ zasilania w wodę (sieciowe / pompownia / zbiornik)", type: "text", remember: false, order: 9 },
      { id: "h_device5", label: "Dane hydrantu", type: "heading" as CustomFieldType, remember: false, order: 10 },
      { id: "f_hyd_id", label: "Nr identyfikacyjny hydrantu", type: "text", remember: false, order: 11 },
      { id: "f_hyd_loc", label: "Lokalizacja hydrantu (budynek, piętro)", type: "text", remember: false, order: 12 },
      { id: "f_hyd_type", label: "Typ hydrantu (DN25 / DN33 / DN52)", type: "text", remember: false, order: 13 },
      { id: "f_hose_length", label: "Długość węża [m] / data produkcji", type: "text", remember: false, order: 14 },
      { id: "h_meas5", label: "Pomiary ciśnienia i wydajności", type: "heading" as CustomFieldType, remember: false, order: 15 },
      { id: "f_press_stat", label: "Ciśnienie statyczne [MPa]", type: "text", remember: false, order: 16 },
      { id: "f_press_dyn", label: "Ciśnienie dynamiczne [MPa] (min. 0,2 MPa)", type: "text", remember: false, order: 17 },
      { id: "f_flow", label: "Wydajność [dm³/s] (min. DN25: 1,0 / DN33: 1,5 / DN52: 2,5)", type: "text", remember: false, order: 18 },
      { id: "f_gauge", label: "Nr świadectwa wzorcowania manometru", type: "text", remember: true, order: 19 },
      { id: "h_checks5", label: "Czynności kontrolne", type: "heading" as CustomFieldType, remember: false, order: 20 },
      { id: "f_hyd_tiles", label: "Czynności kontrolne wg PN-EN 671-3", type: "tiles", remember: false, order: 21, tileOptions: [
        { id: "t_h1", label: "Sprawdzenie lokalizacji i oznakowania" },
        { id: "t_h2", label: "Sprawdzenie dostępności (nie jest zastawiony)" },
        { id: "t_h3", label: "Kontrola stanu szafki hydrantowej" },
        { id: "t_h4", label: "Kontrola uchwytów ściennych (zamocowanie, stan)" },
        { id: "t_h5", label: "Kontrola wizualna węża (pęknięcia, odkształcenia)" },
        { id: "t_h6", label: "Kontrola klamer i opasek węża" },
        { id: "t_h7", label: "Sprawdzenie sprawności zaworu" },
        { id: "t_h8", label: "Sprawdzenie obrotu bębna / zwijadła" },
        { id: "t_h9", label: "Sprawdzenie zwijadeł wahliwych — obrót i kąty min." },
        { id: "t_h10", label: "Kontrola stanu rurociągu zasilającego i elastycznych przewodów" },
        { id: "t_h11", label: "Sprawdzenie prowadnicy węża" },
        { id: "t_h12", label: "Pomiar ciśnienia statycznego" },
        { id: "t_h13", label: "Pomiar ciśnienia dynamicznego" },
        { id: "t_h14", label: "Sprawdzenie stanu prądownicy" },
        { id: "t_h15", label: "Próba ciśnieniowa węża (co 5 lat)" },
        { id: "t_h16", label: "Oznakowanie etykietą SPRAWDZONY / USZKODZONY" },
        { id: "t_h17", label: "Kontrola zaworu automatycznego i odcinającego (zwijadła autom.)" },
      ]},
      { id: "h_summary5", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 22 },
      { id: "f_parts_replaced", label: "Wymienione części", type: "textarea", remember: false, order: 23 },
      { id: "f_result", label: "Ocena (sprawny / niesprawny)", type: "text", remember: false, order: 24 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 25 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 26 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 27 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 28 },
      { id: "sig_client", label: "Podpis zleceniodawcy", type: "signature", remember: false, order: 29 },
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
      { id: "i_legal6", label: "Informacja prawna", type: "info" as CustomFieldType, remember: false, order: 0, content: "Art. 6c Ustawy z 21.06.2001 r. o ochronie praw lokatorów — obowiązek sporządzenia protokołu przy najmie.\nArt. 675 §1 KC — obowiązek zwrotu lokalu w stanie niepogorszonym.\nProtokół stanowi podstawę rozliczeń przy zwrocie lokalu." },
      { id: "h_parties", label: "Strony protokołu", type: "heading" as CustomFieldType, remember: false, order: 1 },
      { id: "f_type", label: "Rodzaj protokołu (przekazanie / zwrot)", type: "text", remember: false, order: 2 },
      { id: "f_lease_ref", label: "Nr umowy najmu / data zawarcia", type: "text", remember: false, order: 3 },
      { id: "f_owner", label: "Przekazujący (imię, nazwisko, PESEL / nr dowodu)", type: "text", remember: false, order: 4 },
      { id: "f_owner_contact", label: "Telefon / email przekazującego", type: "text", remember: false, order: 5 },
      { id: "f_tenant", label: "Przejmujący (imię, nazwisko, PESEL / nr dowodu)", type: "text", remember: false, order: 6 },
      { id: "f_tenant_contact", label: "Telefon / email przejmującego", type: "text", remember: false, order: 7 },
      { id: "h_property", label: "Opis lokalu", type: "heading" as CustomFieldType, remember: false, order: 8 },
      { id: "f_address", label: "Adres lokalu", type: "text", remember: false, order: 9 },
      { id: "f_floor", label: "Piętro", type: "text", remember: false, order: 10 },
      { id: "f_date", label: "Data przekazania", type: "date", remember: false, order: 11 },
      { id: "f_area", label: "Powierzchnia [m²]", type: "number", remember: false, order: 12 },
      { id: "f_rooms", label: "Liczba pomieszczeń", type: "number", remember: false, order: 13 },
      { id: "h_meters", label: "Stany liczników", type: "heading" as CustomFieldType, remember: false, order: 14 },
      { id: "f_meter_e", label: "Licznik energii (nr + stan kWh)", type: "text", remember: false, order: 15 },
      { id: "f_meter_e_t2", label: "Licznik energii T2 / noc (jeśli taryfa G12)", type: "text", remember: false, order: 16 },
      { id: "f_meter_g", label: "Gazomierz (nr + stan m³)", type: "text", remember: false, order: 17 },
      { id: "f_meter_wz", label: "Wodomierz zimna (nr + stan m³)", type: "text", remember: false, order: 18 },
      { id: "f_meter_wc", label: "Wodomierz ciepła (nr + stan m³)", type: "text", remember: false, order: 19 },
      { id: "f_meter_heat", label: "Ciepłomierz (nr + stan GJ)", type: "text", remember: false, order: 20 },
      { id: "h_keys", label: "Klucze i kaucja", type: "heading" as CustomFieldType, remember: false, order: 21 },
      { id: "f_keys", label: "Klucze: mieszkanie / klatka / piwnica / skrzynka / brama / pilot", type: "text", remember: false, order: 22 },
      { id: "f_deposit", label: "Kwota kaucji [PLN]", type: "number", remember: false, order: 23 },
      { id: "h_condition", label: "Stan pomieszczeń", type: "heading" as CustomFieldType, remember: false, order: 24 },
      { id: "f_room_tiles", label: "Stan pomieszczeń (stopień zużycia: nowy/dobry/zużyty/uszkodzony)", type: "tiles", remember: false, order: 25, tileOptions: [
        { id: "t_z1", label: "Kuchnia — blat, szafki, sprzęt AGD — OK" },
        { id: "t_z2", label: "Kuchnia — bateria, zlew, okap — OK" },
        { id: "t_z3", label: "Łazienka — wanna/kabina, toaleta, umywalka — OK" },
        { id: "t_z4", label: "Łazienka — baterie, odpływy, fuga — OK" },
        { id: "t_z5", label: "Pokój 1 — podłoga, ściany, sufit, okna — OK" },
        { id: "t_z6", label: "Pokój 2 — podłoga, ściany, sufit, okna — OK" },
        { id: "t_z7", label: "Pokój 3 — podłoga, ściany, sufit, okna — OK" },
        { id: "t_z8", label: "Pokój 4 — podłoga, ściany, sufit, okna — OK" },
        { id: "t_z9", label: "Przedpokój — podłoga, ściany, drzwi wejściowe, domofon — OK" },
        { id: "t_z10", label: "Instalacja elektryczna — gniazdka, włączniki — OK" },
        { id: "t_z11", label: "Instalacja wodno-kanalizacyjna — OK" },
        { id: "t_z12", label: "Ogrzewanie / grzejniki / termostat — OK" },
        { id: "t_z13", label: "Okna — stan, uszczelki, klamki — OK" },
        { id: "t_z14", label: "Drzwi wewnętrzne — OK" },
        { id: "t_z15", label: "Balkon / taras — OK" },
        { id: "t_z16", label: "Piwnica / komórka lokatorska — OK" },
      ]},
      { id: "h_equip", label: "Wyposażenie i uwagi", type: "heading" as CustomFieldType, remember: false, order: 26 },
      { id: "f_equip", label: "Wyposażenie / inwentarz", type: "textarea", remember: false, order: 27 },
      { id: "f_wear_rating", label: "Ogólny stopień zużycia lokalu (nowy / dobry / zużyty / uszkodzony)", type: "text", remember: false, order: 28 },
      { id: "f_damage", label: "Stwierdzone uszkodzenia / uwagi", type: "textarea", remember: false, order: 29 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 30 },
      { id: "sig_owner", label: "Podpis przekazującego", type: "signature", remember: false, order: 31 },
      { id: "sig_tenant", label: "Podpis przejmującego", type: "signature", remember: false, order: 32 },
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
      { id: "h_legal7", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal7", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Ustawa z 21.12.2000 r. o dozorze technicznym (Dz.U. z 2023 r. poz. 1622).\nRozporządzenie MG z 18.07.2001 r. w sprawie eksploatacji urządzeń technicznych.\nPN-EN 13015 — konserwacja dźwigów i schodów ruchomych." },
      { id: "h_obj7", label: "Dane obiektu", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Właściciel / zarządca budynku", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 6 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 7 },
      { id: "f_review_type", label: "Rodzaj przeglądu (miesięczny / roczny kompleksowy)", type: "text", remember: false, order: 8 },
      { id: "h_device7", label: "Dane dźwigu", type: "heading" as CustomFieldType, remember: false, order: 9 },
      { id: "f_dev_type", label: "Typ dźwigu (osobowy / towarowy / szpitalny)", type: "text", remember: false, order: 10 },
      { id: "f_dev_prod", label: "Producent / model", type: "text", remember: true, order: 11 },
      { id: "f_dev_serial", label: "Nr fabryczny", type: "text", remember: true, order: 12 },
      { id: "f_dev_year", label: "Rok produkcji", type: "text", remember: true, order: 13 },
      { id: "f_udt_nr", label: "Nr ewidencyjny UDT", type: "text", remember: true, order: 14 },
      { id: "f_udt_first_approval", label: "Data pierwszego dopuszczenia UDT", type: "date", remember: true, order: 15 },
      { id: "f_capacity", label: "Udźwig [kg] / liczba przystanków", type: "text", remember: true, order: 16 },
      { id: "f_hour_counter", label: "Stan licznika motogodzin / cykli", type: "text", remember: false, order: 17 },
      { id: "h_exec7", label: "Dane konserwatora", type: "heading" as CustomFieldType, remember: false, order: 18 },
      { id: "f_udt_cert", label: "Nr uprawnień konserwatora", type: "text", remember: true, order: 19 },
      { id: "f_udt_cert_scope", label: "Zakres uprawnień (elektryczne / hydrauliczne)", type: "text", remember: true, order: 20 },
      { id: "f_udt_cert_validity", label: "Ważność uprawnień konserwatora", type: "date", remember: true, order: 21 },
      { id: "h_checks7", label: "Czynności konserwacyjne", type: "heading" as CustomFieldType, remember: false, order: 22 },
      { id: "f_lift_tiles", label: "Czynności konserwacyjne", type: "tiles", remember: false, order: 23, tileOptions: [
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
        { id: "t_l17", label: "Kontrola ochrony przeciwporażeniowej" },
        { id: "t_l18", label: "Sprawdzenie oświetlenia szybu i maszynowni" },
      ]},
      { id: "h_summary7", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 24 },
      { id: "f_defects", label: "Stwierdzone usterki i status naprawy", type: "textarea", remember: false, order: 25 },
      { id: "f_next_date", label: "Data następnego przeglądu konserwacyjnego", type: "date", remember: false, order: 26 },
      { id: "f_next_udt", label: "Data następnego badania UDT", type: "date", remember: false, order: 27 },
      { id: "f_notes", label: "Uwagi", type: "textarea", remember: false, order: 28 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 29 },
      { id: "sig_tech", label: "Podpis konserwatora", type: "signature", remember: false, order: 30 },
      { id: "sig_manager", label: "Podpis eksploatującego (zarządca)", type: "signature", remember: false, order: 31 },
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
      { id: "h_legal8", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal8", label: "Przepisy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Art. 62 ust. 1 pkt 1 lit. c ustawy Prawo budowlane — coroczna kontrola instalacji gazowej (kocioł jako element instalacji).\nRozporządzenie MI z 12.04.2002 r. — §132–139 instalacje ogrzewcze, §156–179 instalacje gazowe.\nPN-EN 15378:2017 — inspekcje systemów ogrzewczych." },
      { id: "i_notice8", label: "Uwaga", type: "info" as CustomFieldType, remember: false, order: 2, content: "Przegląd serwisowy kotła i kontrola instalacji gazowej (art. 62 PB) to dwa odrębne obowiązki — jeden nie zastępuje drugiego." },
      { id: "h_obj8", label: "Dane obiektu i zleceniodawcy", type: "heading" as CustomFieldType, remember: false, order: 3 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 4 },
      { id: "f_client", label: "Zleceniodawca", type: "text", remember: false, order: 5 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 6 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 7 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 8 },
      { id: "f_legal_basis", label: "Podstawa prawna (Art. 62 ust. 1 pkt 1c PB / serwis producenta)", type: "text", remember: true, order: 9 },
      { id: "f_company", label: "Firma serwisowa (nazwa, adres, NIP)", type: "text", remember: true, order: 10 },
      { id: "f_tech_qualif", label: "Nr uprawnień kontrolującego (G3/SEP)", type: "text", remember: true, order: 11 },
      { id: "h_boiler8", label: "Dane kotła", type: "heading" as CustomFieldType, remember: false, order: 12 },
      { id: "f_boiler", label: "Kocioł (marka, model)", type: "text", remember: false, order: 13 },
      { id: "f_boiler_power", label: "Moc nominalna kotła [kW]", type: "text", remember: false, order: 14 },
      { id: "f_boiler_type", label: "Typ kotła (kondensacyjny / konwencjonalny / kombi)", type: "text", remember: false, order: 15 },
      { id: "f_boiler_sn", label: "Nr fabryczny kotła / rok produkcji", type: "text", remember: false, order: 16 },
      { id: "f_fuel", label: "Typ paliwa (gaz / olej / stałe / pompa ciepła)", type: "text", remember: false, order: 17 },
      { id: "h_params8", label: "Parametry pracy", type: "heading" as CustomFieldType, remember: false, order: 18 },
      { id: "f_gas_pressure", label: "Ciśnienie gazu na kotle [mbar]", type: "text", remember: false, order: 19 },
      { id: "f_press_co", label: "Ciśnienie w instalacji CO [bar]", type: "text", remember: false, order: 20 },
      { id: "f_press_vessel", label: "Ciśnienie w naczyniu wzbiorczym [bar]", type: "text", remember: false, order: 21 },
      { id: "h_flue8", label: "Analiza spalin", type: "heading" as CustomFieldType, remember: false, order: 22 },
      { id: "f_analyzer", label: "Analizator spalin (typ, nr)", type: "text", remember: true, order: 23 },
      { id: "f_co_ppm", label: "CO [ppm]", type: "text", remember: false, order: 24 },
      { id: "f_flue_temp", label: "Temperatura spalin [°C]", type: "text", remember: false, order: 25 },
      { id: "f_o2_co2", label: "O₂ [%] / CO₂ [%]", type: "text", remember: false, order: 26 },
      { id: "f_efficiency", label: "Sprawność [%] / straty kominowe [%]", type: "text", remember: false, order: 27 },
      { id: "h_service8", label: "Czynności serwisowe", type: "heading" as CustomFieldType, remember: false, order: 28 },
      { id: "f_co_tiles", label: "Czynności serwisowe", type: "tiles", remember: false, order: 29, tileOptions: [
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
        { id: "t_c17", label: "Kontrola szczelności instalacji gazowej" },
        { id: "t_c18", label: "Kontrola wentylacji pomieszczenia kotłowni" },
        { id: "t_c19", label: "Sprawdzenie układu spalinowo-powietrznego" },
      ]},
      { id: "h_summary8", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 30 },
      { id: "f_parts_replaced", label: "Wymienione części / materiały eksploatacyjne", type: "textarea", remember: false, order: 31 },
      { id: "f_prev_recommendations", label: "Zalecenia z poprzedniej kontroli i ich realizacja", type: "textarea", remember: false, order: 32 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 33 },
      { id: "f_notes", label: "Uwagi i zalecenia z terminami", type: "textarea", remember: false, order: 34 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 35 },
      { id: "sig_tech", label: "Podpis serwisanta", type: "signature", remember: false, order: 36 },
      { id: "sig_client", label: "Podpis klienta", type: "signature", remember: false, order: 37 },
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
      { id: "h_legal9", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal9", label: "Przepisy i normy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Art. 62 ust. 1 pkt 2 ustawy Prawo budowlane — kontrola instalacji elektrycznej co 5 lat.\nPN-EN 62446-1:2016 — systemy PV: wymagania dotyczące badań i dokumentacji.\nPN-HD 60364-7-712:2016 — instalacje fotowoltaiczne.\nInstalacja PV >6,5 kW wymaga uzgodnienia z rzeczoznawcą ppoż." },
      { id: "h_obj9", label: "Dane obiektu i właściciela", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Właściciel instalacji", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres instalacji", type: "text", remember: false, order: 6 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 7 },
      { id: "f_commission_date", label: "Data uruchomienia instalacji", type: "date", remember: true, order: 8 },
      { id: "f_company", label: "Firma kontrolująca (nazwa, adres, NIP)", type: "text", remember: true, order: 9 },
      { id: "h_system9", label: "Dane instalacji PV", type: "heading" as CustomFieldType, remember: false, order: 10 },
      { id: "f_power", label: "Moc zainstalowana [kWp]", type: "text", remember: false, order: 11 },
      { id: "f_panels", label: "Moduły PV (producent, typ, ilość)", type: "text", remember: false, order: 12 },
      { id: "f_inverter", label: "Falownik (producent, typ, nr seryjny)", type: "text", remember: false, order: 13 },
      { id: "f_strings", label: "Ilość stringów / konfiguracja", type: "text", remember: false, order: 14 },
      { id: "f_network_type", label: "Układ sieci AC (TN-S / TN-C-S / TT)", type: "text", remember: false, order: 15 },
      { id: "f_prosumer_nr", label: "Nr prosumenta / OSD / umowy przyłączeniowej", type: "text", remember: true, order: 16 },
      { id: "f_meter_bi", label: "Nr licznika dwukierunkowego", type: "text", remember: true, order: 17 },
      { id: "h_cond9", label: "Warunki i przyrządy pomiarowe", type: "heading" as CustomFieldType, remember: false, order: 18 },
      { id: "f_meter", label: "Przyrząd pomiarowy (typ, nr, kalibracja)", type: "text", remember: true, order: 19 },
      { id: "f_sep", label: "Nr uprawnień SEP", type: "text", remember: true, order: 20 },
      { id: "f_irradiance", label: "Nasłonecznienie w trakcie pomiaru [W/m²] (min. 400)", type: "text", remember: false, order: 21 },
      { id: "f_temp_module", label: "Temperatura modułu [°C]", type: "text", remember: false, order: 22 },
      { id: "f_temp_ambient", label: "Temperatura otoczenia [°C]", type: "text", remember: false, order: 23 },
      { id: "f_production", label: "Odczyt produkcji z falownika [kWh]", type: "text", remember: false, order: 24 },
      { id: "h_dc9", label: "Pomiary strony DC", type: "heading" as CustomFieldType, remember: false, order: 25 },
      { id: "f_voc_isc_measured", label: "Wyniki Voc / Isc per string (zmierzone)", type: "textarea", remember: false, order: 26 },
      { id: "f_voc_isc_expected", label: "Oczekiwane wartości STC Voc / Isc per string", type: "textarea", remember: false, order: 27 },
      { id: "f_insulation_dc", label: "Rezystancja izolacji DC [MΩ] / napięcie probiercze [V]", type: "text", remember: false, order: 28 },
      { id: "h_checks9", label: "Czynności kontrolne", type: "heading" as CustomFieldType, remember: false, order: 29 },
      { id: "f_pv_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 30, tileOptions: [
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
        { id: "t_p15", label: "Kontrola biegunowości stringów" },
        { id: "t_p16", label: "Pomiar rezystancji izolacji AC (L-PE, N-PE)" },
        { id: "t_p17", label: "Pomiar impedancji pętli zwarcia AC" },
        { id: "t_p18", label: "Sprawdzenie oznakowania i tabliczek ostrzegawczych" },
        { id: "t_p19", label: "Ocena zacienienia / roślinności" },
        { id: "t_p20", label: "Kontrola szczelności przejść dachowych" },
      ]},
      { id: "h_summary9", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 31 },
      { id: "f_result", label: "Ocena (nadaje się / nie nadaje się do eksploatacji)", type: "text", remember: false, order: 32 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 33 },
      { id: "f_notes", label: "Uwagi i zalecenia", type: "textarea", remember: false, order: 34 },
      { id: "i_insurance9", label: "Informacja", type: "info" as CustomFieldType, remember: false, order: 35, content: "Brak aktualnych protokołów przeglądowych może skutkować odmową wypłaty odszkodowania przez ubezpieczyciela." },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 36 },
      { id: "sig_tech", label: "Podpis inspektora", type: "signature", remember: false, order: 37 },
      { id: "sig_client", label: "Podpis właściciela", type: "signature", remember: false, order: 38 },
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
      { id: "h_legal10", label: "Podstawa prawna", type: "heading" as CustomFieldType, remember: false, order: 0 },
      { id: "i_legal10", label: "Przepisy i normy", type: "info" as CustomFieldType, remember: false, order: 1, content: "Art. 62 ust. 1 pkt 1 lit. c ustawy Prawo budowlane — coroczna kontrola instalacji wentylacyjnej.\nPN-EN 15780:2011 — czystość systemów wentylacyjnych.\nPN-EN 12599 — sprawdzanie instalacji wentylacji.\nRozporządzenie MSWiA z 7.06.2010 r. (§34) — częstotliwość czyszczenia przewodów." },
      { id: "h_obj10", label: "Dane obiektu", type: "heading" as CustomFieldType, remember: false, order: 2 },
      { id: "f_protocol_nr", label: "Numer protokołu", type: "text", remember: false, order: 3 },
      { id: "f_client", label: "Właściciel / zarządca", type: "text", remember: false, order: 4 },
      { id: "f_nip", label: "NIP klienta", type: "text", remember: false, order: 5 },
      { id: "f_address", label: "Adres obiektu", type: "text", remember: false, order: 6 },
      { id: "f_date", label: "Data przeglądu", type: "date", remember: false, order: 7 },
      { id: "f_legal_basis", label: "Podstawa prawna (Art. 62 ust. 1 pkt 1c PB)", type: "text", remember: true, order: 8 },
      { id: "f_company", label: "Firma kontrolująca (nazwa, adres, NIP)", type: "text", remember: true, order: 9 },
      { id: "f_inspector_qualif", label: "Nr uprawnień budowlanych inspektora", type: "text", remember: true, order: 10 },
      { id: "h_device10", label: "Dane centrali wentylacyjnej", type: "heading" as CustomFieldType, remember: false, order: 11 },
      { id: "f_ahu", label: "Centrala wentylacyjna (marka, model)", type: "text", remember: false, order: 12 },
      { id: "f_ahu_sn", label: "Nr fabryczny centrali", type: "text", remember: false, order: 13 },
      { id: "f_area", label: "Powierzchnia wentylowana [m²]", type: "number", remember: false, order: 14 },
      { id: "h_meas10", label: "Pomiary powietrza", type: "heading" as CustomFieldType, remember: false, order: 15 },
      { id: "f_airflow", label: "Projektowy strumień powietrza [m³/h]", type: "text", remember: false, order: 16 },
      { id: "f_airflow_measured", label: "Zmierzony strumień powietrza [m³/h] (±15%)", type: "text", remember: false, order: 17 },
      { id: "f_balance", label: "Bilans nawiew / wywiew [m³/h]", type: "text", remember: false, order: 18 },
      { id: "f_filter_class", label: "Klasa filtrów (ISO 16890, np. ePM1 55%)", type: "text", remember: false, order: 19 },
      { id: "f_temp_supply", label: "Temperatura nawiewu [°C]", type: "text", remember: false, order: 20 },
      { id: "f_temp_extract", label: "Temperatura wywiewu [°C]", type: "text", remember: false, order: 21 },
      { id: "f_humidity", label: "Wilgotność względna [%]", type: "text", remember: false, order: 22 },
      { id: "f_heat_recovery_eff", label: "Sprawność odzysku ciepła — zmierzona / znamionowa [%]", type: "text", remember: false, order: 23 },
      { id: "f_hygiene_class", label: "Klasa czystości higienicznej (niska / średnia / wysoka) wg PN-EN 15780", type: "text", remember: false, order: 24 },
      { id: "f_anemometer", label: "Anemometr (typ, nr, kalibracja)", type: "text", remember: true, order: 25 },
      { id: "h_checks10", label: "Czynności kontrolne", type: "heading" as CustomFieldType, remember: false, order: 26 },
      { id: "f_went_tiles", label: "Czynności kontrolne", type: "tiles", remember: false, order: 27, tileOptions: [
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
        { id: "t_w17", label: "Ocena zanieczyszczenia przewodów (g/m²) wg PN-EN 15780" },
        { id: "t_w18", label: "Pomiar stężenia CO₂ [ppm]" },
      ]},
      { id: "h_results10", label: "Wyniki szczegółowe", type: "heading" as CustomFieldType, remember: false, order: 28 },
      { id: "f_airflow_table", label: "Wyniki pomiarów per punkt (pomieszczenie / nawiew zmierzony / projektowy / ocena)", type: "textarea", remember: false, order: 29 },
      { id: "h_summary10", label: "Ocena i zalecenia", type: "heading" as CustomFieldType, remember: false, order: 30 },
      { id: "f_condition_rating", label: "Ocena stanu (dobry / dostateczny / niedostateczny / awaryjny)", type: "text", remember: false, order: 31 },
      { id: "f_prev_recommendations", label: "Zalecenia z poprzedniej kontroli i ich realizacja", type: "textarea", remember: false, order: 32 },
      { id: "f_next_date", label: "Data następnego przeglądu", type: "date", remember: false, order: 33 },
      { id: "f_notes", label: "Uwagi i zalecenia z terminami", type: "textarea", remember: false, order: 34 },
      { id: "f_photos", label: "Dokumentacja fotograficzna", type: "photos", remember: false, order: 35 },
      { id: "sig_tech", label: "Podpis wykonawcy", type: "signature", remember: false, order: 36 },
      { id: "sig_client", label: "Podpis właściciela", type: "signature", remember: false, order: 37 },
    ],
    tiles: [], hasPhotos: false, signatureFields: [],
  },
];

// ============================================================
// USER TEMPLATES — CRUD (Supabase + localStorage cache)
// ============================================================

import {
  getCloudUserTemplates,
  saveCloudUserTemplate,
  deleteCloudUserTemplate,
  migrateLocalTemplatesToCloud,
} from "./supabase-storage";

const USER_TEMPLATES_KEY = "docswift_user_templates";
const TEMPLATES_MIGRATED_KEY = "docswift_templates_migrated";

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

/** Synchronous — returns cached localStorage templates (for instant UI) */
export function getUserTemplates(): ReportTemplate[] {
  return getStoredTemplates();
}

/** Async — fetches from Supabase, updates cache, migrates if needed */
export async function fetchUserTemplates(): Promise<ReportTemplate[]> {
  try {
    // One-time migration: push localStorage templates to cloud
    const migrated = localStorage.getItem(TEMPLATES_MIGRATED_KEY);
    if (!migrated) {
      const local = getStoredTemplates();
      if (local.length > 0) {
        await migrateLocalTemplatesToCloud(local);
      }
      localStorage.setItem(TEMPLATES_MIGRATED_KEY, "1");
    }

    const cloud = await getCloudUserTemplates();
    saveStoredTemplates(cloud); // update cache
    return cloud;
  } catch {
    return getStoredTemplates(); // fallback to cache
  }
}

export async function saveUserTemplate(template: ReportTemplate): Promise<ReportTemplate> {
  // Update localStorage cache immediately
  const templates = getStoredTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  saveStoredTemplates(templates);

  // Sync to cloud (fire & forget with error handling)
  try { await saveCloudUserTemplate(template); } catch {}

  return template;
}

export async function deleteUserTemplate(id: string): Promise<void> {
  const templates = getStoredTemplates().filter((t) => t.id !== id);
  saveStoredTemplates(templates);
  try { await deleteCloudUserTemplate(id); } catch {}
}

export async function duplicateTemplate(source: ReportTemplate, newName: string): Promise<ReportTemplate> {
  const newTemplate: ReportTemplate = {
    ...source,
    id: `user_${Date.now()}`,
    name: newName,
    builtIn: false,
  };
  return saveUserTemplate(newTemplate);
}

export async function createBlankTemplate(name: string): Promise<ReportTemplate> {
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
