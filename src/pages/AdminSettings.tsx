import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Building2, Cog, DollarSign, Puzzle, ScrollText, Loader2, Save, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { CompanyTab } from "@/components/admin-settings/CompanyTab";
import { SystemTab } from "@/components/admin-settings/SystemTab";
import { FinancialTab } from "@/components/admin-settings/FinancialTab";
import { AdminIntegrationsTab } from "@/components/admin-settings/AdminIntegrationsTab";
import { AuditLogsTab } from "@/components/admin-settings/AuditLogsTab";

export default function AdminSettings() {
  const { profile, loading } = useAuth();
  const { isDemoMode } = useDemo();

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = isDemoMode || 
    profile?.roles?.name?.toLowerCase() === "administrador" ||
    profile?.roles?.name?.toLowerCase() === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
        <div className="glass-card rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-heading font-semibold text-lg mb-2">Acesso restrito</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Apenas administradores podem acessar as configurações administrativas do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Configuração Administrativa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie empresa, sistema, finanças, integrações e auditoria
        </p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="empresa" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-1.5">
            <Cog className="h-3.5 w-3.5" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-1.5">
            <Puzzle className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Logs e Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <div className="glass-card rounded-xl p-6">
            <CompanyTab />
          </div>
        </TabsContent>

        <TabsContent value="sistema">
          <div className="glass-card rounded-xl p-6">
            <SystemTab />
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="glass-card rounded-xl p-6">
            <FinancialTab />
          </div>
        </TabsContent>

        <TabsContent value="integracoes">
          <AdminIntegrationsTab />
        </TabsContent>

        <TabsContent value="logs">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
