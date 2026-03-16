import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/hooks/use-theme";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import SelectTemplate from "./pages/SelectTemplate";
import EditTemplate from "./pages/EditTemplate";
import ReportWizard from "./pages/ReportWizard";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Pages where we hide the bottom nav (full-screen flows) */
const HIDE_NAV = ["/report", "/edit-template"];

function AppShell() {
  useTheme(); // applies theme class on mount
  const location = useLocation();
  const hideNav = HIDE_NAV.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/select-template" element={<SelectTemplate />} />
          <Route path="/edit-template" element={<EditTemplate />} />
          <Route path="/report" element={<ReportWizard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
