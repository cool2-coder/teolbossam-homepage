import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken } from "./token";

export { ADMIN_COOKIE, adminToken };

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!c && c === (await adminToken());
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
