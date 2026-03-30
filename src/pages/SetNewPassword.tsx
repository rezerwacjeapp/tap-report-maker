import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function SetNewPassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Podaj nowe hasło");
      return;
    }
    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }
    if (password !== confirmPw) {
      setError("Hasła nie są identyczne");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Hasło zmienione!</h1>
          <p className="text-sm text-muted-foreground">
            Twoje nowe hasło zostało zapisane. Możesz teraz korzystać z aplikacji.
          </p>
          <a
            href="/"
            className="inline-block h-12 px-8 rounded-xl bg-accent text-white font-medium leading-[3rem] active:scale-[0.98] transition-transform"
          >
            Przejdź do aplikacji
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <span className="text-3xl font-bold text-foreground">Raport<span className="text-accent">ON</span></span>
          <p className="text-sm text-muted-foreground">Ustaw nowe hasło</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Wpisz nowe hasło do swojego konta.
          </p>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-11 text-base focus:outline-none focus:border-accent transition-colors"
              placeholder="Nowe hasło (min. 6 znaków)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-4 text-base focus:outline-none focus:border-accent transition-colors"
              placeholder="Powtórz nowe hasło"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Zapisz nowe hasło"}
          </button>
        </form>
      </div>
    </div>
  );
}
