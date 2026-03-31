import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import SelectTemplate from "./pages/SelectTemplate";
import EditTemplate from "./pages/EditTemplate";
import ReportWizard from "./pages/ReportWizard";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Upgrade from "./pages/Upgrade";
import SetNewPassword from "./pages/SetNewPassword";
import { PwaUpdatePrompt } from "./components/PwaUpdatePrompt";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Pages where we hide the bottom nav (full-screen flows) */
const HIDE_NAV = ["/report", "/edit-template", "/login", "/register"];

function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">Ładowanie...</p>
      </div>
    </div>
  );
}

function AppShell() {
  useTheme();
  const location = useLocation();
  const { user, loading, isRecovery } = useAuth();
  const hideNav = HIDE_NAV.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  if (loading) return <LoadingScreen />;

  // Password recovery flow — show set-new-password form
  if (user && isRecovery) {
    return <SetNewPassword />;
  }

  // Not logged in — show landing, login, register
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Logged in — show the app, redirect /login to home
  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Animated mesh background */}
      <div className="mesh-bg">
        <div className="blob" />
        <div className="blob" />
        <div className="blob" />
      </div>
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/select-template" element={<SelectTemplate />} />
          <Route path="/edit-template" element={<EditTemplate />} />
          <Route path="/report" element={<ReportWizard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
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
      <PwaUpdatePrompt />
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
