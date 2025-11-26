'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getUserPermission, createPermissionForRoles, mergePermissions } from '@/lib/permissions';
import { VIEW_EDIT_PERMISSIONS, FULL_PERMISSIONS } from '@/types/permissions';

type KelasOption = { id_kelas: number; nama_kelas: string };
type Option = { value: string; label: string };
type SiswaOption = { nis: string; nama_lengkap: string };

type PelanggaranRow = {
  id_pelanggaran: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  tanggal_pelanggaran: string;
  jenis_pelanggaran: string;
  deskripsi_pelanggaran: string;
  poin_pelanggaran: number;
  status: 'Active' | 'Resolved';
};

export default function PelanggaranListPage() {
  const todayLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [jenisOptions, setJenisOptions] = useState<Option[]>([]);
  const [statusOptions, setStatusOptions] = useState<Option[]>([]);

  const [filters, setFilters] = useState<{ kelas?: string; jenis_pelanggaran?: string; status?: string; tanggal_from?: string; tanggal_to?: string; search?: string }>({});
  const [rows, setRows] = useState<PelanggaranRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInputModal, setShowInputModal] = useState(false);
  // State untuk form input (modal)
  const [inputLoading, setInputLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [inputSuccess, setInputSuccess] = useState<string | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [siswaOptions, setSiswaOptions] = useState<SiswaOption[]>([]);
  const [form, setForm] = useState({
    nis: '',
    tanggal_pelanggaran: todayLocal(),
    jenis_pelanggaran: '',
    deskripsi_pelanggaran: '',
    poin_pelanggaran: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      const resp = await api.get('/pelanggaran-form-data');
      const data = resp.data?.data || {};

      const kelas = Array.isArray(data.kelas) ? data.kelas : (Array.isArray(data.kelas_options) ? data.kelas_options : []);
      setKelasOptions(kelas);
      const baseJenis = Array.isArray(data.jenis_pelanggaran_options) ? data.jenis_pelanggaran_options : [];
      setJenisOptions(baseJenis);
      setStatusOptions(Array.isArray(data.status_options) ? data.status_options : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat form data');
    }
  };

  const fetchSiswaByKelas = async (kelasId: string) => {
    if (!kelasId) { setSiswaOptions([]); return; }
    try {
      setInputError(null);
      const resp = await api.get(`/v1/tugas/siswa/${kelasId}`);
      const siswa = Array.isArray(resp.data?.data) ? resp.data.data : [];
      setSiswaOptions(siswa);
    } catch (err: any) {
      try {
        const resp2 = await api.get('/siswa');
        const list = Array.isArray(resp2.data?.data) ? resp2.data.data : [];
        const filtered = list.filter((s: any) => String(s.id_kelas) === String(kelasId))
          .map((s: any) => ({ nis: s.nis, nama_lengkap: s.nama_lengkap }));
        setSiswaOptions(filtered);
      } catch (e2: any) {
        setInputError(err?.response?.data?.message || 'Gagal memuat siswa');
      }
    }
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (filters.kelas) params.kelas = filters.kelas;
      if (filters.jenis_pelanggaran) {
        params.jenis_pelanggaran = filters.jenis_pelanggaran;
      }
      if (filters.status) params.status = filters.status;
      if (filters.tanggal_from) params.tanggal_from = filters.tanggal_from;
      if (filters.tanggal_to) params.tanggal_to = filters.tanggal_to;
      if (filters.search) params.search = filters.search;

      const resp = await api.get('/pelanggaran', { params });
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

  // ===== Modal Input helpers =====
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'jenis_pelanggaran') {
      if (value === 'Other') {
        setForm(prev => ({ ...prev, jenis_pelanggaran: 'Other' }));
      } else {
        setForm(prev => ({ ...prev, jenis_pelanggaran: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateInput = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nis) nextErrors.nis = 'NIS wajib diisi';
    if (!form.tanggal_pelanggaran) nextErrors.tanggal_pelanggaran = 'Tanggal wajib diisi';
    if (!form.jenis_pelanggaran) nextErrors.jenis_pelanggaran = 'Jenis wajib dipilih';
    if (!form.deskripsi_pelanggaran) nextErrors.deskripsi_pelanggaran = 'Deskripsi wajib diisi';
    if (!form.poin_pelanggaran) nextErrors.poin_pelanggaran = 'Poin wajib diisi';
    if (!form.status) nextErrors.status = 'Status wajib dipilih';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitInput = async () => {
    if (!validateInput()) return;
    try {
      setInputLoading(true);
      setInputError(null);
      setInputSuccess(null);
      const payload = {
        nis: form.nis,
        tanggal_pelanggaran: form.tanggal_pelanggaran,
        jenis_pelanggaran: form.jenis_pelanggaran,
        deskripsi_pelanggaran: form.deskripsi_pelanggaran,
        poin_pelanggaran: Number(form.poin_pelanggaran),
        status: form.status
      };
      await api.post('/pelanggaran', payload);
      setInputSuccess('Pelanggaran berhasil disimpan');
      // refresh list and close modal
      await fetchList();
      setTimeout(() => {
        setShowInputModal(false);
        setForm({
          nis: '',
          tanggal_pelanggaran: todayLocal(),
          jenis_pelanggaran: '',
          deskripsi_pelanggaran: '',
          poin_pelanggaran: '',
          status: 'Active'
        });
        setSelectedKelas('');
        setSiswaOptions([]);
      }, 600);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan pelanggaran';
      setInputError(msg);
    } finally {
      setInputLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Daftar Pelanggaran</h1>
        <div className="flex gap-2">
          <a href="/kedisiplinan/pelanggaran/jenis" className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md">
            <span className="mr-1">+</span> Jenis Pelanggaran
          </a>
          <button onClick={() => { setForm(prev => ({ ...prev, tanggal_pelanggaran: todayLocal() })); setShowInputModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-md">Input Pelanggaran</button>
        </div>
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
              <th className="text-left px-4 py-2 text-sm text-gray-600">Aksi</th>
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
                  <td className="px-4 py-2 text-sm">{row.deskripsi_pelanggaran}</td>
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
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowInputModal(true);
                          setForm({
                            nis: row.nis,
                            tanggal_pelanggaran: row.tanggal_pelanggaran,
                            jenis_pelanggaran: row.jenis_pelanggaran,
                            deskripsi_pelanggaran: row.deskripsi_pelanggaran,
                            poin_pelanggaran: String(row.poin_pelanggaran),
                            status: row.status
                          });
                        }}
                        className="px-3 py-1 text-sm bg-slate-200 text-slate-800 rounded"
                      >Edit</button>
                      <button
                        onClick={async () => { await api.delete(`/v1/pelanggaran/${row.id_pelanggaran}`); await fetchList(); }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                      >Hapus</button>
                    </div>
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

      {/* Modal Input Pelanggaran */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/30 px-3 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-4 w-full max-w-md md:max-w-xl lg:max-w-2xl shadow max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Input Pelanggaran</h2>
              <button onClick={() => setShowInputModal(false)} className="px-3 py-1 rounded bg-slate-200 text-slate-800">Tutup</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Kelas</label>
                <select value={selectedKelas} onChange={(e) => { const v = e.target.value; setSelectedKelas(v); fetchSiswaByKelas(v); }} className="w-full border rounded px-2 py-2">
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Siswa (NIS)</label>
                <select name="nis" value={form.nis} onChange={(e) => handleInputChange(e)} className="w-full border rounded px-2 py-2">
                  <option value="">Pilih Siswa</option>
                  {siswaOptions.map(s => <option key={s.nis} value={s.nis}>{s.nis} - {s.nama_lengkap}</option>)}
                </select>
                {formErrors.nis && <p className="text-sm text-red-600 mt-1">{formErrors.nis}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tanggal Pelanggaran</label>
                <input type="date" name="tanggal_pelanggaran" value={form.tanggal_pelanggaran} onChange={(e) => handleInputChange(e)} className="w-full border rounded px-2 py-2" />
                {formErrors.tanggal_pelanggaran && <p className="text-sm text-red-600 mt-1">{formErrors.tanggal_pelanggaran}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Jenis Pelanggaran</label>
                <select name="jenis_pelanggaran" value={form.jenis_pelanggaran} onChange={(e) => handleInputChange(e)} className="w-full border rounded px-2 py-2">
                  <option value="">Pilih Jenis</option>
                  {jenisOptions.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
                </select>
                {formErrors.jenis_pelanggaran && <p className="text-sm text-red-600 mt-1">{formErrors.jenis_pelanggaran}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Deskripsi Pelanggaran</label>
                <textarea name="deskripsi_pelanggaran" value={form.deskripsi_pelanggaran} onChange={(e) => handleInputChange(e)} rows={3} className="w-full border rounded px-2 py-2" />
                {formErrors.deskripsi_pelanggaran && <p className="text-sm text-red-600 mt-1">{formErrors.deskripsi_pelanggaran}</p>}
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Poin Pelanggaran</label>
                <input type="number" name="poin_pelanggaran" value={form.poin_pelanggaran} onChange={(e) => handleInputChange(e)} className="w-full border rounded px-2 py-2" />
                {formErrors.poin_pelanggaran && <p className="text-sm text-red-600 mt-1">{formErrors.poin_pelanggaran}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select name="status" value={form.status} onChange={(e) => handleInputChange(e)} className="w-full border rounded px-2 py-2">
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {formErrors.status && <p className="text-sm text-red-600 mt-1">{formErrors.status}</p>}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={submitInput} disabled={inputLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                {inputLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            {inputError && <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{inputError}</div>}
            {inputSuccess && <div className="mt-4 bg-green-50 text-green-700 border border-green-200 rounded p-3 text-sm">{inputSuccess}</div>}
          </div>
        </div>
      )}
    </div>
  );
}