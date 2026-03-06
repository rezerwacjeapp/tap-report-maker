import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Check } from "lucide-react";
import { getProfile, saveProfile, type CompanyProfile } from "@/lib/storage";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CompanyProfile>(getProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<CompanyProfile>) => {
    const next = { ...profile, ...partial };
    setProfile(next);
    saveProfile(next);
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

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
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nazwa firmy</label>
            <input
              className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
              value={profile.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              placeholder="np. Serwis Klima Sp. z o.o."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">NIP</label>
            <input
              className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
              value={profile.nip}
              onChange={(e) => update({ nip: e.target.value })}
              placeholder="1234567890"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Adres</label>
            <input
              className="w-full h-12 rounded-lg border-2 border-border bg-card px-4 text-base focus:outline-none focus:border-accent transition-colors"
              value={profile.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="ul. Serwisowa 1, 00-001 Warszawa"
            />
          </div>
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
