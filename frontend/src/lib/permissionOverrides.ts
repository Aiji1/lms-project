import { api } from '@/lib/api';
import { RolePermissions, Permission, UserRole } from '@/types/permissions';

// Bentuk override yang datang dari backend merged endpoint: key -> Permission
export type OverrideMap = Record<string, Permission>;

// Daftar resource_key yang tidak boleh di-override (selalu gunakan base permissions)
const EXCLUDED_OVERRIDE_KEYS = new Set<string>([
  'settings.permissions',
]);

// Fetch merged overrides berdasarkan role dan optional user_id
export async function fetchMergedOverrides(params: { role: string; user_id?: string }): Promise<OverrideMap> {
  const res = await api.get('/v1/permission-overrides/merged', { params });
  return res.data as OverrideMap;
}

// Terapkan overrides ke RolePermissions default per resource/menu item
// Jika ada override untuk resource_key, override akan mengganti permission untuk semua role yang relevan
export function applyOverrides(
  basePermissions: RolePermissions,
  override?: Permission
): RolePermissions {
  if (!override) return basePermissions;
  const result: RolePermissions = { ...basePermissions };
  // Override untuk semua role yang ada di basePermissions
  for (const role of Object.keys(result)) {
    result[role as UserRole] = { ...override };
  }
  return result;
}

// Helper: merge permission per item berdasarkan prioritas override
export function mergeItemPermissions(
  itemPermissions: RolePermissions,
  overrideMap: OverrideMap,
  resourceKey: string
): RolePermissions {
  // Jangan terapkan override pada resource yang dikecualikan
  if (EXCLUDED_OVERRIDE_KEYS.has(resourceKey)) {
    return itemPermissions;
  }
  const override = overrideMap[resourceKey];
  if (!override) return itemPermissions;
  return applyOverrides(itemPermissions, override);
}