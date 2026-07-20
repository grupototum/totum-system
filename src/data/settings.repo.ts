import { supabase } from "@/integrations/supabase/client";

// `organization_settings` não está no types.ts gerado (drift conhecido) —
// cast `as any` preservado, não é escopo desta refatoração corrigir.
export async function getOrganizationSettings(organizationId: string) {
  const { data, error } = await supabase
    .from("organization_settings" as any)
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertOrganizationSettings(organizationId: string, updates: Record<string, any>) {
  const payload = {
    organization_id: organizationId,
    name: updates.name || "",
    email: updates.email || null,
    phone: updates.phone || null,
    address: updates.address || null,
  };
  const { error } = await supabase.from("organization_settings" as any).upsert(payload, { onConflict: "organization_id" });
  if (error) throw error;
}

export async function getCompanySettings() {
  const { data, error } = await supabase.from("company_settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCompanySettings(updates: Record<string, any>) {
  const { data: existing } = await supabase.from("company_settings").select("id").limit(1).maybeSingle();
  if (!existing) throw new Error("Configurações não encontradas");
  const { error } = await supabase.from("company_settings").update(updates as any).eq("id", existing.id);
  if (error) throw error;
}

export async function getSystemSettings() {
  const { data, error } = await supabase.from("system_settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSystemSettings(updates: Record<string, any>) {
  const { data: existing } = await supabase.from("system_settings").select("id").limit(1).maybeSingle();
  if (!existing) throw new Error("Configurações não encontradas");
  const { error } = await supabase.from("system_settings").update(updates as any).eq("id", existing.id);
  if (error) throw error;
}
