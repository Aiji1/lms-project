import { 
  Permission, 
  RolePermissions, 
  UserRole,
  DEFAULT_PERMISSIONS,
  FULL_PERMISSIONS,
  READ_ONLY_PERMISSIONS,
  VIEW_EDIT_PERMISSIONS
} from '@/types/permissions';

/**
 * Check if user has specific permission for a resource
 */
export function hasPermission(
  userRole: UserRole, 
  permissions: RolePermissions, 
  action: keyof Permission
): boolean {
  const rolePermission = permissions[userRole];
  if (!rolePermission) return false;
  return rolePermission[action];
}

/**
 * Check if user can view a menu item
 */
export function canViewMenuItem(userRole: UserRole, permissions: RolePermissions): boolean {
  return hasPermission(userRole, permissions, 'view');
}

/**
 * Get user's permission level for a resource
 */
export function getUserPermission(userRole: UserRole, permissions: RolePermissions): Permission {
  return permissions[userRole] || DEFAULT_PERMISSIONS;
}

/**
 * Create permission configuration for specific roles
 */
export function createPermissionForRoles(rolesConfig: Record<UserRole, Permission> | UserRole[], permission?: Permission): RolePermissions {
  const permissions: RolePermissions = {};
  
  if (Array.isArray(rolesConfig) && permission) {
    // Legacy usage: array of roles with single permission
    rolesConfig.forEach(role => {
      permissions[role] = permission;
    });
  } else if (typeof rolesConfig === 'object' && !Array.isArray(rolesConfig)) {
    // New usage: object with role-permission mapping
    Object.entries(rolesConfig).forEach(([role, perm]) => {
      permissions[role as UserRole] = perm;
    });
  }
  
  return permissions;
}

/**
 * Merge multiple permission objects
 */
export function mergePermissions(...permissions: RolePermissions[]): RolePermissions {
  const merged: RolePermissions = {};
  
  permissions.forEach(permission => {
    Object.keys(permission).forEach(role => {
      merged[role] = permission[role];
    });
  });
  
  return merged;
}

/**
 * Get permission label for UI display
 */
export function getPermissionLabel(permission: Permission): string {
  if (permission.view && permission.create && permission.edit && permission.delete) {
    return 'Full Access';
  }
  if (permission.view && permission.create && permission.edit) {
    return 'Create & Edit';
  }
  if (permission.view && permission.edit) {
    return 'View & Edit';
  }
  if (permission.view && permission.create) {
    return 'View & Create';
  }
  if (permission.view) {
    return 'Read Only';
  }
  return 'No Access';
}

/**
 * Common permission presets for different menu types
 */
export const PERMISSION_PRESETS = {
  // Admin only menus
  ADMIN_ONLY: createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  
  // Admin and Kepala Sekolah management
  MANAGEMENT: mergePermissions(
    createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
    createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
  ),
  
  // Data master (Admin full, others read)
  DATA_MASTER: mergePermissions(
    createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
    createPermissionForRoles(['Kepala_Sekolah', 'Guru'], READ_ONLY_PERMISSIONS)
  ),
  
  // Learning management (Teachers can manage, students view)
  LEARNING: mergePermissions(
    createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
    createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
    createPermissionForRoles(['Siswa', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
  ),
  
  // Financial (Petugas Keuangan manages, others view)
  FINANCIAL: mergePermissions(
    createPermissionForRoles(['Admin', 'Petugas_Keuangan'], FULL_PERMISSIONS),
    createPermissionForRoles(['Siswa', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
  ),
  
  // Communication (Admin and teachers create, all view)
  COMMUNICATION: mergePermissions(
    createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
    createPermissionForRoles(['Siswa', 'Orang_Tua', 'Kepala_Sekolah', 'Petugas_Keuangan'], READ_ONLY_PERMISSIONS)
  ),
  
  // Reports (Management and teachers view)
  REPORTS: mergePermissions(
    createPermissionForRoles(['Admin', 'Kepala_Sekolah'], FULL_PERMISSIONS),
    createPermissionForRoles(['Guru'], READ_ONLY_PERMISSIONS)
  ),
  
  // Universal access (all roles can view)
  UNIVERSAL_VIEW: createPermissionForRoles(
    ['Admin', 'Kepala_Sekolah', 'Guru', 'Siswa', 'Petugas_Keuangan', 'Orang_Tua'], 
    READ_ONLY_PERMISSIONS
  )
};