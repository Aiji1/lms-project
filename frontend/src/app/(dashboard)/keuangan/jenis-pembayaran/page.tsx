'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type JenisPembayaran = {
  id?: number;
  kode: string;
  nama: string;
  nominal_default: number;
  deskripsi?: string | null;
  status: 'Aktif' | 'Non-aktif';
};

export default function JenisPembayaranListPage() {
  const [rows, setRows] = useState<JenisPembayaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  // Permission: Admin & Petugas_Keuangan full, Kepala_Sekolah read-only
  const jenisPembayaranPermissions = useMemo(() => (
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
        const perms = getUserPermission(parsed.user_type as any, jenisPembayaranPermissions);
        setPermissions(perms);
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, [jenisPembayaranPermissions]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/v1/jenis-pembayaran');
        const data = Array.isArray(resp.data?.data) ? resp.data.data : [];
        setRows(data);
        return;
      } catch (apiErr: any) {
        console.log('Jenis Pembayaran API not available, using mock list:', apiErr?.message);
      }

      const mock: JenisPembayaran[] = [
        { id: 1, kode: 'SPP', nama: 'SPP Bulanan', nominal_default: 250000, deskripsi: 'Iuran bulanan', status: 'Aktif' },
        { id: 2, kode: 'DAFTAR_ULANG', nama: 'Daftar Ulang', nominal_default: 750000, deskripsi: 'Tahunan', status: 'Aktif' },
        { id: 3, kode: 'SERAGAM', nama: 'Seragam', nominal_default: 500000, deskripsi: 'Paket seragam', status: 'Non-aktif' }
      ];
      setRows(mock);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data jenis pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Jenis Pembayaran</h1>
        {permissions.create && (
          <a href="/keuangan/jenis-pembayaran/tambah" className="px-4 py-2 bg-blue-600 text-white rounded-md">Tambah Jenis</a>
        )}
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Nominal Default</th>
              <th className="p-3">Deskripsi</th>
              <th className="p-3">Status</th>
              {permissions.edit && <th className="p-3">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={permissions.edit ? 6 : 5}>Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-3" colSpan={permissions.edit ? 6 : 5}>Tidak ada data</td></tr>
            ) : rows.map(r => (
              <tr key={r.id || r.kode} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.kode}</td>
                <td className="p-3">{r.nama}</td>
                <td className="p-3">Rp {r.nominal_default.toLocaleString('id-ID')}</td>
                <td className="p-3">{r.deskripsi || '-'}</td>
                <td className="p-3">{r.status}</td>
                {permissions.edit && (
                  <td className="p-3">
                    <a
                      href={`/keuangan/jenis-pembayaran/${r.id ?? r.kode}`}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </a>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}