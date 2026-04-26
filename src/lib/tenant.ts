const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const PREVIEW_HOST_MARKERS = ["vercel.app", "lovableproject.com", "id-preview--"];

export function normalizeHost(input?: string | null) {
  if (!input) return "";

  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

export function getTenantFallbackHost() {
  return normalizeHost(import.meta.env.VITE_TENANT_FALLBACK_HOST) || "pixelsystem.online";
}

export function getRuntimeTenantHost() {
  const currentHost = normalizeHost(window.location.host || window.location.hostname);

  if (!currentHost) return getTenantFallbackHost();

  if (
    LOCAL_HOSTS.has(currentHost) ||
    currentHost.endsWith(".local") ||
    PREVIEW_HOST_MARKERS.some((marker) => currentHost.includes(marker))
  ) {
    return getTenantFallbackHost();
  }

  return currentHost;
}

export function attachOrganizationId<T extends Record<string, any>>(payload: T, organizationId?: string | null): T {
  if (!organizationId) return payload;

  return {
    ...payload,
    organization_id: organizationId,
  };
}
