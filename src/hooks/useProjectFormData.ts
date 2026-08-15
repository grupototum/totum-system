import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getClientDisplayName } from "@/lib/clients";

export interface ProjectFormData {
  clients: any[];
  contracts: { id: string; title: string; client_id: string }[];
  projectTypes: { id: string; name: string }[];
  profiles: { user_id: string; full_name: string }[];
  projectTemplates: any[];
  loading: boolean;
}

export function useProjectFormData(open: boolean, organizationId: string | undefined): ProjectFormData {
  const [clients, setClients] = useState<any[]>([]);
  const [contracts, setContracts] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string }[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    let profilesQuery = supabase.from("profiles").select("user_id, full_name").eq("status", "ativo").order("full_name");
    if (organizationId) {
      profilesQuery = profilesQuery.eq("organization_id", organizationId);
    } else {
      profilesQuery = profilesQuery.eq("is_master", false);
    }

    Promise.all([
      supabase.from("clients").select("*"),
      supabase.from("contracts").select("id, title, client_id").eq("status", "ativo").order("title"),
      supabase.from("project_types").select("id, name").eq("is_active", true).order("name"),
      profilesQuery,
      supabase.from("project_templates").select("*, project_template_tasks(*)").order("name"),
    ]).then(([c, ct, pt, p, tpl]) => {
      const activeClients = ((c.data as any[]) || [])
        .filter((client) => ["ativo", "active"].includes((client.status || "").toLowerCase()))
        .sort((a: any, b: any) => getClientDisplayName(a).localeCompare(getClientDisplayName(b), "pt-BR"));
      setClients(activeClients);
      setContracts((ct.data as any) || []);
      setProjectTypes(pt.data || []);
      setProfiles((p.data as any) || []);
      setProjectTemplates(tpl.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error("[useProjectFormData] Erro ao carregar dados:", err);
      setLoading(false);
    });
  }, [open, organizationId]);

  return { clients, contracts, projectTypes, profiles, projectTemplates, loading };
}
