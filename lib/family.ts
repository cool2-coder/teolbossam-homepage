/** Cookie that remembers which children's journals this phone has opened (their link codes). */
export const FAMILY_COOKIE = "teol_family";
export const CODE_RE = /^[A-Za-z0-9_-]{6,16}$/;

export function parseFamily(v: string | undefined): string[] {
  return (v ?? "").split(".").filter((c) => CODE_RE.test(c)).slice(0, 6);
}
