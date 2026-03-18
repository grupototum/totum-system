import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/contexts/DemoContext";
import { demoClients } from "@/data/demoData";
import { ClientHubDeliveries } from "@/components/client-hub/ClientHubDeliveries";
import { ClientHubContracts } from "@/components/client-hub/ClientHubContracts";
import { ClientHubTimeline } from "@/components/client-hub/ClientHubTimeline";
import { ClientHubAnalysis } from "@/components/client-hub/ClientHubAnalysis";
import { ClientHubPendencies } from "@/components/client-hub/ClientHubPendencies";

export default function ClientHub() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      {/* Tabs */}
      <Tabs defaultValue="deliveries" className="space-y-4">
        <TabsList className="bg-white/[0.04] border border-border">
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analysis">Análise de Marketing</TabsTrigger>
          <TabsTrigger value="pendencies">Pendências</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries">
          <ClientHubDeliveries clientId={id!} />
        </TabsContent>
        <TabsContent value="contracts">
          <ClientHubContracts clientId={id!} />
        </TabsContent>
        <TabsContent value="timeline">
          <ClientHubTimeline clientId={id!} />
        </TabsContent>
        <TabsContent value="analysis">
          <ClientHubAnalysis clientId={id!} initialAnalysis={client.marketing_analysis || ""} />
        </TabsContent>
        <TabsContent value="pendencies">
          <ClientHubPendencies clientId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
