import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export function formatDate(value: string | null | undefined, pattern = "MMM d, yyyy"): string {
  const date = parseDate(value);
  return date ? format(date, pattern) : "-";
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? format(date, "MMM d, yyyy · h:mm a") : "-";
}

export function formatRelative(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "-";
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = "USD",
): string {
  if (min == null && max == null) return "-";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)}`;
  return `${formatter.format((min ?? max) as number)}+`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function isOverdue(dateValue: string | null | undefined): boolean {
  const date = parseDate(dateValue);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
