import { useNavigate } from "react-router-dom";
import { FileDown, Camera, PenTool, Mic, Zap, Shield, Wind, Home, Flame, CheckCircle2 } from "lucide-react";

const FEATURES = [
  { icon: FileDown, title: "PDF w sekundę", desc: "Profesjonalny protokół z logo Twojej firmy — gotowy do wysłania klientowi od razu." },
  { icon: Camera, title: "Zdjęcia w raporcie", desc: "Sfotografuj instalację, uszkodzenie, tabliczkę. Zdjęcia lądują prosto w PDF." },
  { icon: PenTool, title: "Podpis na telefonie", desc: "Klient podpisuje palcem na ekranie. Koniec z \"dośle Panu mailem\"." },
  { icon: Mic, title: "Dyktuj, nie pisz", desc: "Mów do telefonu — tekst wpisuje się sam. Po polsku, offline." },
];

const INDUSTRIES = [
  { icon: Wind, label: "Klimatyzacja i wentylacja", color: "text-blue-400" },
  { icon: Zap, label: "Pomiary elektryczne", color: "text-amber-400" },
  { icon: Flame, label: "Instalacje gazowe", color: "text-orange-400" },
  { icon: Home, label: "Zarządzanie nieruchomościami", color: "text-purple-400" },
  { icon: Shield, label: "Przeglądy PPOŻ", color: "text-red-400" },
];

const FREE_FEATURES = [
  "3 raporty miesięcznie",
  "Wszystkie szablony",
  "Zdjęcia i podpisy",
  "Dyktowanie głosowe",
  "Logo firmy w PDF",
];

const SOLO_FEATURES = [
  "Bez limitu raportów",
  "Wszystko z Free",
  "Priorytetowe wsparcie",
  "Własne szablony",
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-4 border-b border-border/50">
        <div className="text-xl font-bold">
          Raport<span className="text-accent">ON</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Zaloguj się
          </button>
          <button
            onClick={() => navigate("/register")}
            className="h-9 px-5 rounded-xl bg-accent text-white text-sm font-medium active:scale-[0.98] transition-transform"
          >
            Za darmo
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="px-5 md:px-12 pt-16 pb-20 md:pt-24 md:pb-28 text-center max-w-3xl mx-auto">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5">
          <span className="text-xs font-medium text-accent">Darmowe do 3 raportów/miesiąc</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          Protokoły serwisowe{" "}
          <span className="text-accent">w 60 sekund</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Wypełnij formularz, dodaj zdjęcia, podpis klienta — PDF z logo Twojej firmy gotowy. Bez Worda, bez siedzenia wieczorami.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <button
            onClick={() => navigate("/register")}
            className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-accent text-white text-base font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-accent/20"
          >
            Zacznij za darmo
          </button>
          <button
            onClick={() => {
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full sm:w-auto h-14 px-10 rounded-2xl border border-border text-foreground text-base font-medium flex items-center justify-center gap-2 hover:bg-card transition-colors"
          >
            Zobacz cennik
          </button>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="px-5 md:px-12 py-16 bg-card/50 border-y border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ile godzin w tym tygodniu spędziłeś nad dokumentacją?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { emoji: "📝", text: "Wieczory nad Wordem zamiast z rodziną" },
              { emoji: "📋", text: "Klient kwestionuje co było zrobione" },
              { emoji: "🤷", text: "Brak profesjonalnych protokołów = brak wiarygodności" },
            ].map((item) => (
              <div key={item.text} className="rounded-2xl border border-border bg-card p-6 text-left">
                <span className="text-3xl">{item.emoji}</span>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Raport w 3 krokach
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              { step: "1", title: "Wypełnij", desc: "Formularz na telefonie — pola dopasowane do Twojej branży. Możesz dyktować." },
              { step: "2", title: "Dodaj dowody", desc: "Zdjęcia instalacji, podpis klienta palcem na ekranie." },
              { step: "3", title: "Generuj PDF", desc: "Jedno kliknięcie — profesjonalny protokół z logo, gotowy do wysłania." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 md:px-12 py-16 bg-card/50 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Wszystko czego potrzebujesz w terenie
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 mt-12">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 rounded-2xl border border-border bg-card">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDUSTRIES ── */}
      <section className="px-5 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Dla Twojej branży</h2>
          <p className="mt-3 text-muted-foreground">Gotowe szablony protokołów — zgodne z przepisami</p>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {INDUSTRIES.map((ind) => (
              <div key={ind.label} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card">
                <ind.icon className={`h-5 w-5 ${ind.color}`} />
                <span className="text-sm font-medium">{ind.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-5 md:px-12 py-16 bg-card/50 border-y border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Prosty cennik</h2>
          <p className="mt-3 text-center text-muted-foreground">Zacznij za darmo, przejdź na Solo gdy potrzebujesz więcej</p>

          <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-bold">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">0 zł</span>
                <span className="text-muted-foreground text-sm"> /miesiąc</span>
              </div>
              <ul className="mt-6 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="mt-8 w-full h-12 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors"
              >
                Zacznij za darmo
              </button>
            </div>

            {/* Solo */}
            <div className="rounded-2xl border-2 border-accent bg-card p-6 relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-accent text-white text-xs font-semibold">
                Popularne
              </div>
              <h3 className="text-lg font-bold">Solo</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">19 zł</span>
                <span className="text-muted-foreground text-sm"> /miesiąc</span>
              </div>
              <ul className="mt-6 space-y-3">
                {SOLO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/register")}
                className="mt-8 w-full h-12 rounded-xl bg-accent text-white font-medium active:scale-[0.98] transition-transform"
              >
                Rozpocznij
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 md:px-12 py-10 border-t border-border/50">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RaportON. Wszystkie prawa zastrzeżone.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">Regulamin</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Prywatność</a>
            <a href="mailto:kontakt@raporton.pl" className="hover:text-foreground transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
