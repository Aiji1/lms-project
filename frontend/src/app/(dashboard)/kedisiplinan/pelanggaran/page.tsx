'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { VIEW_EDIT_PERMISSIONS, FULL_PERMISSIONS } from '@/types/permissions';

type KelasOption = { id_kelas: number; nama_kelas: string };
type Option = { value: string; label: string };

type PelanggaranRow = {
  id_pelanggaran: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  tanggal_pelanggaran: string;
  jenis_pelanggaran: string;
  deskripsi_custom?: string | null;
  deskripsi_pelanggaran: string;
  poin_pelanggaran: number;
  status: 'Active' | 'Resolved';
};

export default function PelanggaranListPage() {
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [jenisOptions, setJenisOptions] = useState<Option[]>([]);
  const [statusOptions, setStatusOptions] = useState<Option[]>([]);

  const [filters, setFilters] = useState<{ kelas?: string; jenis_pelanggaran?: string; status?: string; tanggal_from?: string; tanggal_to?: string; search?: string }>({});
  const [rows, setRows] = useState<PelanggaranRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  // Permission configuration: Admin full, Guru can view & edit
  const pelanggaranPermissions = useMemo(() => (
    mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS)
    )
  ), []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        const perms = getUserPermission(parsed.user_type as any, pelanggaranPermissions);
        setPermissions(perms);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, []);

  const fetchFormData = async () => {
    try {
      setError(null);
      const resp = await api.get('/v1/pelanggaran-form-data');
      const data = resp.data?.data || {};

      const kelas = Array.isArray(data.kelas) ? data.kelas : (Array.isArray(data.kelas_options) ? data.kelas_options : []);
      setKelasOptions(kelas);
      setJenisOptions(Array.isArray(data.jenis_pelanggaran_options) ? data.jenis_pelanggaran_options : []);
      setStatusOptions(Array.isArray(data.status_options) ? data.status_options : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat form data');
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filters.kelas) params.kelas = filters.kelas;
      if (filters.jenis_pelanggaran) params.jenis_pelanggaran = filters.jenis_pelanggaran;
      if (filters.status) params.status = filters.status;
      if (filters.tanggal_from) params.tanggal_from = filters.tanggal_from;
      if (filters.tanggal_to) params.tanggal_to = filters.tanggal_to;
      if (filters.search) params.search = filters.search;

      const resp = await api.get('/v1/pelanggaran', { params });
      setRows(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data pelanggaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const refresh = () => fetchList();

  useEffect(() => {
    // initial list
    fetchList();
  }, []);

  const canEditStatus = permissions.edit;

  const handleInlineStatusChange = async (rowId: number, newStatus: 'Active' | 'Resolved') => {
    if (!canEditStatus) return;
    try {
      await api.put(`/v1/pelanggaran/${rowId}`, { status: newStatus });
      setRows(prev => prev.map(r => r.id_pelanggaran === rowId ? { ...r, status: newStatus } : r));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengupdate status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Daftar Pelanggaran</h1>
        <a href="/kedisiplinan/pelanggaran/input" className="px-4 py-2 bg-blue-600 text-white rounded-md">Input Pelanggaran</a>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-white p-4 rounded-md shadow-sm mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kelas</label>
          <select name="kelas" value={filters.kelas || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2">
            <option value="">Semua Kelas</option>
            {kelasOptions.map(k => (
              <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Jenis</label>
          <select name="jenis_pelanggaran" value={filters.jenis_pelanggaran || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2">
            <option value="">Semua Jenis</option>
            {jenisOptions.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select name="status" value={filters.status || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2">
            <option value="">Semua Status</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Dari Tanggal</label>
          <input type="date" name="tanggal_from" value={filters.tanggal_from || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sampai Tanggal</label>
          <input type="date" name="tanggal_to" value={filters.tanggal_to || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cari</label>
          <input type="text" name="search" value={filters.search || ''} onChange={handleFilterChange} placeholder="Nama atau NIS" className="w-full border rounded px-2 py-2" />
        </div>
        <div className="md:col-span-6 flex justify-end">
          <button onClick={refresh} className="px-4 py-2 bg-slate-800 text-white rounded-md">Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2 text-sm text-gray-600">Tanggal</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">NIS</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Nama</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Kelas</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Jenis</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Deskripsi</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Poin</th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center">Tidak ada data</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.id_pelanggaran} className="border-t">
                  <td className="px-4 py-2 text-sm">{row.tanggal_pelanggaran}</td>
                  <td className="px-4 py-2 text-sm">{row.nis}</td>
                  <td className="px-4 py-2 text-sm">{row.nama_siswa}</td>
                  <td className="px-4 py-2 text-sm">{row.nama_kelas}</td>
                  <td className="px-4 py-2 text-sm">{row.jenis_pelanggaran.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2 text-sm">{row.deskripsi_custom || row.deskripsi_pelanggaran}</td>
                  <td className="px-4 py-2 text-sm">{row.poin_pelanggaran}</td>
                  <td className="px-4 py-2 text-sm">
                    {canEditStatus ? (
                      <select
                        value={row.status}
                        onChange={(e) => handleInlineStatusChange(row.id_pelanggaran, e.target.value as any)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="Active">Active</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs ${row.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.status}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>
      )}
    </div>
  );
}