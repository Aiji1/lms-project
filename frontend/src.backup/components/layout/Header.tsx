'use client';

import { Bell, Menu, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pengumumanApi, type Pengumuman } from '@/lib/api-pengumuman';

interface HeaderProps {
  onToggleSidebar: () => void;
  userInfo?: {
    name: string;
    type: string;
    avatar?: string;
  };
}

export default function Header({ onToggleSidebar, userInfo }: HeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentPengumuman, setRecentPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Load user data
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        fetchNotifications(parsed);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }, []);

  // Fetch notifications and unread count
  const fetchNotifications = async (userData: any) => {
    if (!userData) return;

    try {
      setLoading(true);

      // Determine user identifier and details
      const userIdentifier = userData.username || userData.nis || userData.reference_id || userData.user_id;
      let userKelas = undefined;
      let userTingkat = undefined;

      // Get kelas and tingkat for Siswa
      if (userData.user_type === 'Siswa' && userData.id_kelas) {
        userKelas = userData.id_kelas;
        const kelasName = userData.nama_kelas || '';
        if (kelasName.startsWith('X')) userTingkat = '10';
        else if (kelasName.startsWith('XI')) userTingkat = '11';
        else if (kelasName.startsWith('XII')) userTingkat = '12';
      }

      // Fetch unread count
      const countResponse = await pengumumanApi.getUnreadCount({
        user_identifier: userIdentifier,
        user_type: userData.user_type,
        user_kelas: userKelas,
        user_tingkat: userTingkat,
      });

      if (countResponse.success) {
        setUnreadCount(countResponse.data.unread);
      }

      // Fetch recent pengumuman (top 5)
      const listResponse = await pengumumanApi.getAll({
        for_user: userIdentifier,
        user_type: userData.user_type,
        user_kelas: userKelas,
        user_tingkat: userTingkat,
        aktif_only: true,
        per_page: 5,
      });

      if (listResponse.success) {
        setRecentPengumuman(listResponse.data || []);
      }

    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications(user);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Get badge color based on priority
  const getPriorityColor = (prioritas: string) => {
    switch (prioritas) {
      case 'Sangat Penting':
        return 'bg-red-100 text-red-800';
      case 'Penting':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get badge color based on category
  const getKategoriColor = (kategori: string) => {
    switch (kategori) {
      case 'Akademik':
        return 'bg-green-100 text-green-800';
      case 'Kegiatan':
        return 'bg-purple-100 text-purple-800';
      case 'Keuangan':
        return 'bg-yellow-100 text-yellow-800';
      case 'Keagamaan':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Handle pengumuman click
  const handlePengumumanClick = async (pengumuman: Pengumuman) => {
    // Mark as read
    if (!pengumuman.is_read && user) {
      try {
        const userIdentifier = user.username || user.nis || user.reference_id || user.user_id;
        await pengumumanApi.markAsRead(pengumuman.id_pengumuman, userIdentifier, user.user_type);
        
        // Refresh notifications
        fetchNotifications(user);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Close menu and navigate
    setShowNotifMenu(false);
    router.push(`/komunikasi/pengumuman?id=${pengumuman.id_pengumuman}`);
  };

  // Check if user can create pengumuman
  const canCreatePengumuman = ['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan'].includes(user?.user_type || '');

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Pengumuman"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {loading && (
              <span className="absolute -top-1 -right-1">
                <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Pengumuman</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-gray-500">{unreadCount} belum dibaca</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {canCreatePengumuman && (
                <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                  <button 
                    onClick={() => { 
                      setShowNotifMenu(false); 
                      router.push('/komunikasi/pengumuman?action=create'); 
                    }}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Buat Pengumuman Baru
                  </button>
                </div>
              )}

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {recentPengumuman.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Bell size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Tidak ada pengumuman</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentPengumuman.map((pengumuman) => (
                      <button
                        key={pengumuman.id_pengumuman}
                        onClick={() => handlePengumumanClick(pengumuman)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          !pengumuman.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getKategoriColor(pengumuman.kategori)}`}>
                            {pengumuman.kategori}
                          </span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(pengumuman.prioritas)}`}>
                            {pengumuman.prioritas}
                          </span>
                          {pengumuman.is_pinned && (
                            <span className="inline-block text-yellow-500">📌</span>
                          )}
                          {!pengumuman.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                          {pengumuman.judul}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                          {pengumuman.konten}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(pengumuman.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <Link 
                  href="/komunikasi/pengumuman" 
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setShowNotifMenu(false)}
                >
                  Lihat Semua Pengumuman →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              {userInfo?.avatar ? (
                <img 
                  src={userInfo.avatar} 
                  alt={userInfo.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {userInfo?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                {userInfo?.name || 'User Name'}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[120px]">
                {userInfo?.type || 'User Type'}
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User size={16} className="mr-3" />
                  Profile
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {(showProfileMenu || showNotifMenu) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => { setShowProfileMenu(false); setShowNotifMenu(false); }}
        />
      )}
    </header>
  );
}