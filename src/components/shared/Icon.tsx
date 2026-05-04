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

export interface IconProps extends Omit<IconifyProps, "icon" | "width" | "height"> {
  /** Iconify icon name, e.g. "lucide:check", "mdi:account" */
  name: string;
  /** Predefined size token. Defaults to "sm" (16px). */
  size?: IconSize;
  className?: string;
}

/**
 * Standardized icon component.
 * Wraps @iconify/react with consistent sizing tokens and currentColor.
 *
 * @example
 * <Icon name="lucide:check" size="md" className="text-primary" />
 */
export function Icon({ name, size = "sm", className, ...rest }: IconProps) {
  return (
    <IconifyIcon
      icon={name}
      className={cn(sizeMap[size], "shrink-0", className)}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    />
  );
}

export default Icon;
