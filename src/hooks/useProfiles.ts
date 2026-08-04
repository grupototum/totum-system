import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoProfilesList, demoRolesList, demoAuditLogsList, demoDepartmentsList } from "@/data/demoData";
import type { Tables } from "@/integrations/supabase/types";

export type ProfileRow = Tables<"profiles"> & {
  roles?: { name: string; permissions: any } | null;
  departments?: { name: string } | null;
};

export type RoleRow = Tables<"roles">;
export type AuditRow = Tables<"audit_logs">;

const DEMO_TOAST = { title: "🎭 Modo Demonstração", description: "Ação simulada — nenhuma alteração foi salva." };

export function useProfiles() {
  const { isDemoMode } = useDemo();
  const { tenant } = useTenant();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setProfiles(demoProfilesList as unknown as ProfileRow[]);
      setLoading(false);
      return;
    }

    try {
      // Explicit org filter on top of RLS: master users bypass RLS and would
      // otherwise see profiles from ALL organizations.
      let query = supabase
        .from("profiles")
        .select("*, roles(name, permissions), departments(name)")
        .order("full_name");

      if (tenant?.organization_id) {
        // Inclui perfis com organization_id NULL (órfãos de signups antigos):
        // .eq() nunca casa NULL, o que os tornava invisíveis para o admin em
        // /usuarios — impossibilitando aprová-los ou corrigi-los pela UI.
        query = query.or(
          `organization_id.eq.${tenant.organization_id},organization_id.is.null`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching profiles:", error);
        setProfiles([]);
        return;
      }

      setProfiles((data as ProfileRow[]) || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, tenant?.organization_id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateProfile = useCallback(async (id: string, updates: Partial<Tables<"profiles">>) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  }, [isDemoMode, fetch]);

  const deleteProfile = useCallback(async (id: string) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    const { error } = await supabase.from("profiles").update({ status: "inativo" as Tables<"profiles">["status"] }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  }, [isDemoMode, fetch]);

  return { profiles, loading, refetch: fetch, updateProfile, deleteProfile };
}

export function useRoles() {
  const { isDemoMode } = useDemo();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setRoles(demoRolesList as unknown as RoleRow[]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const saveRole = async (role: Partial<RoleRow> & { name: string; permissions: any }) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    if (role.id) {
      const { error } = await supabase.from("roles").update({
        name: role.name,
        description: role.description || null,
        permissions: role.permissions,
      }).eq("id", role.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Perfil atualizado", description: role.name });
    } else {
      const { error } = await supabase.from("roles").insert({
        name: role.name,
        description: role.description || null,
        permissions: role.permissions,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Perfil criado", description: role.name });
    }
    await fetch();
    return true;
  };

  const deleteRole = async (id: string, name: string) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Perfil removido", description: name });
    return true;
  };

  const duplicateRole = async (role: RoleRow) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    const { error } = await supabase.from("roles").insert({
      name: `${role.name} (cópia)`,
      description: role.description,
      permissions: role.permissions,
      is_system: false,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Perfil duplicado", description: `${role.name} (cópia)` });
    return true;
  };

  return { roles, loading, refetch: fetch, saveRole, deleteRole, duplicateRole };
}

export function useAuditLogs() {
  const { isDemoMode } = useDemo();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setLogs(demoAuditLogsList as unknown as AuditRow[]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching audit logs:", error);
        setLogs([]);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { logs, loading, refetch: fetch };
}

export function useDepartments() {
  const { isDemoMode } = useDemo();
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setDepartments(demoDepartmentsList as unknown as Tables<"departments">[]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
        return;
      }

      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return { departments, loading, refetch: loadDepartments };
}

export function useUserRoles() {
  const { isDemoMode } = useDemo();
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      // In demo, Ana Silva (demo-user-1) is admin
      setAdminUserIds(new Set(["demo-user-1"]));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      if (error) {
        console.error("Error fetching user roles:", error);
        setAdminUserIds(new Set());
        return;
      }

      setAdminUserIds(new Set((data || []).map((r) => r.user_id)));
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setAdminUserIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    if (isCurrentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Admin removido", description: "Permissão administrativa removida" });
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return false;
      }
      toast({ title: "Admin concedido", description: "Permissão administrativa concedida" });
    }
    await fetch();
    return true;
  };

  return { adminUserIds, loading, refetch: fetch, toggleAdmin };
}
