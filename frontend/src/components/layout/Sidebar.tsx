'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';

// Import permission system
import { MenuItem, UserRole } from '@/types/permissions';
import { canViewMenuItem, getUserPermission, getPermissionLabel } from '@/lib/permissions';
import { fetchMergedOverrides, mergeItemPermissions, OverrideMap } from '@/lib/permissionOverrides';
import { universalMenuConfig } from '@/config/menuConfig';

interface SidebarProps {
  userType: UserRole;
  isCollapsed?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ userType, isCollapsed = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [user, setUser] = useState<{ role?: string; name?: string; nama_lengkap?: string; username?: string } | null>(null);
  const [overrideMap, setOverrideMap] = useState<OverrideMap>({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Helper to load overrides
  const loadOverrides = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token found, skipping permission override load');
      return;
    }

    try {
      const role = userType;
      const userData = localStorage.getItem('user');
      let userId: string | undefined = undefined;
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          userId = parsed?.id || parsed?.user_id || undefined;
        } catch {}
      }
      
      console.log('🔍 Loading overrides for role:', role);
      
      const overrides = await fetchMergedOverrides({ role, user_id: userId });
      
      console.log('✅ Loaded permission overrides:', overrides);
      
      setOverrideMap(overrides);
    } catch (e) {
      console.error('❌ Failed to load permission overrides', e);
    }
  }, [userType]);

  useEffect(() => {
    if (user) {
      loadOverrides();
    }
  }, [user, loadOverrides]);

  useEffect(() => {
    const handler = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Permission overrides saved event received, reloading...');
      }
      loadOverrides();
    };
    window.addEventListener('permission-overrides-saved', handler);
    return () => window.removeEventListener('permission-overrides-saved', handler);
  }, [loadOverrides]);

  // Auto-expand menu yang mengandung active page
  useEffect(() => {
    universalMenuConfig.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))
        );
        if (hasActiveChild && !expandedItems.includes(item.label)) {
          setExpandedItems(prev => [...prev, item.label]);
        }
      }
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize visible menu items
  const visibleMenuItems = useMemo(() => {
    return universalMenuConfig.filter(item => {
      const effectivePermissions = item.resourceKey
        ? mergeItemPermissions(item.permissions, overrideMap, item.resourceKey)
        : item.permissions;

      const parentViewable = canViewMenuItem(userType, effectivePermissions);
      const hasChildren = !!(item.children && item.children.length > 0);

      if (!hasChildren) {
        return parentViewable;
      }

      const visibleChildren = item.children!.filter(child => {
        const childPerms = child.resourceKey
          ? mergeItemPermissions(child.permissions, overrideMap, child.resourceKey)
          : child.permissions;
        
        const userPerm = getUserPermission(userType, childPerms);
        return userPerm.view;
      });

      if (item.href) {
        return parentViewable;
      }

      return parentViewable || visibleChildren.length > 0;
    });
  }, [userType, overrideMap]);

  const toggleExpanded = useCallback((label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  }, []);

  // Close mobile sidebar when clicking menu item
  const handleMenuItemClick = () => {
    if (onCloseMobile && window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const effectivePermissions = item.resourceKey
      ? mergeItemPermissions(item.permissions, overrideMap, item.resourceKey)
      : item.permissions;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

    const visibleChildren = hasChildren
      ? item.children!.filter(child => {
          const childPerms = child.resourceKey
            ? mergeItemPermissions(child.permissions, overrideMap, child.resourceKey)
            : child.permissions;
          
          const userPerm = getUserPermission(userType, childPerms);
          return userPerm.view;
        })
      : [];

    const hasVisibleChildren = visibleChildren.length > 0;
    const parentViewable = canViewMenuItem(userType, effectivePermissions);

    if (!hasChildren && !parentViewable) {
      return null;
    }

    if (hasChildren && item.href && !parentViewable) {
      return null;
    }

    if (hasChildren && !item.href && !parentViewable && !hasVisibleChildren) {
      return null;
    }

    const userPermission = getUserPermission(userType, effectivePermissions);
    const permissionLabel = getPermissionLabel(userPermission);
    const shouldRenderLink = !!item.href && !hasVisibleChildren;

    return (
      <div key={item.label}>
        {shouldRenderLink ? (
          <Link
            href={item.href!}
            onClick={handleMenuItemClick}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            style={{ paddingLeft: `${12 + (level * 16)}px` }}
            title={isCollapsed ? `${item.label} - ${permissionLabel}` : item.description}
          >
            {item.icon}
            {!isCollapsed && (
              <div className="flex-1">
                <span className="font-medium">{item.label}</span>
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-slate-400 ml-2">({permissionLabel})</span>
                )}
              </div>
            )}
          </Link>
        ) : (
          <button
            onClick={() => hasVisibleChildren ? toggleExpanded(item.label) : undefined}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg mb-1 transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${!hasVisibleChildren ? 'cursor-default' : ''}`}
            style={{ paddingLeft: `${12 + (level * 16)}px` }}
            title={isCollapsed ? `${item.label} - ${permissionLabel}` : item.description}
            disabled={!hasVisibleChildren}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <span className="font-medium">{item.label}</span>
                  {process.env.NODE_ENV === 'development' && (
                    <span className="text-xs text-slate-400 ml-2">
                      ({permissionLabel})
                      {hasVisibleChildren && ` [${visibleChildren.length}]`}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!isCollapsed && hasVisibleChildren && (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>
        )}
        
        {hasVisibleChildren && isExpanded && !isCollapsed && (
          <div className="ml-0">
            {visibleChildren.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getUserTypeLabel = (userType: UserRole) => {
    const labels: Record<UserRole, string> = {
      'Admin': 'Administrator',
      'Kepala_Sekolah': 'Kepala Sekolah',
      'Guru': 'Guru',
      'Petugas_Keuangan': 'Petugas Keuangan',
      'Siswa': 'Siswa',
      'Orang_Tua': 'Orang Tua'
    };
    return labels[userType] || userType;
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col`}>
      {/* Logo - Fixed at top */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">LMS</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg truncate">SMA Al-Azhar 7</h1>
                <p className="text-xs text-slate-400 truncate">Learning Management System</p>
              </div>
            )}
          </div>
          
          {/* Close button - Only visible on mobile when sidebar is open */}
          {!isCollapsed && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0 ml-2"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Items - Scrollable area */}
      <nav className="mt-4 px-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {visibleMenuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* User Info - Fixed at bottom */}
      {!isCollapsed && (
        <div className="mt-auto p-4 flex-shrink-0 border-t border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">
                  {user?.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.nama_lengkap || user?.username || 'User Name'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {getUserTypeLabel(userType)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
