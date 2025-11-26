'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Option = { value: string; label: string };
type KelasOption = { id_kelas: number; nama_kelas: string };
type SiswaOption = { nis: string; nama_lengkap: string };

export default function InputPelanggaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [jenisOptions, setJenisOptions] = useState<Option[]>([]);
  const [statusOptions, setStatusOptions] = useState<Option[]>([]);
  const [siswaOptions, setSiswaOptions] = useState<SiswaOption[]>([]);
  const [showJenisModal, setShowJenisModal] = useState(false);
  const [newJenisName, setNewJenisName] = useState('');

  const [selectedKelas, setSelectedKelas] = useState<string>('');

  const todayLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [form, setForm] = useState({
    nis: '',
    tanggal_pelanggaran: todayLocal(),
    jenis_pelanggaran: '',
    deskripsi_pelanggaran: '',
    poin_pelanggaran: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchFormData = async () => {
    try {
      setError(null);
      const resp = await api.get('/v1/pelanggaran-form-data');
      const data = resp.data?.data || {};
      const kelas = Array.isArray(data.kelas) ? data.kelas : (Array.isArray(data.kelas_options) ? data.kelas_options : []);
      setKelasOptions(kelas);
      let baseJenis = Array.isArray(data.jenis_pelanggaran_options) ? data.jenis_pelanggaran_options : [];
      try {
        const hiddenRaw = localStorage.getItem('jenis_override_hidden');
        const hidden: string[] = hiddenRaw ? JSON.parse(hiddenRaw) : [];
        const labelsRaw = localStorage.getItem('jenis_override_labels');
        const labels: Record<string, string> = labelsRaw ? JSON.parse(labelsRaw) : {};
        baseJenis = baseJenis
          .filter((o: Option) => !hidden.includes(o.value))
          .map((o: Option) => ({ ...o, label: labels[o.value] ?? o.label }));
      } catch {}
      setJenisOptions(baseJenis);
      setStatusOptions(Array.isArray(data.status_options) ? data.status_options : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat form data');
    }
  };

  const fetchSiswaByKelas = async (kelasId: string) => {
    if (!kelasId) { setSiswaOptions([]); return; }
    try {
      setError(null);
      // Reuse tugas endpoint pattern for siswa by kelas if available
      const resp = await api.get(`/v1/tugas/siswa/${kelasId}`);
      const siswa = Array.isArray(resp.data?.data) ? resp.data.data : [];
      setSiswaOptions(siswa);
    } catch (err: any) {
      // fallback: try siswa-form-data and filter client-side if structure fits
      try {
        const resp2 = await api.get('/v1/siswa');
        const list = Array.isArray(resp2.data?.data) ? resp2.data.data : [];
        const filtered = list.filter((s: any) => String(s.id_kelas) === String(kelasId))
          .map((s: any) => ({ nis: s.nis, nama_lengkap: s.nama_lengkap }));
        setSiswaOptions(filtered);
      } catch (e2: any) {
        setError(err?.response?.data?.message || 'Gagal memuat siswa');
      }
    }
  };

  useEffect(() => { fetchFormData(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedKelas(val);
    fetchSiswaByKelas(val);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.nis) nextErrors.nis = 'NIS wajib diisi';
    if (!form.tanggal_pelanggaran) nextErrors.tanggal_pelanggaran = 'Tanggal wajib diisi';
    if (!form.jenis_pelanggaran) nextErrors.jenis_pelanggaran = 'Jenis wajib dipilih';
    if (!form.deskripsi_pelanggaran) nextErrors.deskripsi_pelanggaran = 'Deskripsi wajib diisi';
    if (!form.poin_pelanggaran) nextErrors.poin_pelanggaran = 'Poin wajib diisi';
    if (!form.status) nextErrors.status = 'Status wajib dipilih';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const payload = {
        nis: form.nis,
        tanggal_pelanggaran: form.tanggal_pelanggaran,
        jenis_pelanggaran: form.jenis_pelanggaran,
        deskripsi_pelanggaran: form.deskripsi_pelanggaran,
        poin_pelanggaran: Number(form.poin_pelanggaran),
        status: form.status
      };
      const resp = await api.post('/v1/pelanggaran', payload);
      setSuccess('Pelanggaran berhasil disimpan');
      setTimeout(() => router.push('/kedisiplinan/pelanggaran'), 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal menyimpan pelanggaran';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Input Pelanggaran</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowJenisModal(true)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md">
            <span className="mr-1">+</span> Jenis Pelanggaran
          </button>
          <a href="/kedisiplinan/pelanggaran" className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md">Kembali</a>
        </div>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Kelas</label>
            <select value={selectedKelas} onChange={handleKelasChange} className="w-full border rounded px-2 py-2">
              <option value="">Pilih Kelas</option>
              {kelasOptions.map(k => <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Siswa (NIS)</label>
            <select name="nis" value={form.nis} onChange={handleChange} className="w-full border rounded px-2 py-2">
              <option value="">Pilih Siswa</option>
              {siswaOptions.map(s => <option key={s.nis} value={s.nis}>{s.nis} - {s.nama_lengkap}</option>)}
            </select>
            {errors.nis && <p className="text-sm text-red-600 mt-1">{errors.nis}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tanggal Pelanggaran</label>
            <input type="date" name="tanggal_pelanggaran" value={form.tanggal_pelanggaran} onChange={handleChange} className="w-full border rounded px-2 py-2" />
            {errors.tanggal_pelanggaran && <p className="text-sm text-red-600 mt-1">{errors.tanggal_pelanggaran}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Jenis Pelanggaran</label>
            <select name="jenis_pelanggaran" value={form.jenis_pelanggaran} onChange={handleChange} className="w-full border rounded px-2 py-2">
              <option value="">Pilih Jenis</option>
              {jenisOptions.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
            {errors.jenis_pelanggaran && <p className="text-sm text-red-600 mt-1">{errors.jenis_pelanggaran}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Deskripsi Pelanggaran</label>
            <textarea name="deskripsi_pelanggaran" value={form.deskripsi_pelanggaran} onChange={handleChange} rows={3} className="w-full border rounded px-2 py-2" />
            {errors.deskripsi_pelanggaran && <p className="text-sm text-red-600 mt-1">{errors.deskripsi_pelanggaran}</p>}
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Poin Pelanggaran</label>
            <input type="number" name="poin_pelanggaran" value={form.poin_pelanggaran} onChange={handleChange} className="w-full border rounded px-2 py-2" />
            {errors.poin_pelanggaran && <p className="text-sm text-red-600 mt-1">{errors.poin_pelanggaran}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-2">
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status}</p>}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

        {error && <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>}
        {success && <div className="mt-4 bg-green-50 text-green-700 border border-green-200 rounded p-3 text-sm">{success}</div>}
      </div>

      {/* Modal tambah jenis pelanggaran */}
      {showJenisModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-4 w-full max-w-md shadow">
            <h2 className="text-lg font-semibold mb-2">Tambah Jenis Pelanggaran</h2>
            <p className="text-sm text-gray-600 mb-3">Jenis baru akan tersimpan sebagai default dan muncul di semua perangkat.</p>
            <input
              type="text"
              value={newJenisName}
              onChange={(e) => setNewJenisName(e.target.value)}
              placeholder="Nama jenis pelanggaran"
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowJenisModal(false)} className="px-3 py-2 rounded bg-slate-200 text-slate-800">Batal</button>
              <button
                onClick={() => {
                  const name = newJenisName.trim();
                  if (!name) return;
                  const doSave = async () => {
                    try {
                      await api.post('/v1/jenis-pelanggaran', { label: name });
                      await fetchFormData();
                      setForm(prev => ({ ...prev, jenis_pelanggaran: name }));
                      setNewJenisName('');
                      setShowJenisModal(false);
                    } catch {}
                  };
                  doSave();
                }}
                className="px-3 py-2 rounded bg-blue-600 text-white"
              >Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}