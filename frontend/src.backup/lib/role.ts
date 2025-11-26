import { UserRole } from '@/types/permissions';

// Daftar role valid sesuai enum UserRole
const VALID_ROLES: UserRole[] = [
  'Admin',
  'Kepala_Sekolah',
  'Guru',
  'Siswa',
  'Petugas_Keuangan',
  'Orang_Tua'
];

/**
 * Normalisasi string role ke format enum UserRole.
 * - Mengganti spasi/dash dengan underscore
 * - Mengkapitalisasi setiap bagian sesuai konvensi enum
 * - Mengembalikan role valid jika cocok, atau string yang dinormalisasi
 */
export function normalizeRoleFromString(input?: string | null): UserRole | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Jika sudah valid, langsung kembalikan
  if (VALID_ROLES.includes(trimmed as UserRole)) {
    return trimmed as UserRole;
  }

  // Unifikasi separator dan kapitalisasi
  const replaced = trimmed.replace(/[-\s]+/g, '_').replace(/_+/g, '_');
  const normalized = replaced
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('_') as UserRole;

  if (VALID_ROLES.includes(normalized)) {
    return normalized;
  }

  // Kembalikan bentuk dinormalisasi meskipun tidak termasuk VALID_ROLES
  return normalized;
}

export { VALID_ROLES };