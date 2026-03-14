import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Check, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { getProfile, saveProfile, type CompanyProfile, type ProfileField } from "@/lib/storage";
import { toast } from "sonner";

const FIELD_SUGGESTIONS = [
  { label: "Telefon", placeholder: "np. +48 123 456 789" },
  { label: "E-mail", placeholder: "np. biuro@firma.pl" },
  { label: "Strona WWW", placeholder: "np. www.firma.pl" },
  { label: "REGON", placeholder: "np. 123456789" },
  { label: "Nr uprawnień", placeholder: "np. certyfikat F-gaz, SEP" },
  { label: "Osoba kontaktowa", placeholder: "np. Jan Kowalski" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CompanyProfile>(getProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (next: CompanyProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  const updateField = (id: string, partial: Partial<ProfileField>) => {
    update({
      ...profile,
      fields: profile.fields.map((f) => f.id === id ? { ...f, ...partial } : f),
    });
  };

  const addField = (label: string) => {
    const f: ProfileField = { id: `pf_${Date.now()}`, label, value: "" };
    update({ ...profile, fields: [...profile.fields, f] });
    toast.success(`Dodano pole: ${label}`);
  };

  const removeField = (id: string) => {
    update({ ...profile, fields: profile.fields.filter((f) => f.id !== id) });
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= profile.fields.length) return;
    const items = [...profile.fields];
    [items[index], items[target]] = [items[target], items[index]];
    update({ ...profile, fields: items });
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ ...profile, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Which suggestion labels are already used
  const usedLabels = new Set(profile.fields.map((f) => f.label));
  const availableSuggestions = FIELD_SUGGESTIONS.filter((s) => !usedLabels.has(s.label));

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl">Profil firmy</h1>
      </header>

      <main className="flex-1 px-5 space-y-5 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card overflow-hidden"
          >
            {profile.logo ? (
              <img src={profile.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
          <span className="text-xs text-muted-foreground">Logo firmy</span>
          {profile.logo && (
            <button onClick={() => update({ ...profile, logo: null })} className="text-xs text-destructive hover:underline">
              Usuń logo
            </button>
          )}
        </div>

        {/* Dynamic fields */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Dane firmy widoczne w nagłówku PDF. Kliknij etykietę aby ją zmienić.</p>

          {profile.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border-2 border-border bg-card p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {/* Move arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => moveField(index, 1)} disabled={index === profile.fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                {/* Editable label */}
                <input
                  className="text-xs font-medium text-muted-foreground bg-transparent border-b border-dashed border-border outline-none flex-1 min-w-0 py-0.5 focus:border-accent focus:text-foreground transition-colors"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="Wpisz nazwę pola..."
                  id={`label-${field.id}`}
                />

                {/* Delete (only if more than 1 field) */}
                {profile.fields.length > 1 && (
                  <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Value */}
              <input
                className="w-full h-11 rounded-lg border-2 border-border bg-background px-3 text-base focus:outline-none focus:border-accent transition-colors"
                value={field.value}
                onChange={(e) => updateField(field.id, { value: e.target.value })}
                placeholder={
                  FIELD_SUGGESTIONS.find((s) => s.label === field.label)?.placeholder
                  || (index === 0 ? "np. Serwis Klima Sp. z o.o." : `Wartość...`)
                }
              />

              {/* First field hint */}
              {index === 0 && (
                <p className="text-[10px] text-muted-foreground">Pierwsze pole = nazwa wyświetlana dużą czcionką w nagłówku PDF</p>
              )}
            </div>
          ))}
        </div>

        {/* Add field */}
        <div className="rounded-xl border-2 border-dashed border-border p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Dodaj pole do nagłówka</p>

          {availableSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => addField(s.label)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <Plus className="h-3 w-3 inline mr-1" />{s.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              const id = `pf_${Date.now()}`;
              const f: ProfileField = { id, label: "", value: "" };
              update({ ...profile, fields: [...profile.fields, f] });
              setTimeout(() => {
                const el = document.getElementById(`label-${id}`);
                if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
              }, 50);
            }}
            className="w-full rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-accent hover:text-foreground transition-all"
          >
            <Plus className="h-3 w-3 inline mr-1" /> Inne pole...
          </button>
        </div>

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={() => { toast.success("Profil zapisany"); navigate("/"); }}
        >
          <Check className="h-5 w-5 mr-1" /> Zapisano automatycznie
        </Button>
      </main>
    </div>
  );
}
