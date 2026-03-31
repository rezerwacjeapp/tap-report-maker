import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Listens for service worker updates and shows a toast
 * prompting the user to reload for the new version.
 *
 * Works with VitePWA registerType: "autoUpdate".
 * The SW auto-installs in background; this component detects
 * when a new SW is waiting/active and prompts a reload.
 */
export function PwaUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      // New SW took control — reload to get fresh assets
      // Only auto-reload if not currently filling a form
      setShowUpdate(true);
    };

    // Detect when new SW activates
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Also check on load if there's already a waiting SW
    navigator.serviceWorker.ready.then((registration) => {
      // Listen for future updates
      registration.addEventListener("updatefound", () => {
        const newSW = registration.installing;
        if (!newSW) return;

        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            // New version installed, waiting to activate
            setShowUpdate(true);
          }
        });
      });

      // Check for updates every 5 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 5 * 60 * 1000);
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[999] flex justify-center animate-in slide-in-from-top-2 duration-300">
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-accent text-white shadow-lg shadow-accent/25 active:scale-[0.97] transition-transform text-sm font-medium"
      >
        <RefreshCw className="h-4 w-4" />
        Nowa wersja dostępna — kliknij aby zaktualizować
      </button>
    </div>
  );
}
