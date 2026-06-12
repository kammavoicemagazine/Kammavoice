import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string into a readable format */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a date in Telugu style */
export function formatDateTelugu(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("te-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Truncate text to a specified length */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

/** Generate a URL-friendly slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Estimate reading time in minutes */
export function readingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/** Get category-specific fallback image placeholder URL */
export function getCategoryPlaceholder(category: string | undefined | null): string {
  if (!category) return "/images/news-placeholder.svg";
  
  const cleanCategory = category.trim().toLowerCase();
  switch (cleanCategory) {
    case "politics":
    case "political":
      return "/images/politics-placeholder.svg";
    case "business":
    case "economy":
    case "finance":
      return "/images/business-placeholder.svg";
    case "agriculture":
    case "farming":
    case "rural":
      return "/images/agriculture-placeholder.svg";
    case "education":
    case "career":
    case "jobs":
      return "/images/education-placeholder.svg";
    case "kamma-community":
    case "community":
    case "kamma":
      return "/images/kamma-community-placeholder.svg";
    case "ap-development":
    case "development":
    case "infrastructure":
    case "ap-news":
      return "/images/ap-development-placeholder.svg";
    default:
      return "/images/news-placeholder.svg";
  }
}

