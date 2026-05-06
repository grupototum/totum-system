import { Icon as IconifyIcon, type IconProps as IconifyProps } from "@iconify/react";
import { cn } from "@/lib/utils";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

/** Default fallback icon shown when the requested icon fails to load. */
export const DEFAULT_FALLBACK_ICON = "lucide:help-circle";

export interface IconProps extends Omit<IconifyProps, "icon" | "width" | "height"> {
  /** Iconify icon name, e.g. "lucide:check", "mdi:account" */
  name: string;
  /** Predefined size token. Defaults to "sm" (16px). */
  size?: IconSize;
  /** Icon to render if `name` is empty/invalid or fails to resolve. */
  fallback?: string;
  className?: string;
}

/**
 * Standardized icon component.
 * Wraps @iconify/react with consistent sizing, currentColor, and a safe fallback
 * so missing icons never break the UI.
 *
 * @example
 * <Icon name="lucide:check" size="md" className="text-primary" />
 * <Icon name={maybeMissing} fallback="lucide:circle" />
 */
export function Icon({
  name,
  size = "sm",
  fallback = DEFAULT_FALLBACK_ICON,
  className,
  ...rest
}: IconProps) {
  const resolved = typeof name === "string" && name.trim().length > 0 ? name : fallback;

  return (
    <IconifyIcon
      icon={resolved}
      // Iconify renders this placeholder if the icon name can't be resolved.
      fallback={<IconifyIcon icon={fallback} className={cn(sizeMap[size], "shrink-0 opacity-60", className)} />}
      className={cn(sizeMap[size], "shrink-0", className)}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    />
  );
}

export default Icon;
