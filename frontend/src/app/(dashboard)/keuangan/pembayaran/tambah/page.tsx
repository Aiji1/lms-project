'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type JenisPembayaranOption = { id: number; kode: string; nama: string };
type TagihanOption = { id: number; kode_tagihan: string; nama: string };

export default function TambahPembayaranPage() {
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

  const [form, setForm] = useState({
    nis: '',
    nama: '',
    jenis_id: '',
    tagihan_id: '',
    nominal: '',
    tanggal_bayar: '',
    metode: 'Tunai',
  });

  const [jenisOptions, setJenisOptions] = useState<JenisPembayaranOption[]>([]);
  const [tagihanOptions, setTagihanOptions] = useState<TagihanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFormData = async () => {
    setError(null);
    try {
      // Jenis pembayaran
      try {
        const respJenis = await api.get('/jenis-pembayaran-form-data');
        const dataJenis = Array.isArray(respJenis.data?.data) ? respJenis.data.data : [];
        setJenisOptions(dataJenis);
      } catch (apiErr: any) {
        console.log('Jenis API not available, using mock:', apiErr?.message);
        setJenisOptions([
          { id: 1, kode: 'SPP', nama: 'SPP Bulanan' },
          { id: 2, kode: 'SERAGAM', nama: 'Seragam' },
        ]);
      }

      // Tagihan
      try {
        const respTagihan = await api.get('/tagihan-form-data');
        const dataTagihan = Array.isArray(respTagihan.data?.data) ? respTagihan.data.data : [];
        setTagihanOptions(dataTagihan);
      } catch (apiErr: any) {
        console.log('Tagihan API not available, using mock:', apiErr?.message);
        setTagihanOptions([
          { id: 1, kode_tagihan: 'TAG-2024-001', nama: 'SPP Oktober 2024' },
          { id: 2, kode_tagihan: 'TAG-2024-002', nama: 'Seragam 2024' },
        ]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat data formulir');
    }
  };

  useEffect(() => { fetchFormData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.create) {
      setError('Anda tidak memiliki izin untuk membuat pembayaran');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      try {
        const payload = {
          nis: form.nis,
          jenis_id: Number(form.jenis_id),
          tagihan_id: Number(form.tagihan_id),
          nominal: Number(form.nominal),
          tanggal_bayar: form.tanggal_bayar,
          metode: form.metode,
        };
        const resp = await api.post('/pembayaran', payload);
        if (resp.status >= 200 && resp.status < 300) {
          setSuccess('Pembayaran berhasil dibuat');
          setForm({ nis: '', nama: '', jenis_id: '', tagihan_id: '', nominal: '', tanggal_bayar: '', metode: 'Tunai' });
          return;
        }
      } catch (apiErr: any) {
        console.log('Pembayaran API not available, using mock submit:', apiErr?.message);
      }

      // Mock success
      await new Promise(r => setTimeout(r, 600));
      setSuccess('Pembayaran berhasil dibuat (mock)');
      setForm({ nis: '', nama: '', jenis_id: '', tagihan_id: '', nominal: '', tanggal_bayar: '', metode: 'Tunai' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal membuat pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tambah Pembayaran</h1>
        <a href="/keuangan/pembayaran" className="text-blue-600">Kembali ke daftar</a>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}
      {success && <div className="mb-3 text-green-600">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">NIS</label>
          <input type="text" name="nis" value={form.nis} onChange={handleChange} className="w-full border rounded px-2 py-2" placeholder="Masukkan NIS" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Nama Siswa</label>
          <input type="text" name="nama" value={form.nama} onChange={handleChange} className="w-full border rounded px-2 py-2" placeholder="Opsional" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Jenis Pembayaran</label>
          <select name="jenis_id" value={form.jenis_id} onChange={handleChange} className="w-full border rounded px-2 py-2" required>
            <option value="">Pilih jenis pembayaran</option>
            {jenisOptions.map(j => (
              <option key={j.id} value={j.id}>{j.kode} - {j.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Tagihan</label>
          <select name="tagihan_id" value={form.tagihan_id} onChange={handleChange} className="w-full border rounded px-2 py-2" required>
            <option value="">Pilih tagihan</option>
            {tagihanOptions.map(t => (
              <option key={t.id} value={t.id}>{t.kode_tagihan} - {t.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Nominal</label>
          <input type="number" name="nominal" value={form.nominal} onChange={handleChange} className="w-full border rounded px-2 py-2" placeholder="Masukkan nominal" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Tanggal Bayar</label>
          <input type="date" name="tanggal_bayar" value={form.tanggal_bayar} onChange={handleChange} className="w-full border rounded px-2 py-2" required />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Metode</label>
          <select name="metode" value={form.metode} onChange={handleChange} className="w-full border rounded px-2 py-2">
            <option value="Tunai">Tunai</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <button type="submit" disabled={loading || !permissions.create} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
            {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      </form>
    </div>
  );
}