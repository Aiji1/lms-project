'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { createPermissionForRoles, mergePermissions, getUserPermission } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type Announcement = {
  id_pengumuman?: number;
  judul_pengumuman: string;
  isi_pengumuman: string;
  tanggal_posting?: string;
  status?: 'Draft' | 'Published' | 'Archived';
  target_type?: string;
  target_roles?: string[];
  target_class_ids?: (string | number)[];
  target_user_ids?: string[];
  pembuat?: string;
};

export default function PengumumanListPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ search?: string; status?: string }>({});
  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  // Permission: Semua bisa lihat, Admin & Guru bisa create
  const komunikasiPermissions = useMemo(() => (
    mergePermissions(
      createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah', 'Siswa', 'Orang_Tua', 'Petugas_Keuangan'], READ_ONLY_PERMISSIONS)
    )
  ), []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        const perms = getUserPermission(parsed.user_type as any, komunikasiPermissions);
        setPermissions(perms);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, [komunikasiPermissions]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/v1/pengumuman', { params: filters });
        const data = Array.isArray(resp.data?.data) ? resp.data.data : [];
        setRows(data);
        return;
      } catch (apiErr: any) {
        console.log('Pengumuman API not available, using mock list:', apiErr?.message);
      }

      const mock: Announcement[] = [
        { id_pengumuman: 1, judul_pengumuman: 'Pengumuman Ujian Mid Semester', isi_pengumuman: 'Ujian dimulai pekan depan. Persiapkan diri dengan baik.', tanggal_posting: '2024-10-03', status: 'Published', target_type: 'All', pembuat: 'Admin' },
        { id_pengumuman: 2, judul_pengumuman: 'Acara Maulid Nabi', isi_pengumuman: 'Seluruh siswa diwajibkan hadir pada acara Maulid Nabi.', tanggal_posting: '2024-10-01', status: 'Published', target_type: 'All', pembuat: 'Guru' }
      ];
      setRows(mock);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data pengumuman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  // Helper: Resolve kelas id untuk siswa (berdasarkan reference_id sebagai NIS)
  const [resolvedClassId, setResolvedClassId] = useState<string | null>(null);
  useEffect(() => {
    const resolveClass = async () => {
      try {
        const u = user;
        if (!u) return;
        if (u.user_type === 'Siswa' || u.user_type === 'Orang_Tua') {
          // coba ambil daftar siswa dan cocokkan NIS
          const resp = await api.get('/v1/siswa');
          const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
          const found = list.find((s: any) => String(s.nis) === String(u.reference_id || u.nis));
          if (found && found.id_kelas) setResolvedClassId(String(found.id_kelas));
        }
      } catch (e) {
        // ignore jika API tidak tersedia
      }
    };
    resolveClass();
  }, [user]);

  // Helper: cek apakah pengumuman ditujukan ke user
  const isTargetedForUser = (ann: Announcement, u: any): boolean => {
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
      return Boolean(uid) && ids.includes(uid);
    }
    if (t === 'Kelas') {
      const classIds = (Array.isArray(ann.target_class_ids) ? ann.target_class_ids : [])
        .map((cid: any) => String(cid));
      if (!resolvedClassId) return false;
      return classIds.includes(String(resolvedClassId));
    }
    return false;
  };

  // Fallback: gabungkan hasil API dan localStorage (announcements)
  useEffect(() => {
    try {
      const key = 'announcements';
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const localList: Announcement[] = raw ? JSON.parse(raw) : [];
      if (localList.length) {
        setRows(prev => {
          const existingIds = new Set(prev.map(p => p.id_pengumuman));
          const merged = [...localList.filter(l => !existingIds.has(l.id_pengumuman)), ...prev];
          return merged;
        });
      }
    } catch (e) {
      // ignore parse error
    }
  }, []);

  // Tandai sebagai terbaca ketika user membuka halaman ini
  useEffect(() => {
    try {
      const uid = String(user?.username || user?.id || user?.reference_id || 'anon');
      if (!uid) return;
      const targetedIds = rows.filter(r => isTargetedForUser(r, user)).map(r => String(r.id_pengumuman || r.judul_pengumuman));
      const key = `announcement_reads:${uid}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const reads = raw ? JSON.parse(raw) : {};
      let updated = { ...reads };
      targetedIds.forEach(id => { updated[id] = true; });
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  }, [rows, user, resolvedClassId]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Pengumuman</h1>
        {/* Actions: button + a + a */}
        <div className="flex items-center gap-2">
          {permissions.create && (
            <button onClick={() => window.location.href = '/komunikasi/pengumuman/buat'} className="px-4 py-2 bg-blue-600 text-white rounded-md">Buat Pengumuman</button>
          )}
          <a href="/komunikasi/pengumuman" className="px-3 py-2 text-blue-600 hover:underline">Lihat Semua</a>
          <a href="/dashboard" className="px-3 py-2 text-slate-600 hover:underline">Kembali ke Dashboard</a>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input name="search" placeholder="Cari judul..." className="border rounded-md px-3 py-2" onChange={handleFilterChange} />
          <select name="status" className="border rounded-md px-3 py-2" onChange={handleFilterChange}>
            <option value="">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <button onClick={fetchList} className="px-4 py-2 bg-slate-600 text-white rounded-md">Terapkan</button>
        </div>
      </div>

      {loading && <p>Memuat pengumuman...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.filter((item) => isTargetedForUser(item, user)).map((item) => (
            <div key={item.id_pengumuman || item.judul_pengumuman} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{item.judul_pengumuman}</h2>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{item.status || 'Draft'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{item.isi_pengumuman}</p>
              <div className="text-xs text-gray-500 mt-3 flex items-center gap-4">
                <span>Tanggal: {item.tanggal_posting || '-'}</span>
                <span>Target: {item.target_type || 'All'}</span>
                <span>Pembuat: {item.pembuat || '-'}</span>
              </div>
              <div className="mt-3">
                <Link href="/komunikasi/pengumuman" className="text-blue-600 hover:underline text-sm">Detail</Link>
              </div>
            </div>
          ))}
          {rows.filter((item) => isTargetedForUser(item, user)).length === 0 && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <p className="text-gray-600">Belum ada pengumuman untuk Anda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}