import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export async function listActiveSlaRules(): Promise<Tables<"sla_rules">[]> {
  const { data, error } = await supabase.from("sla_rules").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data || [];
}
