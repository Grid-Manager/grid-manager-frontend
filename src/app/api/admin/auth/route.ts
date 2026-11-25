import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
const sessionCookie = "grid_manager_admin_session";

export async function POST(request: NextRequest) {
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "A API do Grid Manager não está configurada." },
      { status: 503 },
    );
  }

  let credentials: { email?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ message: "Informe e-mail e senha." }, { status: 400 });
  }

  if (
    typeof credentials.email !== "string" ||
    typeof credentials.password !== "string" ||
    !credentials.email.trim() ||
    !credentials.password
  ) {
    return NextResponse.json({ message: "Informe e-mail e senha." }, { status: 400 });
  }

  try {
    const response = await fetch(apiBaseUrl + "/api/v1/auth/login", {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const status = response.status === 401 ? 401 : response.status;
      return NextResponse.json(
        {
          message:
            status === 401
              ? "Não foi possível autenticar. Confira as credenciais da conta administrativa."
              : "O serviço de autenticação não respondeu como esperado.",
        },
        { status },
      );
    }

    const auth = (await response.json()) as {
      accessToken?: unknown;
      tokenType?: unknown;
      expiresInSeconds?: unknown;
    };
    if (
      typeof auth.accessToken !== "string" ||
      typeof auth.expiresInSeconds !== "number" ||
      auth.expiresInSeconds < 1
    ) {
      return NextResponse.json(
        { message: "A resposta de autenticação está incompleta." },
        { status: 502 },
      );
    }

    const result = NextResponse.json({ authenticated: true });
    result.cookies.set(sessionCookie, auth.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.min(auth.expiresInSeconds, 60 * 60 * 24),
    });
    return result;
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao serviço de autenticação." },
      { status: 502 },
    );
  }
}
