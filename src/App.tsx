import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GlobalLoadingProvider } from "@/contexts/GlobalLoadingContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";

// Lazy-loaded pages — each becomes its own chunk (~40–120 KB each)
const AuthPage            = lazy(() => import("./pages/AuthPage"));
const ResetPasswordPage   = lazy(() => import("./pages/ResetPasswordPage"));
const SetupPage           = lazy(() => import("./pages/SetupPage"));
const Index               = lazy(() => import("./pages/Index"));
const Clients             = lazy(() => import("./pages/Clients"));
const ClientHub           = lazy(() => import("./pages/ClientHub"));
const NewClient           = lazy(() => import("./pages/NewClient"));
const EditClient          = lazy(() => import("./pages/EditClient"));
const LandingPage         = lazy(() => import("./pages/LandingPage"));
const PixelSystemsLanding = lazy(() => import("./pages/PixelSystemsLanding"));
const Fulfillment         = lazy(() => import("./pages/Fulfillment"));
const Contracts           = lazy(() => import("./pages/Contracts"));
const Projects            = lazy(() => import("./pages/Projects"));
const Financial           = lazy(() => import("./pages/Financial"));
const Products            = lazy(() => import("./pages/Products"));
const Reports             = lazy(() => import("./pages/Reports"));
const Team                = lazy(() => import("./pages/Team"));
const SettingsPage        = lazy(() => import("./pages/SettingsPage"));
const AdminSettings       = lazy(() => import("./pages/AdminSettings"));
const Registries          = lazy(() => import("./pages/Registries"));
const Tasks               = lazy(() => import("./pages/Tasks"));
const UsersPermissions    = lazy(() => import("./pages/UsersPermissions"));
const ExecutiveDashboard  = lazy(() => import("./pages/ExecutiveDashboard"));
const Packages            = lazy(() => import("./pages/Packages"));
const Templates           = lazy(() => import("./pages/Templates"));
const PopLibrary          = lazy(() => import("./pages/PopLibrary"));
const SlaRules            = lazy(() => import("./pages/SlaRules"));
const DataImport          = lazy(() => import("./pages/DataImport"));
const NotFound            = lazy(() => import("./pages/NotFound"));
const NovaAgenciaPage     = lazy(() => import("./pages/NovaAgenciaPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// Multi-tenant: hostname-based routing
const AGENCY_HOST = "agencia.pixelsystem.online";
const PIXEL_HOST = "pixelsystem.online";
const OLA_HOST = "ola.pixelsystem.online"; // modo demonstração

function getRootHost() {
  return typeof window !== "undefined" ? window.location.hostname : "";
}

function useHasAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["has_any_admin"],
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)("has_any_admin");
      return data === true;
    },
    staleTime: 60_000,
    retry: 1,
  });
  return isLoading ? null : (data ?? false);
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/clientes/novo" element={<RouteErrorBoundary routeName="NewClient"><NewClient /></RouteErrorBoundary>} />
          <Route path="/clientes/:id" element={<ClientHub />} />
          <Route path="/clientes/:clientId/editar" element={<RouteErrorBoundary routeName="EditClient"><EditClient /></RouteErrorBoundary>} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientHub />} />
          <Route path="/new-client" element={<RouteErrorBoundary routeName="NewClient"><NewClient /></RouteErrorBoundary>} />
          <Route path="/edit-client/:clientId" element={<RouteErrorBoundary routeName="EditClient"><EditClient /></RouteErrorBoundary>} />
          <Route path="/tarefas" element={<Tasks />} />
          <Route path="/entregas" element={<Fulfillment />} />
          <Route path="/contratos" element={<Contracts />} />
          <Route path="/projetos" element={<Projects />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/pacotes" element={<Packages />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/equipe" element={<Team />} />
          <Route path="/cadastros" element={<Registries />} />
          <Route path="/usuarios" element={<UsersPermissions />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminSettings />} />
          <Route path="/dashboard-executivo" element={<ExecutiveDashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/pops" element={<PopLibrary />} />
          <Route path="/sla" element={<SlaRules />} />
          <Route path="/importar" element={<DataImport />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

function AuthRoutes() {
  const { session, loading } = useAuth();
  const hasAdmin = useHasAdmin();

  if (loading || hasAdmin === null) return null;
  if (!hasAdmin) return <Navigate to="/setup" replace />;
  if (session) return <Navigate to="/" replace />;

  return <AuthPage />;
}

function SetupRoute() {
  const hasAdmin = useHasAdmin();
  if (hasAdmin === null) return null;
  if (hasAdmin) return <Navigate to="/login" replace />;
  return <SetupPage />;
}

// Multi-tenant: roteamento por hostname
function PublicRoutes() {
  const host = getRootHost();

  // pixelsystem.online → landing institucional Pixel Systems + rota de cadastro de nova agência
  if (host === PIXEL_HOST) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PixelSystemsLanding />} />
          <Route path="/nova-agencia" element={<NovaAgenciaPage />} />
          <Route path="/login" element={<AuthRoutes />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/setup" element={<SetupRoute />} />
          <Route path="/*" element={<PixelSystemsLanding />} />
        </Routes>
      </Suspense>
    );
  }

  // agencia.pixelsystem.online → landing pública do Totum + cadastro de nova agência
  // (quando o domínio estiver apontando para este projeto no Vercel)
  if (host === AGENCY_HOST) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/nova-agencia" element={<NovaAgenciaPage />} />
          <Route path="/login" element={<AuthRoutes />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Suspense>
    );
  }

  // ola.pixelsystem.online + totum.pixelsystem.online + subdomínios de tenants → app normal
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<AuthRoutes />} />
        <Route path="/setup" element={<SetupRoute />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <GlobalLoadingProvider>
          <DemoProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <TenantProvider>
                <AuthProvider>
                  <PublicRoutes />
                </AuthProvider>
              </TenantProvider>
            </BrowserRouter>
          </DemoProvider>
        </GlobalLoadingProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
