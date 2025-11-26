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
  try {
    const res = await api.get('/permission-overrides/merged', { params });
    return res.data as OverrideMap;
  } catch (error) {
    console.warn('Failed to fetch permission overrides, using defaults:', error);
    return {}; // Return empty map as fallback
  }
}

// Terapkan overrides ke RolePermissions default per resource/menu item
// Jika ada override untuk resource_key, override akan mengganti permission untuk semua role yang relevan
export function applyOverrides(
  basePermissions: RolePermissions,
  override?: Permission
): RolePermissions {
  if (!override) return basePermissions;
  
  // ✅ FIX: Apply override to ALL possible roles, not just existing ones
  const allRoles: UserRole[] = ['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan', 'Siswa', 'Orang_Tua'];
  const result: RolePermissions = {};
  
  for (const role of allRoles) {
    // If role exists in basePermissions, keep it (will be overridden below)
    // If not, create it with the override
    result[role] = basePermissions[role] || { view: false, create: false, edit: false, delete: false };
    
    // Apply override to this role
    result[role] = { ...override };
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
  if (!override) {
    return itemPermissions;
  }

  return applyOverrides(itemPermissions, override);
}