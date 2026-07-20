import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useDemo } from "@/contexts/DemoContext";
import { useTenant } from "@/contexts/TenantContext";
import { demoProfilesList, demoRolesList, demoAuditLogsList, demoDepartmentsList } from "@/data/demoData";
import type { Tables } from "@/integrations/supabase/types";
import {
  listProfilesForAdmin,
  updateProfileAdmin,
  type ProfileRow,
} from "@/data/profiles.repo";
import { listRoles, createRole, updateRole, deleteRole as deleteRoleRepo, type RoleRow } from "@/data/roles.repo";
import { listAuditLogs, type AuditLogRow } from "@/data/audit-logs.repo";
import { listDepartments } from "@/data/departments.repo";
import { listAdminUserIds, grantAdmin, revokeAdmin } from "@/data/user-roles.repo";

export type { ProfileRow, RoleRow, AuditLogRow as AuditRow };

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
      const data = await listProfilesForAdmin(tenant?.organization_id);
      setProfiles(data);
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
    try {
      await updateProfileAdmin(id, updates);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao atualizar", description: message, variant: "destructive" });
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
    try {
      await updateProfileAdmin(id, { status: "inativo" as Tables<"profiles">["status"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao remover", description: message, variant: "destructive" });
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
      setRoles(await listRoles());
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
    try {
      if (role.id) {
        await updateRole(role.id, {
          name: role.name,
          description: role.description || null,
          permissions: role.permissions,
        });
        toast({ title: "Perfil atualizado", description: role.name });
      } else {
        await createRole({
          name: role.name,
          description: role.description || null,
          permissions: role.permissions,
        });
        toast({ title: "Perfil criado", description: role.name });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteRole = async (id: string, name: string) => {
    if (isDemoMode) {
      toast(DEMO_TOAST);
      return true;
    }
    try {
      await deleteRoleRepo(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
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
    try {
      await createRole({
        name: `${role.name} (cópia)`,
        description: role.description,
        permissions: role.permissions,
        is_system: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
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
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    if (isDemoMode) {
      setLogs(demoAuditLogsList as unknown as AuditLogRow[]);
      setLoading(false);
      return;
    }

    try {
      setLogs(await listAuditLogs(200));
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

  useEffect(() => {
    if (isDemoMode) {
      setDepartments(demoDepartmentsList as unknown as Tables<"departments">[]);
      return;
    }

    listDepartments()
      .then(setDepartments)
      .catch((error) => {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      });
  }, [isDemoMode]);

  return departments;
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
      setAdminUserIds(new Set(await listAdminUserIds()));
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
    try {
      if (isCurrentlyAdmin) {
        await revokeAdmin(userId);
        toast({ title: "Admin removido", description: "Permissão administrativa removida" });
      } else {
        await grantAdmin(userId);
        toast({ title: "Admin concedido", description: "Permissão administrativa concedida" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { adminUserIds, loading, refetch: fetch, toggleAdmin };
}
