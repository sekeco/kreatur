/**
 * Normalize Better Auth role name to internal role.
 * Better Auth uses "member" for contributor role.
 */
export function normalizeRole(raw: string): string {
  const r = raw.toLowerCase()
  return r === "member" ? "contributor" : r
}
