import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";

export function usePermissions() {
  const { profile, user } = useAuth();
  const { isDemoMode } = useDemo();

  const permissions = useMemo(() => {
    if (isDemoMode) return {} as Record<string, boolean>;
    return (profile?.roles?.permissions as Record<string, boolean>) ?? {};
  }, [profile, isDemoMode]);

  // Heurística legada (nome da role contém "admin"): fica só como fallback
  // síncrono enquanto a RPC oficial não responde, pra não "piscar" a UI de
  // admins de verdade. Ela pode dar falso positivo (ex: role "Administrativo
  // Financeiro") — por isso não é mais a fonte de verdade, só usada até a
  // RPC abaixo confirmar o valor real (B-030).
  const roleNameGuess = useMemo(() => {
    const roleName = profile?.roles?.name?.toLowerCase() || "";
    return roleName.includes("admin") || roleName.includes("administrador") || roleName.includes("master");
  }, [profile]);

  // Fonte de verdade: user_roles.role = 'admin' via RPC is_admin() (a mesma
  // função usada pelas RLS policies no banco). Se a RPC falhar, cai de volta
  // pra heurística acima em vez de bloquear o usuário por uma falha de rede.
  const { data: isAdminConfirmed } = useQuery({
    queryKey: ["is_admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin", { _user_id: user!.id });
      if (error) throw error;
      return data === true;
    },
    enabled: !isDemoMode && !!user?.id,
    staleTime: 60_000,
    retry: 1,
  });

  const isAdmin = useMemo(() => {
    if (isDemoMode) return true;
    if (profile?.is_master) return true;
    return isAdminConfirmed ?? roleNameGuess;
  }, [isDemoMode, profile?.is_master, isAdminConfirmed, roleNameGuess]);

  /** Check a single permission key like "fin_geral.visualizar" */
  const hasPermission = (key: string): boolean => {
    if (isDemoMode || isAdmin) return true;
    return permissions[key] === true;
  };

  /** Check if user has ANY of the given permission keys */
  const hasAnyPermission = (...keys: string[]): boolean => {
    if (isDemoMode || isAdmin) return true;
    return keys.some((k) => permissions[k] === true);
  };

  /** Check if user can access a module (checks visualizar on the _geral subcategory) */
  const canAccessModule = (moduleKey: string): boolean => {
    if (isDemoMode || isAdmin) return true;
    // Check the most common pattern: module_geral.visualizar
    const generalKey = `${moduleKey}_geral.visualizar`;
    return permissions[generalKey] === true;
  };

  /** Check if user can view financial data */
  const canViewFinancial = hasAnyPermission(
    "fin_geral.visualizar",
    "fin_pagar.visualizar",
    "fin_receber.visualizar"
  );

  /** Check if user can view reports */
  const canViewReports = hasAnyPermission(
    "rel_financeiros.visualizar",
    "rel_operacionais.visualizar",
    "rel_tarefas.visualizar",
    "rel_clientes.visualizar",
    "rel_contratos.visualizar"
  );

  /** Check if user can view client documents (CPF/CNPJ) */
  const canViewDocuments = isAdmin || hasPermission("cli_geral.editar");

  /** Mask a document string for unauthorized users */
  const maskDocument = (doc: string | null | undefined): string => {
    if (!doc) return "";
    if (canViewDocuments) return doc;
    const clean = doc.replace(/\D/g, "");
    if (clean.length <= 4) return "***";
    return "*".repeat(clean.length - 4) + clean.slice(-4);
  };

  return {
    permissions,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    canAccessModule,
    canViewFinancial,
    canViewReports,
    canViewDocuments,
    maskDocument,
  };
}
