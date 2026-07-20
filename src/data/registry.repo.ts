// Camada de acesso a dados para o motor genérico de "Cadastros" (Registries):
// ~20 tabelas de referência pequenas, mesmo shape de CRUD, nome da tabela é
// dinâmico em runtime — não faz sentido um repo por tabela aqui (ver
// useRegistryData.ts para o mapeamento de cada registryKey -> tabela).
import { supabase } from "@/integrations/supabase/client";

export async function listRegistryRows(table: string) {
  const { data, error } = await (supabase.from(table as any) as any).select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function createRegistryRow(table: string, values: Record<string, any>) {
  const { error } = await (supabase.from(table as any) as any).insert(values);
  if (error) throw error;
}

export async function updateRegistryRow(table: string, id: string, values: Record<string, any>) {
  const { error } = await (supabase.from(table as any) as any).update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteRegistryRow(table: string, id: string) {
  const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
  if (error) throw error;
}

export async function setRegistryRowActive(table: string, id: string, isActive: boolean) {
  const { error } = await (supabase.from(table as any) as any).update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

// Usado para popular dropdowns de FK (sourceTable) nos formulários de Cadastros.
export async function listActiveIdNameOptions(table: string) {
  const { data, error } = await (supabase.from(table as any) as any).select("id, name").eq("is_active", true).order("name");
  if (error) throw error;
  return (data || []) as { id: string; name: string }[];
}

// Usado pelo QuickAddDialog — insert genérico retornando a linha criada.
export async function createRegistryRowReturning(table: string, values: Record<string, any>) {
  const { data, error } = await (supabase.from(table as any) as any).insert(values).select().single();
  if (error) throw error;
  return data as { id: string; name?: string };
}
