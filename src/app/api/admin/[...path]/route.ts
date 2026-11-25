import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
const sessionCookie = "grid_manager_admin_session";
const resources = new Set([
  "categories",
  "pilots",
  "seasons",
  "races",
  "results",
  "licenses",
]);
const writeMethods = new Set(["POST", "PATCH", "DELETE"]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const [resource, id, nested] = path;
  const method = request.method.toUpperCase();

  if (
    !resource ||
    !resources.has(resource) ||
    path.length > 3 ||
    (id !== undefined && !/^\d+$/.test(id)) ||
    (nested !== undefined && !(resource === "categories" && nested === "scoring-profiles"))
  ) {
    return NextResponse.json({ message: "Recurso não disponível." }, { status: 404 });
  }

  if (!["GET", ...writeMethods].includes(method)) {
    return NextResponse.json({ message: "Método não permitido." }, { status: 405 });
  }

  if ((resource === "licenses" || nested === "scoring-profiles") && method !== "GET" && method !== "POST") {
    return NextResponse.json({ message: "Operação não disponível para este recurso." }, { status: 405 });
  }
  if (method === "POST" && id && !nested) {
    return NextResponse.json({ message: "Operação não disponível para este recurso." }, { status: 405 });
  }
  if (nested === "scoring-profiles" && (!id || method !== "POST")) {
    return NextResponse.json({ message: "Operação não disponível para este recurso." }, { status: 405 });
  }

  if (!apiBaseUrl) {
    return NextResponse.json({ message: "A API do Grid Manager não está configurada." }, { status: 503 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (writeMethods.has(method) && !token) {
    return NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const target = new URL(apiBaseUrl + "/api/v1/" + path.join("/"));
  for (const key of ["page", "size", "sort"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) target.searchParams.set(key, value);
  }

  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Authorization", "Bearer " + token);
  const body = method === "POST" || method === "PATCH" ? await request.text() : undefined;
  if (body !== undefined) headers.set("Content-Type", "application/json");

  try {
    const response = await fetch(target, {
      method,
      cache: "no-store",
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 204) return new NextResponse(null, { status: 204 });

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar à API do Grid Manager." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
