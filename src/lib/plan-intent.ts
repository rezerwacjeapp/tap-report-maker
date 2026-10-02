/**
 * „Wybierz Solo" na landingu prowadzi do /register?plan=solo. Wybór pamiętamy do
 * zalogowania (także po kliknięciu linku z maila i logowaniu przez Google), a potem
 * otwieramy stronę zakupu /upgrade.
 */
const KEY = "raporton_pending_plan";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 h

export function wantsSolo(search: string): boolean {
  return new URLSearchParams(search).get("plan") === "solo";
}

export function rememberSoloIntent(now = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(now));
  } catch {
    /* brak dostępu do localStorage - po zalogowaniu zostaje przycisk na Starcie */
  }
}

export function hasSoloIntent(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(KEY));
    return at > 0 && now - at < MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** Zwraca true, jeśli był świeży wybór Solo, i kasuje go, żeby przekierować tylko raz. */
export function takeSoloIntent(now = Date.now()): boolean {
  const fresh = hasSoloIntent(now);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignoruj */
  }
  return fresh;
}
