import { getAllPages } from "@/lib/api";
import type { Category, Race, Season } from "@/lib/contracts";

export async function getCategorySelection(value?: string) {
  const categories = await getAllPages<Category>("categories");
  const selected = categories.items.find((category) => String(category.id) === value) ?? categories.items[0];
  return { categories: categories.items, selected };
}

export function categoryHref(path: string, id?: number) {
  return id === undefined ? path : `${path}?categoria=${id}`;
}

export function seasonsForCategory(seasons: Season[], categoryId?: number) {
  return seasons.filter((season) => season.categoryId === categoryId)
    .sort((a, b) => b.year - a.year || b.id - a.id);
}

export function countRacesBySeason(races: Race[]) {
  const counts = new Map<number, number>();
  for (const race of races) counts.set(race.seasonId, (counts.get(race.seasonId) ?? 0) + 1);
  return counts;
}

export function seasonHref(path: string, categoryId?: number, season?: string | number) {
  const href = categoryHref(path, categoryId);
  return season === undefined ? href : `${href}${href.includes("?") ? "&" : "?"}temporada=${season}`;
}

export function pageItems<T>(items: T[], requested: string | undefined, size: number) {
  const parsed = Number(requested ?? "0");
  const page = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  const totalPages = Math.ceil(items.length / size);
  const current = Math.min(page, Math.max(totalPages - 1, 0));
  return { page: current, content: items.slice(current * size, (current + 1) * size), totalPages };
}
