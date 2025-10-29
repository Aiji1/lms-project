'use client';

import { ReactNode } from 'react';
import { UserRole, Permission, RolePermissions } from '@/types/permissions';
import { hasPermission, getUserPermission } from '@/lib/permissions';

interface PermissionGuardProps {
  userRole: UserRole;
  permissions: RolePermissions;
  action: keyof Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * PermissionGuard Component
 * 
 * Melindungi akses ke komponen berdasarkan permission user
 * 
 * @param userRole - Role user saat ini
 * @param permissions - Konfigurasi permission untuk resource
 * @param action - Aksi yang ingin dicheck (view, create, edit, delete)
 * @param children - Komponen yang akan ditampilkan jika user memiliki permission
 * @param fallback - Komponen alternatif jika user tidak memiliki permission
 * @param showFallback - Apakah menampilkan fallback atau hide komponen
 */
export function PermissionGuard({
  userRole,
  permissions,
  action,
  children,
  fallback = null,
  showFallback = false
}: PermissionGuardProps) {
  const hasAccess = hasPermission(userRole, permissions, action);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
}

interface PermissionButtonProps {
  userRole: UserRole;
  permissions: RolePermissions;
  action: keyof Permission;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}

/**
 * PermissionButton Component
 * 
 * Button yang otomatis disabled berdasarkan permission user
 */
export function PermissionButton({
  userRole,
  permissions,
  action,
  children,
  className = '',
  onClick,
  disabled = false,
  title,
  ...props
}: PermissionButtonProps) {
  const hasAccess = hasPermission(userRole, permissions, action);
  
  const isDisabled = disabled || !hasAccess;
  
  const buttonTitle = title || (
    !hasAccess 
      ? `Akses ${action} tidak diizinkan untuk role ${userRole}` 
      : `${action} - ${userRole}`
  );

  return (
    <button
      className={`${className} ${
        isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:opacity-80'
      }`}
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      title={buttonTitle}
      {...props}
    >
      {children}
    </button>
  );
}

interface PermissionLinkProps {
  userRole: UserRole;
  permissions: RolePermissions;
  action: keyof Permission;
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * PermissionLink Component
 * 
 * Link yang hanya dapat diakses berdasarkan permission user
 */
export function PermissionLink({
  userRole,
  permissions,
  action,
  href,
  children,
  className = ''
}: PermissionLinkProps) {
  const hasAccess = hasPermission(userRole, permissions, action);

  if (!hasAccess) {
    return (
      <span 
        className={`${className} opacity-50 cursor-not-allowed`}
        title={`Akses ${action} tidak diizinkan untuk role ${userRole}`}
      >
        {children}
      </span>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

interface ConditionalRenderProps {
  userRole: UserRole;
  permissions: RolePermissions;
  requiredActions: (keyof Permission)[];
  mode?: 'all' | 'any'; // all = butuh semua permission, any = butuh salah satu
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ConditionalRender Component
 * 
 * Render komponen berdasarkan multiple permission requirements
 */
export function ConditionalRender({
  userRole,
  permissions,
  requiredActions,
  mode = 'any',
  children,
  fallback = null
}: ConditionalRenderProps) {
  const checkPermissions = () => {
    if (mode === 'all') {
      return requiredActions.every(action => 
        hasPermission(userRole, permissions, action)
      );
    } else {
      return requiredActions.some(action => 
        hasPermission(userRole, permissions, action)
      );
    }
  };

  const hasAccess = checkPermissions();

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Hook untuk menggunakan permission dalam komponen
export function usePermissions(userRole: UserRole, permissions: RolePermissions) {
  return {
    canView: hasPermission(userRole, permissions, 'view'),
    canCreate: hasPermission(userRole, permissions, 'create'),
    canEdit: hasPermission(userRole, permissions, 'edit'),
    canDelete: hasPermission(userRole, permissions, 'delete'),
    getUserPermission: () => getUserPermission(userRole, permissions),
    hasPermission: (action: keyof Permission) => hasPermission(userRole, permissions, action)
  };
}