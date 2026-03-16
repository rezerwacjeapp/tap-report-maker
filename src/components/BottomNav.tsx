import { useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/", icon: Home, label: "Start" },
  { path: "/select-template", icon: LayoutGrid, label: "Szablony" },
  { path: "/reports", icon: ClipboardList, label: "Historia" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="sticky bottom-0 z-50 flex border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
      {TABS.map((tab) => {
        const isActive =
          tab.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors",
              isActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
            <span className={cn("text-[11px]", isActive && "font-medium")}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
