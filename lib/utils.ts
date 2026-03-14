import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
