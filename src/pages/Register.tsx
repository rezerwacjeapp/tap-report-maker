import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Podaj email i hasło");
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
    if (!terms) {
      setError("Musisz zaakceptować regulamin");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      // Save consent flags — will be applied when user confirms email and first logs in
      localStorage.setItem("raporton_pending_consent", JSON.stringify({ terms: true, marketing }));
      setSuccess(true);
    }
  };

  // Success state — check email
  if (success) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Sprawdź email</h1>
          <p className="text-sm text-muted-foreground">
            Wysłaliśmy link potwierdzający na <strong className="text-foreground">{email}</strong>.
            Kliknij go, żeby aktywować konto.
          </p>
          <Link
            to="/login"
            className="inline-block h-12 px-8 rounded-xl bg-accent text-white font-medium leading-[3rem] active:scale-[0.98] transition-transform"
          >
            Przejdź do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <a href="https://raporton.pl" className="text-3xl font-bold text-foreground inline-block">Raport<span className="text-accent">ON</span></a>
          <p className="text-sm text-muted-foreground">Utwórz darmowe konto</p>
        </div>

        <div className="space-y-4">
          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 rounded-xl border border-border bg-card font-medium flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50 hover:bg-muted/50"
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <>
                <GoogleIcon />
                Zarejestruj się z Google
              </>
            )}
          </button>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">lub</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-4 text-base focus:outline-none focus:border-accent transition-colors"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                className="w-full h-12 rounded-xl border border-border bg-card pl-11 pr-11 text-base focus:outline-none focus:border-accent transition-colors"
                placeholder="Hasło (min. 6 znaków)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
                placeholder="Powtórz hasło"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {/* Consent checkboxes */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => { setTerms(e.target.checked); setError(""); }}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent shrink-0"
                />
                <span className="text-xs leading-snug text-muted-foreground">
                  Akceptuję{" "}
                  <a href="/regulamin" target="_blank" className="text-accent underline">Regulamin</a>
                  {" "}i{" "}
                  <a href="/prywatnosc" target="_blank" className="text-accent underline">Politykę prywatności</a>
                  {" "}<span className="text-destructive">*</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent shrink-0"
                />
                <span className="text-xs leading-snug text-muted-foreground">
                  Chcę otrzymywać informacje o nowościach RaportON
                </span>
              </label>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-accent text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Utwórz konto"}
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
