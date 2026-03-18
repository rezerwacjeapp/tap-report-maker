import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Check, Plus, X, ArrowUp, ArrowDown, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, saveProfile, type CompanyProfile, type ProfileField } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const { user, signOut } = useAuth();
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

  const usedLabels = new Set(profile.fields.map((f) => f.label));
  const availableSuggestions = FIELD_SUGGESTIONS.filter((s) => !usedLabels.has(s.label));

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="px-5 pt-8 pb-2">
        <h1 className="text-xl">Profil firmy</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Dane widoczne w nagłówku PDF</p>
      </header>

      <main className="flex-1 px-5 space-y-5 pb-8 pt-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border bg-card overflow-hidden hover:border-accent transition-colors"
          >
            {profile.logo ? (
              <img src={profile.logo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Upload className="h-7 w-7 text-muted-foreground" />
            )}
          </button>
          <span className="text-[11px] text-muted-foreground">Logo firmy</span>
          {profile.logo && (
            <button onClick={() => update({ ...profile, logo: null })} className="text-[11px] text-destructive hover:underline">
              Usuń logo
            </button>
          )}
        </div>

        {/* Dynamic fields */}
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground">Kliknij etykietę aby ją zmienić.</p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {profile.fields.map((field, index) => (
              <div key={field.id} className="p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button onClick={() => moveField(index, 1)} disabled={index === profile.fields.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    className="text-[11px] font-medium text-muted-foreground bg-transparent border-b border-dashed border-border outline-none flex-1 min-w-0 py-0.5 focus:border-accent focus:text-foreground transition-colors"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Wpisz nazwę pola..."
                    id={`label-${field.id}`}
                  />
                  {profile.fields.length > 1 && (
                    <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input
                  className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-base focus:outline-none focus:border-accent transition-colors"
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  placeholder={
                    FIELD_SUGGESTIONS.find((s) => s.label === field.label)?.placeholder
                    || (index === 0 ? "np. Serwis Klima Sp. z o.o." : "Wartość...")
                  }
                />
                {index === 0 && (
                  <p className="text-[10px] text-muted-foreground">Pierwsze pole = nazwa dużą czcionką w nagłówku PDF</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add field */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dodaj pole</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => addField(s.label)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/5 transition-all"
              >
                <Plus className="h-3 w-3 inline mr-1" />{s.label}
              </button>
            ))}
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
              className="rounded-lg border border-dashed border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-foreground transition-all"
            >
              <Plus className="h-3 w-3 inline mr-1" /> Inne pole...
            </button>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Motyw</p>
          <ThemeToggle />
        </div>

        <button
          onClick={() => { toast.success("Profil zapisany"); navigate("/"); }}
          className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Check className="h-5 w-5" /> Zapisano automatycznie
        </button>

        {/* Account */}
        <div className="space-y-3 pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Konto</p>
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
          <button
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="w-full h-12 rounded-xl border border-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 active:scale-[0.98] transition-all"
          >
            <LogOut className="h-5 w-5" /> Wyloguj się
          </button>
        </div>
      </main>
    </div>
  );
}
