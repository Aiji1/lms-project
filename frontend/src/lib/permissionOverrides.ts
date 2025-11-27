import { api } from '@/lib/api';
import { RolePermissions, Permission, UserRole } from '@/types/permissions';

// Bentuk override yang datang dari backend merged endpoint: key -> Permission
export type OverrideMap = Record<string, Permission>;

// Daftar resource_key yang tidak boleh di-override (selalu gunakan base permissions)
const EXCLUDED_OVERRIDE_KEYS = new Set<string>([
  'settings.permissions',
]);

// ============================================
// CACHING LAYER - In-Memory Cache
// ============================================
interface CacheEntry {
  data: OverrideMap;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit dalam milliseconds

function getCacheKey(params: { role: string; user_id?: string }): string {
  return `${params.role}_${params.user_id || 'no-user'}`;
}

function getCachedData(key: string): OverrideMap | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_DURATION) {
    // Cache expired
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCachedData(key: string, data: OverrideMap): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Clear cache - digunakan setelah update permission
export function clearPermissionCache(): void {
  cache.clear();
  console.log('[PermissionCache] Cache cleared');
}

// Clear cache untuk role tertentu
export function clearRoleCache(role: string): void {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.startsWith(role)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`[PermissionCache] Cleared cache for role: ${role}`);
}

// ============================================
// FETCH WITH CACHE
// ============================================

// Fetch merged overrides berdasarkan role dan optional user_id
export async function fetchMergedOverrides(params: { role: string; user_id?: string }): Promise<OverrideMap> {
  const cacheKey = getCacheKey(params);
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`[PermissionCache] Cache HIT for ${cacheKey}`);
    return cached;
  }
  
  console.log(`[PermissionCache] Cache MISS for ${cacheKey}, fetching...`);
  
  try {
    const res = await api.get('/permission-overrides/merged', { params });
    const data = res.data as OverrideMap;
    
    // Save to cache
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.warn('Failed to fetch permission overrides, using defaults:', error);
    return {}; // Return empty map as fallback
  }
}

// ============================================
// PERMISSION MERGE FUNCTIONS
// ============================================

// Terapkan overrides ke RolePermissions default per resource/menu item
export function applyOverrides(
  basePermissions: RolePermissions,
  override?: Permission
): RolePermissions {
  if (!override) return basePermissions;
  
  const allRoles: UserRole[] = ['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan', 'Siswa', 'Orang_Tua'];
  const result: RolePermissions = {};
  
  for (const role of allRoles) {
    result[role] = basePermissions[role] || { view: false, create: false, edit: false, delete: false };
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
