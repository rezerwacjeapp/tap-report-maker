import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Sentry error monitoring — loaded after the app starts, and only when a DSN is set
// (VITE_SENTRY_DSN in Vercel). Without it the library isn't downloaded at all.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (import.meta.env.PROD && SENTRY_DSN) {
  import("@sentry/react")
    .then((Sentry) =>
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,
        // Sample 100% of errors, 10% of performance traces
        tracesSampleRate: 0.1,
      })
    )
    .catch(() => {});
}
