import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatResult(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "-";
  return num.toFixed(2);
}
