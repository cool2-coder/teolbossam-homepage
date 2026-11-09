import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "./lib/token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const ok = !!process.env.ADMIN_PASSWORD && req.cookies.get(ADMIN_COOKIE)?.value === (await adminToken());
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
