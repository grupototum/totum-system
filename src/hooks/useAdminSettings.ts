import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/errorHandler";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoCompanySettings, demoSystemSettings, demoAuditLogsList } from "@/data/demoData";
import {
  getOrganizationSettings,
  upsertOrganizationSettings,
  getCompanySettings,
  updateCompanySettings,
  getSystemSettings,
  updateSystemSettings,
} from "@/data/settings.repo";
import { listAuditLogsFiltered } from "@/data/audit-logs.repo";
import { listErrorLogs } from "@/data/error-logs.repo";

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function useCompanySettings() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["company_settings", tenant?.organization_id, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return demoCompanySettings;

      if (tenant?.organization_id && !tenant.fallback) {
        const data = await getOrganizationSettings(tenant.organization_id);
        if (data) return data;
      }

      return getCompanySettings();
    },
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();

  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (isDemoMode) { toast(DEMO_TOAST); return; }

      if (tenant?.organization_id && !tenant.fallback) {
        await upsertOrganizationSettings(tenant.organization_id, updates);
        return;
      }

      await updateCompanySettings(updates);
    },
    onSuccess: () => {
      if (!isDemoMode) {
        qc.invalidateQueries({ queryKey: ["company_settings"] });
        toast({ title: "Salvo", description: "Configurações da empresa atualizadas." });
      }
    },
    onError: (err) => {
      if (isDemoMode) return;
      const friendly = handleApiError(err, "update_company_settings", user?.id);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
    },
  });
}

export function useSystemSettings() {
  const { isDemoMode } = useDemo();
  return useQuery({
    queryKey: ["system_settings", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return demoSystemSettings;
      return getSystemSettings();
    },
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (isDemoMode) { toast(DEMO_TOAST); return; }
      await updateSystemSettings(updates);
    },
    onSuccess: () => {
      if (!isDemoMode) {
        qc.invalidateQueries({ queryKey: ["system_settings"] });
        toast({ title: "Salvo", description: "Configurações do sistema atualizadas." });
      }
    },
    onError: (err) => {
      if (isDemoMode) return;
      const friendly = handleApiError(err, "update_system_settings", user?.id);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
    },
  });
}

export function useAuditLogs(filters?: { entityType?: string; limit?: number }) {
  const { isDemoMode } = useDemo();
  return useQuery({
    queryKey: ["audit_logs", filters, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return demoAuditLogsList;
      return listAuditLogsFiltered(filters);
    },
  });
}

export function useErrorLogs() {
  const { isDemoMode } = useDemo();
  return useQuery({
    queryKey: ["error_logs", isDemoMode],
    queryFn: async () => {
      if (isDemoMode) return [];
      return listErrorLogs(200);
    },
  });
}
