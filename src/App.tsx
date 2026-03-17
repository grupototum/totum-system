import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Fulfillment from "./pages/Fulfillment";
import Contracts from "./pages/Contracts";
import Projects from "./pages/Projects";
import Financial from "./pages/Financial";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import SettingsPage from "./pages/SettingsPage";
import Registries from "./pages/Registries";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/entregas" element={<Fulfillment />} />
            <Route path="/contratos" element={<Contracts />} />
            <Route path="/projetos" element={<Projects />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/equipe" element={<Team />} />
            <Route path="/cadastros" element={<Registries />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
