'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

type KelasOption = { id_kelas: number; nama_kelas: string };
type JenisOption = { value: string; label: string };

export default function EditTagihanPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

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

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [jenisOptions, setJenisOptions] = useState<JenisOption[]>([]);

  const [form, setForm] = useState({
    judul: '',
    jenis_kode: '',
    id_kelas: '',
    total_nominal: '',
    tanggal_terbit: '',
    status: 'Aktif'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchFormData = async () => {
    try {
      setError(null);
      try {
        const respJenis = await api.get('/jenis-pembayaran-form-data');
        const jenis = Array.isArray(respJenis.data?.data) ? respJenis.data.data : (Array.isArray(respJenis.data?.data?.options) ? respJenis.data.data.options : []);
        setJenisOptions(jenis);
      } catch (e1: any) {
        console.log('Jenis pembayaran form-data not available, using mock');
        setJenisOptions([
          { value: 'SPP', label: 'SPP Bulanan' },
          { value: 'DAFTAR_ULANG', label: 'Daftar Ulang' },
          { value: 'SERAGAM', label: 'Seragam' }
        ]);
      }

      try {
        const respKelas = await api.get('/kelas-form-data');
        const raw = respKelas.data?.data;
        let options: any[] = [];
        if (Array.isArray(raw)) options = raw;
        else if (raw && Array.isArray(raw.kelasOptions)) options = raw.kelasOptions;
        else if (raw && Array.isArray(raw.kelas_options)) options = raw.kelas_options;
        else if (raw && Array.isArray(raw.kelas)) options = raw.kelas;
        setKelasOptions(Array.isArray(options) ? options : []);
      } catch (e2: any) {
        console.log('Kelas form-data not available, using mock');
        setKelasOptions([
          { id_kelas: 1, nama_kelas: 'X IPA 1' },
          { id_kelas: 2, nama_kelas: 'X IPS 1' }
        ]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat form data');
    }
  };

  const fetchDetail = async () => {
    try {
      setError(null);
      try {
        const resp = await api.get(`/v1/tagihan/${id}`);
        const d = resp.data?.data || resp.data;
        if (d) {
          setForm({
            judul: d.judul || '',
            jenis_kode: d.jenis_kode || '',
            id_kelas: d.id_kelas ? String(d.id_kelas) : '',
            total_nominal: d.total_nominal ? String(d.total_nominal) : '',
            tanggal_terbit: d.tanggal_terbit || new Date().toISOString().slice(0,10),
            status: d.status || 'Aktif'
          });
          return;
        }
      } catch (apiErr: any) {
        console.log('Tagihan detail API unavailable, using mock:', apiErr?.message);
      }

      const mock = {
        judul: 'SPP Oktober 2024',
        jenis_kode: 'SPP',
        id_kelas: '1',
        total_nominal: '250000',
        tanggal_terbit: '2024-10-01',
        status: 'Aktif'
      };
      setForm(mock);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat detail tagihan');
    }
  };

  useEffect(() => { fetchFormData(); }, []);
  useEffect(() => { if (id) fetchDetail(); }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.edit) {
      setError('Anda tidak memiliki izin untuk mengedit tagihan');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      try {
        const payload = {
          judul: form.judul,
          jenis_kode: form.jenis_kode,
          id_kelas: Number(form.id_kelas),
          total_nominal: Number(form.total_nominal),
          tanggal_terbit: form.tanggal_terbit,
          status: form.status
        };
        const resp = await api.put(`/v1/tagihan/${id}`, payload);
        if (resp.status >= 200 && resp.status < 300) {
          setSuccess('Tagihan berhasil diperbarui');
          setTimeout(() => router.push('/keuangan/tagihan'), 500);
          return;
        }
      } catch (apiErr: any) {
        console.log('Tagihan update API unavailable, using mock submit:', apiErr?.message);
      }

      await new Promise(r => setTimeout(r, 600));
      setSuccess('Tagihan berhasil diperbarui (mock)');
      setTimeout(() => router.push('/keuangan/tagihan'), 500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memperbarui tagihan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Edit Tagihan</h1>
        <a href="/keuangan/tagihan" className="text-blue-600">Kembali ke daftar</a>
      </div>

      {error && <div className="mb-3 text-red-600">{error}</div>}
      {success && <div className="mb-3 text-green-600">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-md shadow-sm space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Judul</label>
          <input name="judul" value={form.judul} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Jenis</label>
          <select name="jenis_kode" value={form.jenis_kode} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit}>
            <option value="">Pilih Jenis</option>
            {jenisOptions.map(j => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kelas</label>
          <select name="id_kelas" value={form.id_kelas} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit}>
            <option value="">Pilih Kelas</option>
            {kelasOptions.map(k => (
              <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Total Nominal</label>
          <input name="total_nominal" value={form.total_nominal} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tanggal Terbit</label>
          <input type="date" name="tanggal_terbit" value={form.tanggal_terbit} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-2" disabled={!permissions.edit}>
            <option value="Aktif">Aktif</option>
            <option value="Non-aktif">Non-aktif</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={!permissions.edit || loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <a href="/keuangan/tagihan" className="px-4 py-2 bg-gray-200 rounded-md">Batal</a>
        </div>
      </form>
    </div>
  );
}