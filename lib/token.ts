export const ADMIN_COOKIE = "teol_admin";

/** Edge-safe: the cookie value an admin gets after entering ADMIN_PASSWORD. */
export async function adminToken(): Promise<string> {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`teolbossam:${pw}`));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
