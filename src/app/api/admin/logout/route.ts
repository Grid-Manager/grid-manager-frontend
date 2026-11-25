import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("grid_manager_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
