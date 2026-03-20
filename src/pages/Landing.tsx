import { useEffect } from "react";

export default function Landing() {
  useEffect(() => {
    window.location.replace("/landing.html");
  }, []);

  // Brief loading state while redirect happens
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f0f2f5]">
      <div className="text-center">
        <div className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
          Raport<span className="text-emerald-500">ON</span>
        </div>
      </div>
    </div>
  );
}
