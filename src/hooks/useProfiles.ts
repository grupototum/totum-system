import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type ProfileRow = Tables<"profiles"> & {
  roles?: { name: string; permissions: any } | null;
  departments?: { name: string } | null;
};

export type RoleRow = Tables<"roles">;
export type AuditRow = Tables<"audit_logs">;

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, roles(name, permissions), departments(name)")
      .order("full_name");

    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles((data as ProfileRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = async (id: string, updates: Partial<Tables<"profiles">>) => {
    const { error } = await supabase.from("profiles").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  const deleteProfile = async (id: string) => {
    // We can't delete auth users from client, but we can set status
    const { error } = await supabase.from("profiles").update({ status: "inativo" as any }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    return true;
  };

  return { profiles, loading, refetch: fetch, updateProfile, deleteProfile };
}

export function useRoles() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching roles:", error);
    } else {
      setRoles(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const saveRole = async (role: Partial<RoleRow> & { name: string; permissions: any }) => {
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
      toast({ title: "Cargo atualizado", description: role.name });
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
      toast({ title: "Cargo criado", description: role.name });
    }
    await fetch();
    return true;
  };

  const deleteRole = async (id: string, name: string) => {
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    await fetch();
    toast({ title: "Cargo removido", description: name });
    return true;
  };

  const duplicateRole = async (role: RoleRow) => {
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
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, loading, refetch: fetch };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);

  useEffect(() => {
    supabase.from("departments").select("*").eq("is_active", true).order("name")
      .then(({ data }) => setDepartments(data || []));
  }, []);

  return departments;
}
