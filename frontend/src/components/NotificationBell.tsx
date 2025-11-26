'use client';

import { useEffect, useState } from 'react';
import { pengumumanApi, type Pengumuman } from '@/lib/api-pengumuman';

interface NotificationBellProps {
  onOpenPengumuman: () => void;
}

export default function NotificationBell({ onOpenPengumuman }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchUnreadCount(parsed);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, []);

  const fetchUnreadCount = async (userData: any) => {
    if (!userData) return;

    try {
      setLoading(true);
      
      // Determine user identifier
      const userIdentifier = userData.username || userData.nis || userData.reference_id || userData.user_id;
      
      // Get user kelas and tingkat if Siswa
      let userKelas = undefined;
      let userTingkat = undefined;
      
      if (userData.user_type === 'Siswa' && userData.id_kelas) {
        userKelas = userData.id_kelas;
        // Extract tingkat from nama_kelas or use a separate field
        const kelasName = userData.nama_kelas || '';
        if (kelasName.startsWith('X')) userTingkat = '10';
        else if (kelasName.startsWith('XI')) userTingkat = '11';
        else if (kelasName.startsWith('XII')) userTingkat = '12';
      }

      const response = await pengumumanApi.getUnreadCount({
        user_identifier: userIdentifier,
        user_type: userData.user_type,
        user_kelas: userKelas,
        user_tingkat: userTingkat,
      });

      if (response.success) {
        setUnreadCount(response.data.unread);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount(user);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  return (
    <button
      onClick={onOpenPengumuman}
      className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title="Pengumuman"
    >
      {/* Bell Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge for unread count */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Loading indicator */}
      {loading && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center p-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2">
          <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
    </button>
  );
}