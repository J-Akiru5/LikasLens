export const ALLOWED_ROLES = ["analyst", "super_admin"];

export function isAnalystOrSuperAdmin(role: string | null | undefined): boolean {
  return !!role && ALLOWED_ROLES.includes(role);
}

export function getRole(userMetadata: Record<string, unknown> | null | undefined): string | null {
  return (userMetadata?.role as string) ?? null;
}
