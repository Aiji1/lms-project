'use client';

import { Bell, Menu, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  userInfo?: {
    name: string;
    type: string;
    avatar?: string;
  };
}

export default function Header({ onToggleSidebar, userInfo }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [user, setUser] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resolvedClassId, setResolvedClassId] = useState<string | null>(null);
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const resp = await api.get('/v1/pengumuman');
        const data = Array.isArray(resp.data?.data) ? resp.data.data : [];
        setAnnouncements(data);
      } catch (apiErr) {
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('announcements') : null;
          const list = raw ? JSON.parse(raw) : [];
          setAnnouncements(Array.isArray(list) ? list : []);
        } catch (e) {
          setAnnouncements([]);
        }
      }
    };
    loadAnnouncements();
  }, [pathname]);

  useEffect(() => {
    const resolveClass = async () => {
      try {
        const u = user;
        if (!u) return;
        if (u.user_type === 'Siswa' || u.user_type === 'Orang_Tua') {
          const resp = await api.get('/v1/siswa');
          const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
          const found = list.find((s: any) => String(s.nis) === String(u.reference_id || u.nis));
          if (found && found.id_kelas) setResolvedClassId(String(found.id_kelas));
        }
      } catch (e) {
        // ignore
      }
    };
    resolveClass();
  }, [user]);

  const isTargetedForUser = (ann: any, u: any): boolean => {
    if (!u) return false;
    const t = ann.target_type || 'All';
    if (t === 'All') return true;
    if (t === 'Roles') {
      const roles = Array.isArray(ann.target_roles) ? ann.target_roles : [];
      return roles.includes(u.user_type);
    }
    if (t === 'User') {
      const ids = Array.isArray(ann.target_user_ids) ? ann.target_user_ids : [];
      const uid = String(u.username || u.id || u.reference_id || '');
      return uid && ids.includes(uid);
    }
    if (t === 'Kelas') {
      const classIds = (Array.isArray(ann.target_class_ids) ? ann.target_class_ids : [])
        .map((cid: any) => String(cid));
      if (!resolvedClassId) return false;
      return classIds.includes(String(resolvedClassId));
    }
    return false;
  };

  useEffect(() => {
    try {
      const u = user;
      const uid = String(u?.username || u?.id || u?.reference_id || '');
      const key = `announcement_reads:${uid}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const reads = raw ? JSON.parse(raw) : {};
      const targeted = announcements.filter(a => isTargetedForUser(a, u));
      const count = targeted.reduce((acc: number, a: any) => {
        const id = String(a.id_pengumuman || a.judul_pengumuman);
        return acc + (reads[id] ? 0 : 1);
      }, 0);
      setUnreadCount(count);
    } catch (e) {
      setUnreadCount(0);
    }
  }, [announcements, user, resolvedClassId, pathname]);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-gray-500">Notifikasi</div>
                <button 
                  onClick={() => { setShowNotifMenu(false); window.location.href = '/komunikasi/pengumuman/buat'; }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                >
                  + Buat Pengumuman
                </button>
                <Link href="/komunikasi/pengumuman" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowNotifMenu(false)}>
                  Pengumuman
                </Link>
                <Link href="/komunikasi/pengumuman" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowNotifMenu(false)}>
                  Lihat Semua Pengumuman
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