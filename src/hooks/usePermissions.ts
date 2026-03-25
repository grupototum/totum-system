import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";

export function usePermissions() {
  const { profile } = useAuth();
  const { isDemoMode } = useDemo();

  const permissions = useMemo(() => {
    if (isDemoMode) return {} as Record<string, boolean>;
    return (profile?.roles?.permissions as Record<string, boolean>) ?? {};
  }, [profile, isDemoMode]);

  const isAdmin = useMemo(() => {
    if (isDemoMode) return true;
    const roleName = profile?.roles?.name?.toLowerCase();
    return roleName === "administrador" || roleName === "admin";
  }, [profile, isDemoMode]);

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
