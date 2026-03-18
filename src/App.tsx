import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GlobalLoadingProvider } from "@/contexts/GlobalLoadingContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { AppLayout } from "@/components/layout/AppLayout";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import ClientHub from "./pages/ClientHub";
import Fulfillment from "./pages/Fulfillment";
import Contracts from "./pages/Contracts";
import Projects from "./pages/Projects";
import Financial from "./pages/Financial";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import SettingsPage from "./pages/SettingsPage";
import AdminSettings from "./pages/AdminSettings";
import Registries from "./pages/Registries";
import Tasks from "./pages/Tasks";
import UsersPermissions from "./pages/UsersPermissions";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/:id" element={<ClientHub />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="/entregas" element={<Fulfillment />} />
        <Route path="/contratos" element={<Contracts />} />
        <Route path="/projetos" element={<Projects />} />
        <Route path="/financeiro" element={<Financial />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/equipe" element={<Team />} />
        <Route path="/cadastros" element={<Registries />} />
        <Route path="/usuarios" element={<UsersPermissions />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminSettings />} />
        <Route path="/dashboard-executivo" element={<ExecutiveDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoutes() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GlobalLoadingProvider>
        <DemoProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<AuthRoutes />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </DemoProvider>
      </GlobalLoadingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
