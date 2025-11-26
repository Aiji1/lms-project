'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { normalizeRoleFromString } from '@/lib/role';

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasRedirected = useRef(false); // ✅ Add guard to prevent multiple redirects

  useEffect(() => {
    // ✅ Guard: Prevent multiple executions
    if (hasRedirected.current) {
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      hasRedirected.current = true; // ✅ Mark as redirected
      router.push('/login');
      setIsLoading(false);
      return;
    }

    // Try to get user data from the new format first
    const userData = localStorage.getItem('user');
    let userType = '';
    let userName = '';

    if (userData) {
      try {
        // New format: JSON object with user details
        const parsedUser = JSON.parse(userData);
        const normalizedRole = normalizeRoleFromString(parsedUser?.user_type);
        userType = (normalizedRole ?? parsedUser.user_type) || '';
        userName = parsedUser.nama_lengkap || parsedUser.username || '';
        
        console.log('Layout User data from new format:', parsedUser);
        // Simpan balik jika terjadi normalisasi agar konsisten di seluruh aplikasi
        try {
          const newUserData = { ...parsedUser, user_type: userType };
          localStorage.setItem('user', JSON.stringify(newUserData));
        } catch {}
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Fallback to old format if parsing fails
        userType = localStorage.getItem('userType') || '';
        userName = localStorage.getItem('userName') || '';
      }
    } else {
      // Fallback to old format
      const legacyType = localStorage.getItem('userType') || '';
      const normalizedRole = normalizeRoleFromString(legacyType);
      userType = normalizedRole ?? legacyType;
      userName = localStorage.getItem('userName') || '';
    }

    if (!userType) {
      console.log('No user type found, redirecting to login');
      hasRedirected.current = true; // ✅ Mark as redirected
      router.push('/login');
      setIsLoading(false);
      return;
    }

    setUserInfo({
      name: userName || 'User',
      type: userType
    });
    setIsLoading(false);
  }, []); // ✅ Remove router from dependencies to prevent re-runs

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <DashboardLayout userType={userInfo.type} userInfo={userInfo}>
      {children}
    </DashboardLayout>
  );
}