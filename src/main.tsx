import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Sentry error monitoring — free plan: 5k errors/month
// Get your DSN at: sentry.io → Create Project → React → copy DSN
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  environment: import.meta.env.MODE,
  // Only send errors in production
  enabled: import.meta.env.PROD,
  // Sample 100% of errors, 10% of performance traces
  tracesSampleRate: 0.1,
});

createRoot(document.getElementById("root")!).render(<App />);
