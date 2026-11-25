import { cache } from "react";
import type {
  ApiStatus,
  CollectionResult,
  EntityResult,
  PagedResponse,
} from "@/lib/contracts";
import { referenceCollections } from "@/lib/reference-data";

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");

export interface PageOptions {
  page?: number;
  size?: number;
  sort?: string;
}

function emptyCollection<T>(status: ApiStatus): CollectionResult<T> {
  return { status, data: null };
}

async function getJson<T>(path: string): Promise<EntityResult<T>> {
  if (!apiBaseUrl) {
    return { status: "not-configured", data: null };
  }

  try {
    const response = await fetch(apiBaseUrl + "/api/v1" + path, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (response.status === 404) {
      return { status: "not-found", data: null };
    }
    if (!response.ok) {
      return { status: "unavailable", data: null };
    }

    return { status: "ready", data: (await response.json()) as T };
  } catch {
    return { status: "unavailable", data: null };
  }
}

async function getManagedCollection<T>(
  resource: string,
  options: PageOptions = {},
): Promise<CollectionResult<T>> {
  if (!apiBaseUrl) {
    return emptyCollection("not-configured");
  }

  const search = new URLSearchParams({
    page: String(options.page ?? 0),
    size: String(options.size ?? 20),
  });
  if (options.sort) {
    search.set("sort", options.sort);
  }

  const response = await getJson<PagedResponse<T>>(
    "/" + resource + "?" + search.toString(),
  );
  if (response.status !== "ready") {
    return emptyCollection(response.status);
  }
  if (!response.data || !Array.isArray(response.data.content)) {
    return emptyCollection("unavailable");
  }

  return { status: "ready", data: response.data };
}

export const getPortalSource = cache(async () => {
  const categories = await getManagedCollection("categories", { size: 1 });
  return categories.data?.totalElements
    ? { kind: "managed" as const, connected: true }
    : { kind: "reference" as const, connected: categories.status === "ready" };
});

export async function getCollection<T>(
  resource: string,
  options: PageOptions = {},
): Promise<CollectionResult<T>> {
  if ((await getPortalSource()).kind === "managed") {
    return getManagedCollection(resource, options);
  }
  const items = [...(referenceCollections[resource] ?? [])];
  const [field, direction] = options.sort?.split(",") ?? ["id", "asc"];
  const order = direction === "desc" ? -1 : 1;
  if (field === "name" || field === "realizationDate" || field === "year" || field === "id") {
    items.sort((a, b) => {
      const left = field in a ? a[field as keyof typeof a] : null;
      const right = field in b ? b[field as keyof typeof b] : null;
      return order * (typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left ?? "").localeCompare(String(right ?? ""), "pt-BR"));
    });
  }
  const page = options.page ?? 0;
  const size = options.size ?? 20;
  return {
    status: "ready",
    data: {
      content: items.slice(page * size, (page + 1) * size) as T[],
      page, size, totalElements: items.length, totalPages: Math.ceil(items.length / size),
    },
  };
}

export async function getEntity<T>(
  resource: string,
  id: number | string,
): Promise<EntityResult<T>> {
  if ((await getPortalSource()).kind === "reference") {
    const row = (referenceCollections[resource] ?? []).find((item) => String(item.id) === String(id));
    return row ? { status: "ready", data: row as T } : { status: "not-found", data: null };
  }
  return getJson<T>("/" + resource + "/" + encodeURIComponent(String(id)));
}

export async function getAllPages<T>(
  resource: string,
  size = 100,
): Promise<{ status: ApiStatus; items: T[] }> {
  if ((await getPortalSource()).kind === "reference") {
    return { status: "ready", items: [...(referenceCollections[resource] ?? [])].sort((a, b) => a.id - b.id) as T[] };
  }
  const first = await getManagedCollection<T>(resource, { page: 0, size });
  if (first.status !== "ready" || !first.data) {
    return { status: first.status, items: [] };
  }

  const items = [...first.data.content];
  const remainingPages = Array.from(
    { length: Math.max(0, first.data.totalPages - 1) },
    (_, index) => index + 1,
  );

  for (let index = 0; index < remainingPages.length; index += 4) {
    const pages = remainingPages.slice(index, index + 4);
    const results = await Promise.all(
      pages.map((page) => getManagedCollection<T>(resource, { page, size })),
    );
    if (results.some((result) => result.status !== "ready" || !result.data)) {
      return { status: "unavailable", items: [] };
    }
    for (const result of results) {
      if (result.data) {
        items.push(...result.data.content);
      }
    }
  }

  return { status: "ready", items };
}
