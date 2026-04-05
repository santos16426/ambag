import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when the value is already an absolute URL (e.g. OAuth picture), not a Supabase storage path. */
export function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function formatDisplayDate(raw: string | null): {
  month: string;
  day: number;
} {
  const date = raw ? new Date(raw) : new Date();
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.getDate(),
  };
}
