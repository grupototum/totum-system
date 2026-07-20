// Camada de acesso a dados de `clients` — piloto do padrão repo por entidade.
// Convenção: nomes por caso de uso (listX/getXDetail/searchX), não CRUD genérico
// solto; toda mutação mora aqui, nunca em hook/componente; tipos vêm de
// `Tables<>` (gerados do schema), nunca redefinidos à mão.
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { attachOrganizationId } from "@/lib/tenant";

// `company_name`/`contact_name`/`cnpj` não existem na coluna real da tabela
// (ver `clients.Row` gerado) — mantidos como opcionais fantasmas para não
// alterar o comportamento de `getClientDisplayName`/`getClientSecondaryInfo`,
// que já toleram sua ausência. Não é escopo deste piloto corrigir o drift.
export type ClientRow = Tables<"clients"> & {
  company_name?: string | null;
  contact_name?: string | null;
  cnpj?: string | null;
  contracts?: { value: number | null; plan_id: string | null; status: string; plans?: { name: string } | null }[];
};

export async function listClients(): Promise<ClientRow[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("*, contracts(value, plan_id, status, plans(name))");

  if (error) throw error;
  return (data as ClientRow[]) || [];
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data as ClientRow;
}

export async function createClient(values: Partial<Tables<"clients">>, organizationId?: string) {
  const payload = attachOrganizationId(values as any, organizationId);
  const { error } = await supabase.from("clients").insert(payload);
  if (error) throw error;
}

// Usada pela importação de dados (useImportData) — precisa do id de volta.
export async function createClientReturningId(values: Partial<Tables<"clients">>, organizationId?: string) {
  const payload = attachOrganizationId(values as any, organizationId);
  const { data, error } = await supabase.from("clients").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function updateClient(id: string, values: Partial<Tables<"clients">>) {
  const { error } = await supabase.from("clients").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function listActiveClientsForDropdown() {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("status", "ativo")
    .order("name");
  if (error) throw error;
  return data || [];
}

// Usada pela importação de dados (useImportData) para casar clientes existentes pelo nome.
export async function listAllClientsRaw(): Promise<ClientRow[]> {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return (data as ClientRow[]) || [];
}

// Status aceita "ativo" ou "active" (dado legado inconsistente) — mesma
// checagem tolerante que os formulários de lançamento e projeto já faziam.
export async function listActiveClientsLenient(): Promise<ClientRow[]> {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return ((data as ClientRow[]) || []).filter((client) =>
    ["ativo", "active"].includes((client.status || "").toLowerCase())
  );
}
