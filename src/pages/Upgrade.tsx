import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Zap, FileDown, Camera, PenTool, Mic, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkReportLimit } from "@/lib/supabase-storage";

export default function Upgrade() {
  const navigate = useNavigate();
  const [planInfo, setPlanInfo] = useState<{ count: number; limit: number; plan: string } | null>(null);

  useEffect(() => {
    checkReportLimit()
      .then((info) => setPlanInfo({ count: info.count, limit: info.limit, plan: info.plan }))
      .catch(() => {});
  }, []);

  const handleUpgrade = () => {
    // TODO: Replace with Autopay payment link when account is ready
    // window.location.href = "https://pay.autopay.pl/...";
    alert("Płatności Autopay zostaną uruchomione wkrótce. Skontaktuj się: kontakt@raporton.pl");
  };

  // Already on Solo
  if (planInfo?.plan === "solo") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <header className="flex items-center gap-2 px-5 pt-6 pb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-semibold">Twój plan</h1>
        </header>
        <main className="flex-1 px-5 py-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">Plan Solo</h2>
          <p className="text-muted-foreground mt-2">Masz aktywny plan Solo — generuj raporty bez limitu.</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Wróć do aplikacji</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="flex items-center gap-2 px-5 pt-6 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-lg font-semibold">Zmień plan</h1>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6">
        {/* Current usage */}
        {planInfo && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Twój obecny plan: Free</span>
              <span className="text-sm text-accent font-semibold">{planInfo.count}/{planInfo.limit}</span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${planInfo.count >= planInfo.limit ? "bg-destructive" : "bg-accent"}`}
                style={{ width: `${Math.min((planInfo.count / planInfo.limit) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {planInfo.count >= planInfo.limit
                ? "Limit osiągnięty — nie możesz generować raportów do następnego miesiąca."
                : `Pozostało ${planInfo.limit - planInfo.count} raportów w tym miesiącu.`
              }
            </p>
          </div>
        )}

        {/* Plan comparison */}
        <div className="space-y-4">
          {/* Free plan */}
          <div className="rounded-2xl border border-border bg-card p-5 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Free</h3>
                <p className="text-2xl font-bold mt-1">0 zł<span className="text-sm font-normal text-muted-foreground"> /miesiąc</span></p>
              </div>
              <div className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                Obecny plan
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0" /> 3 raporty miesięcznie
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0" /> Wszystkie szablony
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0" /> Zdjęcia, podpisy, dyktowanie
              </div>
            </div>
          </div>

          {/* Solo plan */}
          <div className="rounded-2xl border-2 border-accent bg-card p-5 relative">
            <div className="absolute -top-3 left-5 px-3 py-0.5 rounded-full bg-accent text-white text-xs font-semibold">
              Rekomendowany
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Solo</h3>
                <p className="text-2xl font-bold mt-1">19 zł<span className="text-sm font-normal text-muted-foreground"> /miesiąc</span></p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Infinity className="h-4 w-4 text-accent shrink-0" /> <strong>Bez limitu</strong> raportów
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent shrink-0" /> Wszystko z planu Free
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent shrink-0" /> Priorytetowe wsparcie
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              className="w-full mt-6 h-12 rounded-xl bg-accent text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
            >
              <Zap className="h-5 w-5" />
              Przejdź na Solo — 19 zł/mc
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Bez zobowiązań · Rezygnuj kiedy chcesz
          </p>
          <p className="text-xs text-muted-foreground">
            Płatności obsługuje Autopay S.A.
          </p>
        </div>
      </main>
    </div>
  );
}
