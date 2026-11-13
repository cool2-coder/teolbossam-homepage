import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "./lib/token";
import { FAMILY_COOKIE, CODE_RE, parseFamily } from "./lib/family";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Opening a child's own link remembers that child on this phone, so the shared
  // class link (/my) opens straight to them next time.
  if (pathname.startsWith("/j/")) {
    const code = pathname.split("/")[2] ?? "";
    const res = NextResponse.next();
    if (CODE_RE.test(code)) {
      const codes = parseFamily(req.cookies.get(FAMILY_COOKIE)?.value);
      if (!codes.includes(code)) {
        res.cookies.set(FAMILY_COOKIE, [code, ...codes].slice(0, 6).join("."), {
          httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
          path: "/", maxAge: 60 * 60 * 24 * 365 * 5,
        });
      }
    }
    return res;
  }

  if (pathname === "/admin/login") return NextResponse.next();
  const ok = !!process.env.ADMIN_PASSWORD && req.cookies.get(ADMIN_COOKIE)?.value === (await adminToken());
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", req.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/j/:path*"] };
