'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type Pembayaran = {
  id?: number;
  kode_transaksi: string;
  nis: string;
  nama_siswa?: string;
  jenis_kode?: string;
  tagihan_kode?: string;
  nominal: number;
  tanggal_bayar: string;
  metode: 'Tunai' | 'Transfer';
  status: 'Berhasil' | 'Pending' | 'Gagal';
};

export default function PembayaranListPage() {
  const [rows, setRows] = useState<Pembayaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<{ search?: string; status?: string } >({});

  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  const pembayaranPermissions = useMemo(() => (
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
        const perms = getUserPermission(parsed.user_type as any, pembayaranPermissions);
        setPermissions(perms);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, [pembayaranPermissions]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/v1/pembayaran', { params: filters });
        const data = Array.isArray(resp.data?.data) ? resp.data.data : [];
        setRows(data);
        return;
      } catch (apiErr: any) {
        console.log('Pembayaran API not available, using mock list:', apiErr?.message);
      }

      const mock: Pembayaran[] = [
        { id: 1, kode_transaksi: 'PAY-2024-1001', nis: '2024001', nama_siswa: 'Ahmad', jenis_kode: 'SPP', tagihan_kode: 'TAG-2024-001', nominal: 250000, tanggal_bayar: '2024-10-02', metode: 'Transfer', status: 'Berhasil' },
        { id: 2, kode_transaksi: 'PAY-2024-1002', nis: '2024002', nama_siswa: 'Budi', jenis_kode: 'SERAGAM', tagihan_kode: 'TAG-2024-002', nominal: 500000, tanggal_bayar: '2024-09-16', metode: 'Tunai', status: 'Pending' }
      ];
      setRows(mock);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data pembayaran');
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
        <h1 className="text-2xl font-semibold">Pembayaran</h1>
        {permissions.create && (
          <a href="/keuangan/pembayaran/tambah" className="px-4 py-2 bg-blue-600 text-white rounded-md">Tambah Pembayaran</a>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-md shadow-sm mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Cari</label>
          <input type="text" name="search" value={filters.search || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2" placeholder="Kode transaksi / NIS" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select name="status" value={filters.status || ''} onChange={handleFilterChange} className="w-full border rounded px-2 py-2">
            <option value="">Semua</option>
            <option value="Berhasil">Berhasil</option>
            <option value="Pending">Pending</option>
            <option value="Gagal">Gagal</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Kode Transaksi</th>
              <th className="p-3">NIS</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Tagihan</th>
              <th className="p-3">Nominal</th>
              <th className="p-3">Tanggal Bayar</th>
              <th className="p-3">Metode</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={9}>Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={9}>Tidak ada data</td></tr>
            ) : rows.map(r => (
              <tr key={r.id || r.kode_transaksi} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.kode_transaksi}</td>
                <td className="p-3">{r.nis}</td>
                <td className="p-3">{r.nama_siswa || '-'}</td>
                <td className="p-3">{r.jenis_kode || '-'}</td>
                <td className="p-3">{r.tagihan_kode || '-'}</td>
                <td className="p-3">Rp {r.nominal.toLocaleString('id-ID')}</td>
                <td className="p-3">{r.tanggal_bayar}</td>
                <td className="p-3">{r.metode}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}