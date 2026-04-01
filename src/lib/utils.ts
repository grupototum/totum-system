import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeLookup<T>(map: Record<string, T>, key: string | undefined | null, fallback: T): T {
  return (key && map[key]) || fallback;
}
