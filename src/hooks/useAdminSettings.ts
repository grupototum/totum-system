import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/errorHandler";
import { useAuth } from "@/hooks/useAuth";

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data: existing } = await supabase.from("company_settings").select("id").limit(1).single();
      if (!existing) throw new Error("Configurações não encontradas");
      const { error } = await supabase.from("company_settings").update(updates).eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company_settings"] });
      toast({ title: "Salvo", description: "Configurações da empresa atualizadas." });
    },
    onError: (err) => {
      const friendly = handleApiError(err, "update_company_settings", user?.id);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
    },
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data: existing } = await supabase.from("system_settings").select("id").limit(1).single();
      if (!existing) throw new Error("Configurações não encontradas");
      const { error } = await supabase.from("system_settings").update(updates).eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_settings"] });
      toast({ title: "Salvo", description: "Configurações do sistema atualizadas." });
    },
    onError: (err) => {
      const friendly = handleApiError(err, "update_system_settings", user?.id);
      toast({ title: friendly.title, description: friendly.description, variant: "destructive" });
    },
  });
}

export function useAuditLogs(filters?: { entityType?: string; limit?: number }) {
  return useQuery({
    queryKey: ["audit_logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 100);
      if (filters?.entityType) {
        query = query.eq("entity_type", filters.entityType);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useErrorLogs() {
  return useQuery({
    queryKey: ["error_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}
