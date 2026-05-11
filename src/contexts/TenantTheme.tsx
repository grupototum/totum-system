/**
 * TenantTheme — injeta CSS variables customizadas por tenant.
 * Envolve a aplicação (dentro de TenantProvider) e aplica cores
 * do tenant via style inline no root div.
 *
 * Campos usados de TenantRecord:
 *   primary_color  → --primary (e derivados)
 *   bg_color       → --background (somente em páginas de auth via data-attr)
 *   card_color     → --card (somente em páginas de auth via data-attr)
 */

import { type ReactNode, useEffect } from "react";
import { useTenant } from "./TenantContext";

function hexToHsl(hex: string): string | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function TenantTheme({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();

  useEffect(() => {
    const root = document.documentElement;
    const style = root.style;

    const isTenantCustom = tenant?.organization_slug && tenant.organization_slug !== "totum";

    if (isTenantCustom && tenant?.primary_color) {
      const hsl = hexToHsl(tenant.primary_color);
      if (hsl) {
        style.setProperty("--tenant-primary", hsl);
        // Override Tailwind's --primary so all buttons/accents use tenant color
        style.setProperty("--primary", hsl);
        style.setProperty("--primary-foreground", "0 0% 100%");
        style.setProperty("--ring", hsl);
      }
    }

    if (isTenantCustom && tenant?.bg_color) {
      const hsl = hexToHsl(tenant.bg_color);
      if (hsl) style.setProperty("--tenant-bg", hsl);
    }

    if (isTenantCustom && tenant?.card_color) {
      const hsl = hexToHsl(tenant.card_color);
      if (hsl) style.setProperty("--tenant-card", hsl);
    }

    // Mark the slug so CSS can target it
    if (isTenantCustom) {
      root.setAttribute("data-tenant", tenant!.organization_slug);
    } else {
      root.removeAttribute("data-tenant");
    }

    return () => {
      style.removeProperty("--tenant-primary");
      style.removeProperty("--tenant-bg");
      style.removeProperty("--tenant-card");
      // Restore default Totum primary on cleanup
      style.removeProperty("--primary");
      style.removeProperty("--primary-foreground");
      style.removeProperty("--ring");
      root.removeAttribute("data-tenant");
    };
  }, [tenant]);

  return <>{children}</>;
}
