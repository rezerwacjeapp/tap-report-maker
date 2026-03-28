import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Zap, Infinity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkReportLimit } from "@/lib/supabase-storage";
import { useAuth } from "@/hooks/use-auth";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/9B600cb74csO1yW9x7es000";

export default function Upgrade() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [planInfo, setPlanInfo] = useState<{
    count: number; limit: number; plan: string;
    trial?: boolean; trialDaysLeft?: number;
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    checkReportLimit()
      .then((info) => setPlanInfo({
        count: info.count, limit: info.limit, plan: info.plan,
        trial: info.trial, trialDaysLeft: info.trialDaysLeft,
      }))
      .catch(() => {});
  }, []);

  // Handle return from Stripe — poll for subscription activation
  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    setCheckingPayment(true);

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const info = await checkReportLimit();
        if (info.plan === "solo") {
          clearInterval(poll);
          setPlanInfo({ count: 0, limit: Infinity, plan: "solo" });
          setCheckingPayment(false);
        }
      } catch {}
      if (attempts >= 15) {
        clearInterval(poll);
        setCheckingPayment(false);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [searchParams]);

  const handleUpgrade = () => {
    if (!user) return;
    const url = `${STRIPE_PAYMENT_LINK}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email || "")}`;
    window.location.href = url;
  };

  // Checking payment state
  if (checkingPayment) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <header className="flex items-center gap-2 px-5 pt-6 pb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-semibold">Aktywacja planu</h1>
        </header>
        <main className="flex-1 px-5 py-6 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
          <h2 className="text-xl font-bold">Sprawdzam płatność...</h2>
          <p className="text-muted-foreground mt-2">To może potrwać kilka sekund.</p>
        </main>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold">Plan Solo aktywny!</h2>
          <p className="text-muted-foreground mt-2">Generuj raporty bez limitu.</p>
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
            {planInfo.plan === "trial" ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Okres próbny</span>
                  <span className="text-sm text-blue-500 font-semibold">
                    {planInfo.trialDaysLeft} {planInfo.trialDaysLeft === 1 ? "dzień" : "dni"} pozostało
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.max(10, ((planInfo.trialDaysLeft || 0) / 7) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Bez limitu raportów. Po zakończeniu: 5 raportów/mc lub plan Solo.
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
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
              {planInfo?.plan !== "solo" && (
                <div className="px-3 py-1 rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                  {planInfo?.plan === "trial" ? "Okres próbny" : "Obecny plan"}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent shrink-0" /> 5 raportów miesięcznie
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
            Płatności obsługuje Stripe
          </p>
        </div>
      </main>
    </div>
  );
}
