export type ClientLike = {
  name?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  cnpj?: string | null;
  status?: string | null;
};

export function getClientDisplayName(client?: ClientLike | null) {
  return client?.company_name?.trim() || client?.name?.trim() || "—";
}

export function getClientSecondaryInfo(client?: ClientLike | null) {
  return client?.contact_name?.trim() || client?.email?.trim() || client?.phone?.trim() || "—";
}

export function getClientStatusLabel(status?: string | null) {
  if (!status) return "—";

  const normalized = status.toLowerCase();
  if (normalized === "active") return "ativo";
  if (normalized === "inactive") return "inativo";
  if (normalized === "pending") return "pendente";
  return normalized;
}
