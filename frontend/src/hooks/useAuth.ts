'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/types/permissions';
import { normalizeRoleFromString } from '@/lib/role';

interface User {
  id: string;
  username: string;
  nama_lengkap: string;
  user_type: UserRole;
  reference_id: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface AuthState {
  user: User | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: null,
    isAuthenticated: false,
    isLoading: true,
    token: null
  });

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          const normalizedRole = normalizeRoleFromString(parsedUser?.user_type);
          const userWithNormalizedRole = {
            ...parsedUser,
            user_type: normalizedRole ?? parsedUser?.user_type
          } as User;

          // Simpan balik ke localStorage agar konsisten
          localStorage.setItem('user', JSON.stringify(userWithNormalizedRole));

          setAuthState({
            user: userWithNormalizedRole,
            userRole: (normalizedRole ?? parsedUser?.user_type) as UserRole,
            isAuthenticated: true,
            isLoading: false,
            token
          });
        } else {
          setAuthState({
            user: null,
            userRole: null,
            isAuthenticated: false,
            isLoading: false,
            token: null
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          userRole: null,
          isAuthenticated: false,
          isLoading: false,
          token: null
        });
      }
    };

    initializeAuth();

    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userData: User, token: string) => {
    const normalizedRole = normalizeRoleFromString(userData?.user_type);
    const normalizedUser: User = {
      ...userData,
      user_type: (normalizedRole ?? userData?.user_type) as UserRole
    };
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', token);
    
    setAuthState({
      user: normalizedUser,
      userRole: normalizedUser.user_type,
      isAuthenticated: true,
      isLoading: false,
      token
    });
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    setAuthState({
      user: null,
      userRole: null,
      isAuthenticated: false,
      isLoading: false,
      token: null
    });
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (authState.user) {
      const merged = { ...authState.user, ...updatedUser };
      const normalizedRole = normalizeRoleFromString(merged?.user_type as string);
      const newUser: User = {
        ...merged,
        user_type: (normalizedRole ?? merged?.user_type) as UserRole
      } as User;
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setAuthState(prev => ({
        ...prev,
        user: newUser,
        userRole: newUser.user_type
      }));
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.userRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return authState.userRole ? roles.includes(authState.userRole) : false;
  };

  const isAdmin = (): boolean => {
    return authState.userRole === 'Admin';
  };

  const isTeacher = (): boolean => {
    return authState.userRole === 'Guru';
  };

  const isStudent = (): boolean => {
    return authState.userRole === 'Siswa';
  };

  const isParent = (): boolean => {
    return authState.userRole === 'Orang_Tua';
  };

  const isHeadmaster = (): boolean => {
    return authState.userRole === 'Kepala_Sekolah';
  };

  const isFinanceStaff = (): boolean => {
    return authState.userRole === 'Petugas_Keuangan';
  };

  return {
    ...authState,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    isHeadmaster,
    isFinanceStaff
  };
}