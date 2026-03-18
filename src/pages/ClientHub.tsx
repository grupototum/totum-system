import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Package, FileText, Clock, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoClients } from "@/data/demoData";
import { ClientHubDeliveries } from "@/components/client-hub/ClientHubDeliveries";
import { ClientHubContracts } from "@/components/client-hub/ClientHubContracts";
import { ClientHubTimeline } from "@/components/client-hub/ClientHubTimeline";
import { ClientHubAnalysis } from "@/components/client-hub/ClientHubAnalysis";
import { ClientHubPendencies } from "@/components/client-hub/ClientHubPendencies";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "deliveries", label: "Entregas", icon: Package },
  { value: "contracts", label: "Contratos", icon: FileText },
  { value: "timeline", label: "Timeline", icon: Clock },
  { value: "analysis", label: "Análise de Marketing", icon: BarChart3 },
  { value: "pendencies", label: "Pendências", icon: AlertTriangle },
] as const;

type TabValue = (typeof tabs)[number]["value"];

export default function ClientHub() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("deliveries");

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    if (isDemoMode) {
      const found = demoClients.find(c => c.id === id);
      setClient(found ? { ...found, client_types: null } : null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("clients")
      .select("*, client_types(name)")
      .eq("id", id)
      .single();
    setClient(data);
    setLoading(false);
  }, [id, isDemoMode]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Cliente não encontrado.
        <Button variant="link" onClick={() => navigate("/clientes")} className="ml-2">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/clientes")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">{client.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(client.client_types as any)?.name || "Sem tipo"} · {client.status}
            {client.email && ` · ${client.email}`}
          </p>
        </div>
      </div>

      {/* Vertical tabs layout */}
      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="w-52 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "deliveries" && <ClientHubDeliveries clientId={id!} />}
          {activeTab === "contracts" && <ClientHubContracts clientId={id!} />}
          {activeTab === "timeline" && <ClientHubTimeline clientId={id!} />}
          {activeTab === "analysis" && <ClientHubAnalysis clientId={id!} initialAnalysis={client.marketing_analysis || ""} />}
          {activeTab === "pendencies" && <ClientHubPendencies clientId={id!} />}
        </div>
      </div>
    </div>
  );
}
