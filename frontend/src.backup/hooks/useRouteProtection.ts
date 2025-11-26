import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from './usePermission';

interface RouteProtectionOptions {
  resourceKey: string;
  requireCreate?: boolean;
  requireEdit?: boolean;
  requireDelete?: boolean;
  redirectTo?: string;
}

export function useRouteProtection(options: RouteProtectionOptions) {
  const router = useRouter();
  const { permission, loading } = usePermission(options.resourceKey);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    let authorized = permission.view;

    if (options.requireCreate && !permission.create) {
      authorized = false;
    }

    if (options.requireEdit && !permission.edit) {
      authorized = false;
    }

    if (options.requireDelete && !permission.delete) {
      authorized = false;
    }

    setIsAuthorized(authorized);

    if (!authorized) {
      const redirectPath = options.redirectTo || '/dashboard';
      console.warn(`Access denied to ${options.resourceKey}. Redirecting to ${redirectPath}`);
      router.push(redirectPath);
    }
  }, [loading, permission, options, router]);

  return {
    isAuthorized,
    loading,
    permission,
  };
}