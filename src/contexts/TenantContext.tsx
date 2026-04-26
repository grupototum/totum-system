import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRuntimeTenantHost } from "@/lib/tenant";

export interface TenantRecord {
  organization_id: string | null;
  organization_slug: string;
  organization_name: string;
  display_name: string;
  logo_url: string | null;
  primary_hostname: string;
  matched_hostname: string;
  match_type: string;
  fallback?: boolean;
}

interface TenantContextValue {
  tenant: TenantRecord | null;
  host: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

function buildFallbackTenant(host: string): TenantRecord {
  return {
    organization_id: null,
    organization_slug: "totum",
    organization_name: "Totum System",
    display_name: "Totum System",
    logo_url: null,
    primary_hostname: host,
    matched_hostname: host,
    match_type: "fallback",
    fallback: true,
  };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [host] = useState(() => getRuntimeTenantHost());
  const [tenant, setTenant] = useState<TenantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveTenant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("resolve_organization_by_host" as any, {
        _host: host,
      });

      if (rpcError) throw rpcError;

      const resolved = Array.isArray(data) ? data[0] : data;

      if (!resolved) {
        setTenant(buildFallbackTenant(host));
        return;
      }

      setTenant({
        organization_id: resolved.organization_id ?? null,
        organization_slug: resolved.organization_slug ?? "totum",
        organization_name: resolved.organization_name ?? resolved.display_name ?? "Totum System",
        display_name: resolved.display_name ?? resolved.organization_name ?? "Totum System",
        logo_url: resolved.logo_url ?? null,
        primary_hostname: resolved.primary_hostname ?? host,
        matched_hostname: resolved.matched_hostname ?? host,
        match_type: resolved.match_type ?? "exact",
      });
    } catch (err: any) {
      console.error("[Tenant] Error resolving tenant:", err);
      setError(err?.message || "Falha ao resolver tenant");
      setTenant(buildFallbackTenant(host));
    } finally {
      setLoading(false);
    }
  }, [host]);

  useEffect(() => {
    void resolveTenant();
  }, [resolveTenant]);

  const value = useMemo(
    () => ({ tenant, host, loading, error, refresh: resolveTenant }),
    [tenant, host, loading, error, resolveTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
