import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sortByCreatedAtAsc = <T extends { createdAt: string }>(
  items: T[]
): T[] => {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const numberFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 2,
});

export const formatCurrency = (amount: number | string) => {
  if (typeof amount === "string") {
    return numberFormat.format(Number.parseFloat(amount));
  }
  return numberFormat.format(amount);
};
