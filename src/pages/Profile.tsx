import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Check, Plus, X, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { type CompanyProfile, type ProfileField } from "@/lib/storage";
import { getCloudProfile, saveCloudProfile } from "@/lib/supabase-storage";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    getCloudProfile()
      .then((p) => setProfile(p))
      .catch(() => toast.error("Nie udało się załadować profilu"))
      .finally(() => setLoading(false));
  }, []);

  const update = (next: CompanyProfile) => {
    setProfile(next);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCloudProfile(next).catch(() => toast.error("Błąd zapisu profilu"));
    }, 500);
  };

  const updateField = (id: string, partial: Partial<ProfileField>) => {
    if (!profile) return;
    update({ ...profile, fields: profile.fields.map((f) => f.id === id ? { ...f, ...partial } : f) });
  };

  const addField = (label: string) => {
    if (!profile) return;
    const f: ProfileField = { id: `pf_${Date.now()}`, label, value: "" };
    update({ ...profile, fields: [...profile.fields, f] });
    toast.success(`Dodano pole: ${label}`);
  };

  const removeField = (id: string) => {
    if (!profile) return;
    update({ ...profile, fields: profile.fields.filter((f) => f.id !== id) });
  };

  const moveField = (index: number, direction: -1 | 1) => {
    if (!profile) return;
    const target = index + direction;
    if (target < 0 || target >= profile.fields.length) return;
    const items = [...profile.fields];
    [items[index], items[target]] = [items[target], items[index]];
    update({ ...profile, fields: items });
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 2MB raw file — we'll resize it anyway
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo jest za duże (max 2 MB). Wybierz mniejszy plik.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Resize logo to max 400px and compress
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = (h / w) * maxDim; w = maxDim; }
          else { w = (w / h) * maxDim; h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const resized = canvas.toDataURL("image/png", 0.9);
        update({ ...profile, logo: resized });
      };
      img.onerror = () => toast.error("Nie udało się wczytać pliku.");
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const usedLabels = new Set(profile.fields.map((f) => f.label));
  const availableSuggestions = FIELD_SUGGESTIONS.filter((s) => !usedLabels.has(s.label));

  return (
    <div className="flex flex-1 flex-col">
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
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-border/60 glass-card overflow-hidden hover:border-accent transition-colors"
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
          <div className="rounded-2xl glass-card overflow-hidden divide-y divide-border/50">
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
              <button key={s.label} onClick={() => addField(s.label)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/5 transition-all">
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
              className="rounded-lg border border-dashed border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-foreground transition-all">
              <Plus className="h-3 w-3 inline mr-1" /> Inne pole...
            </button>
          </div>
        </div>

        {/* Theme toggle */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Motyw</p>
          <ThemeToggle />
        </div>

        <button onClick={() => { toast.success("Profil zapisany"); navigate("/"); }}
          className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <Check className="h-5 w-5" /> Zapisano automatycznie
        </button>

        {/* Account */}
        <div className="space-y-3 pt-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Konto</p>
          {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </div>
      </main>
    </div>
  );
}
