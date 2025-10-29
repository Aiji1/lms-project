'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type Tagihan = {
  id?: number;
  kode: string;
  judul: string;
  jenis_kode?: string;
  kelas?: string;
  total_nominal: number;
  tanggal_terbit: string;
  status: 'Aktif' | 'Non-aktif';
};

export default function TagihanListPage() {
  const [rows, setRows] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{ search?: string; status?: string } >({});

  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  const tagihanPermissions = useMemo(() => (
    mergePermissions(
      createPermissionForRoles(['Admin', 'Petugas_Keuangan'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
    )
  ), []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        const perms = getUserPermission(parsed.user_type as any, tagihanPermissions);
        setPermissions(perms);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, [tagihanPermissions]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/v1/tagihan', { params: filters });
        const data = Array.isArray(resp.data?.data) ? resp.data.data : [];
        setRows(data);
        return;
      } catch (apiErr: any) {
        console.log('Tagihan API not available, using mock list:', apiErr?.message);
      }

      const mock: Tagihan[] = [
        { id: 1, kode: 'TAG-2024-001', judul: 'SPP Oktober 2024', jenis_kode: 'SPP', kelas: 'X IPA 1', total_nominal: 250000, tanggal_terbit: '2024-10-01', status: 'Aktif' },
        { id: 2, kode: 'TAG-2024-002', judul: 'Seragam Putih', jenis_kode: 'SERAGAM', kelas: 'X IPS 1', total_nominal: 500000, tanggal_terbit: '2024-09-15', status: 'Non-aktif' }
      ];
      setRows(mock);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tagihan</h1>
        {permissions.create && (
          <a href="/keuangan/tagihan/tambah" className="px-4 py-2 bg-blue-600 text-white rounded-md">Buat Tagihan</a>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-md shadow-sm mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cari</label>
          <input type="text" name="search" value={filters.search || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2" placeholder="Judul atau kode" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select name="status" value={filters.status || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2">
            <option value="">Semua</option>
            <option value="Aktif">Aktif</option>
            <option value="Non-aktif">Non-aktif</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Kode</th>
              <th className="p-3">Judul</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Kelas</th>
              <th className="p-3">Total Nominal</th>
              <th className="p-3">Tanggal Terbit</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={8}>Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={8}>Tidak ada data</td></tr>
            ) : rows.map(r => (
              <tr key={r.id || r.kode} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.kode}</td>
                <td className="p-3">{r.judul}</td>
                <td className="p-3">{r.jenis_kode || '-'}</td>
                <td className="p-3">{r.kelas || '-'}</td>
                <td className="p-3">Rp {r.total_nominal.toLocaleString('id-ID')}</td>
                <td className="p-3">{r.tanggal_terbit}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {permissions.edit ? (
                    <a
                      className="text-blue-600 hover:underline"
                      href={`/keuangan/tagihan/${r.id ?? r.kode}`}
                    >
                      Edit
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}