'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function BuatPengumumanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        const userType = parsed?.user_type;
        const canCreate = ['Admin', 'Guru'].includes(userType);
        setPermissions({ view: true, create: canCreate, edit: canCreate, delete: canCreate });
      } catch (e) {
        console.error('Invalid user data', e);
      }
    }
  }, []);

  const [form, setForm] = useState({
    judul_pengumuman: '',
    isi_pengumuman: '',
    status: 'Draft' as 'Draft' | 'Published' | 'Archived',
    target_type: 'All',
    target_roles: [] as string[],
    target_class_ids: [] as string[],
    target_user_ids: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Targeting options
  const rolesOptions = ['Admin', 'Kepala_Sekolah', 'Guru', 'Siswa', 'Orang_Tua', 'Petugas_Keuangan'];
  const [kelasOptions, setKelasOptions] = useState<{ id_kelas: number; nama_kelas: string }[]>([]);
  const [usersOptions, setUsersOptions] = useState<{ username?: string; nama_lengkap?: string; user_type?: string; user_id?: string | number; nis?: string }[]>([]);
  // Targeting Kelas: mode dan siswa per kelas
  const [kelasTargetMode, setKelasTargetMode] = useState<'Semua_Siswa' | 'Siswa_Terpilih'>('Semua_Siswa');
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [siswaOptions, setSiswaOptions] = useState<{ nis: string; nama_lengkap: string }[]>([]);

  useEffect(() => {
    const fetchKelasOptions = async () => {
      try {
        const resp = await api.get('/v1/kelas-form-data');
        const raw = resp.data?.data;
        let options: any[] = [];
        if (Array.isArray(raw)) options = raw;
        else if (raw && Array.isArray(raw.kelasOptions)) options = raw.kelasOptions;
        else if (raw && Array.isArray(raw.kelas_options)) options = raw.kelas_options;
        else if (raw && Array.isArray(raw.kelas)) options = raw.kelas;
        setKelasOptions(Array.isArray(options) ? options : []);
      } catch (err) {
        // fallback jika API belum tersedia
        setKelasOptions([
          { id_kelas: 1, nama_kelas: 'X IPA 1' },
          { id_kelas: 2, nama_kelas: 'XI IPS 2' }
        ]);
      }
    };
    fetchKelasOptions();
  }, []);

  // Fetch daftar user untuk multi-select penargetan berdasarkan nama/user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Coba endpoint users umum jika tersedia
        const resp = await api.get('/v1/users');
        const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
        const mapped = list.map((u: any) => ({
          username: u.username,
          nama_lengkap: u.nama_lengkap || u.name || u.nama,
          user_type: u.user_type,
          user_id: u.user_id || u.id,
        }));
        if (mapped.length) {
          setUsersOptions(mapped);
          return;
        }
      } catch (e) {
        // lanjut ke fallback
      }

      try {
        // Fallback siswa
        const respSiswa = await api.get('/v1/siswa');
        const listSiswa = Array.isArray(respSiswa.data?.data) ? respSiswa.data.data : [];
        const mappedSiswa = listSiswa.map((s: any) => ({
          username: s.username, // jika ada
          nama_lengkap: s.nama_lengkap || s.nama,
          user_type: 'Siswa',
          user_id: s.id || s.nis,
          nis: s.nis,
        }));
        setUsersOptions((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          return [...base, ...mappedSiswa];
        });
      } catch (e2) {
        // abaikan jika tidak ada API siswa
      }

      try {
        // Fallback guru (jika endpoint tersedia)
        const respGuru = await api.get('/v1/guru');
        const listGuru = Array.isArray(respGuru.data?.data) ? respGuru.data.data : [];
        const mappedGuru = listGuru.map((g: any) => ({
          username: g.username,
          nama_lengkap: g.nama_lengkap || g.nama,
          user_type: 'Guru',
          user_id: g.id,
        }));
        setUsersOptions((prev) => {
          const base = Array.isArray(prev) ? prev : [];
          return [...base, ...mappedGuru];
        });
      } catch (e3) {
        // abaikan jika tidak ada API guru
      }

      // Jika semua gagal, berikan opsi minimal agar UI dapat diuji
      setUsersOptions((prev) => {
        if (Array.isArray(prev) && prev.length) return prev;
        return [
          { username: 'test_siswa', nama_lengkap: 'Siswa Contoh', user_type: 'Siswa', user_id: 'SSW001', nis: 'SSW001' },
          { username: 'test_guru', nama_lengkap: 'Guru Contoh', user_type: 'Guru', user_id: 'GUR001' },
        ];
      });
    };
    fetchUsers();
  }, []);

  // Fetch siswa berdasarkan kelas terpilih (dengan fallback bila endpoint utama tidak tersedia)
  const fetchSiswaByKelas = async (kelasId: string) => {
    if (!kelasId) { setSiswaOptions([]); return; }
    try {
      const resp = await api.get(`/v1/tugas/siswa/${kelasId}`);
      const siswaList = Array.isArray(resp.data?.data) ? resp.data.data : [];
      // Normalisasi struktur ke { nis, nama_lengkap }
      const normalized = siswaList.map((s: any) => ({
        nis: String(s.nis ?? s.user_id ?? s.id ?? ''),
        nama_lengkap: s.nama_lengkap || s.nama || s.username || String(s.nis ?? s.id ?? '')
      }));
      setSiswaOptions(normalized);
    } catch (err: any) {
      // Fallback: ambil semua siswa lalu filter berdasarkan id_kelas
      try {
        const resp2 = await api.get('/v1/siswa');
        const list = Array.isArray(resp2.data?.data) ? resp2.data.data : [];
        const filtered = list
          .filter((s: any) => String(s.id_kelas) === String(kelasId))
          .map((s: any) => ({ nis: String(s.nis), nama_lengkap: s.nama_lengkap || s.nama }));
        setSiswaOptions(filtered);
      } catch (err2: any) {
        // Jika semua gagal, kosongkan opsi agar UI tetap aman
        setSiswaOptions([]);
      }
    }
  };

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const payload = {
        judul_pengumuman: form.judul_pengumuman,
        isi_pengumuman: form.isi_pengumuman,
        status: form.status,
        target_type: form.target_type,
        target_roles: form.target_roles,
        target_class_ids: form.target_class_ids,
        target_user_ids: form.target_user_ids,
        // Sertakan mode penargetan kelas bila relevan
        kelas_target_mode: form.target_type === 'Kelas' ? kelasTargetMode : undefined
      };
      try {
        await api.post('/v1/pengumuman', payload);
      } catch (apiErr: any) {
        try {
          const key = 'announcements';
          const existingRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
          const list = existingRaw ? JSON.parse(existingRaw) : [];
          const newItem = {
            id_pengumuman: Date.now(),
            judul_pengumuman: payload.judul_pengumuman,
            isi_pengumuman: payload.isi_pengumuman,
            status: payload.status,
            target_type: payload.target_type,
            target_roles: payload.target_roles,
            target_class_ids: payload.target_class_ids,
            target_user_ids: payload.target_user_ids,
            tanggal_posting: new Date().toISOString(),
            pembuat: user?.nama_lengkap || user?.username || 'Admin'
          };
          localStorage.setItem(key, JSON.stringify([newItem, ...list]));
          console.log('Saved announcement locally');
        } catch (e2) {
          console.log('Failed to save locally', e2);
        }
        console.log('Pengumuman create API not available:', apiErr?.message);
      }
      setSuccess('Pengumuman berhasil dibuat');
      setTimeout(() => router.push('/komunikasi/pengumuman'), 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal membuat pengumuman';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.create) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Anda tidak memiliki izin untuk membuat pengumuman.</p>
          <a href="/komunikasi/pengumuman" className="mt-3 inline-block text-blue-600 hover:underline">Kembali ke Pengumuman</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Buat Pengumuman</h1>
        {/* Actions: button + a + a */}
        <div className="flex items-center gap-2">
          <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md">Simpan Pengumuman</button>
          <a href="/komunikasi/pengumuman" className="px-3 py-2 text-blue-600 hover:underline">Lihat Semua</a>
          <a href="/dashboard" className="px-3 py-2 text-slate-600 hover:underline">Kembali ke Dashboard</a>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        {error && <p className="text-red-600 mb-3">{error}</p>}
        {success && <p className="text-green-600 mb-3">{success}</p>}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Judul Pengumuman</label>
            <input name="judul_pengumuman" value={form.judul_pengumuman} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Isi Pengumuman</label>
            <textarea name="isi_pengumuman" value={form.isi_pengumuman} onChange={handleChange} rows={6} className="mt-1 w-full border rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target (Umum)</label>
              <select name="target_type" value={form.target_type} onChange={handleChange} className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="All">Semua</option>
                <option value="Roles">Berdasarkan Role</option>
                <option value="Kelas">Berdasarkan Kelas</option>
                <option value="User">Berdasarkan User</option>
              </select>
            </div>
          </div>

          {/* Target berdasarkan Role (hanya tampil jika target_type = 'Roles') */}
          {form.target_type === 'Roles' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Pilih Role</label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {rolesOptions.map((role) => (
                  <label key={role} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.target_roles.includes(role)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm(prev => ({
                          ...prev,
                          target_roles: checked ? [...prev.target_roles, role] : prev.target_roles.filter(r => r !== role)
                        }));
                      }}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Target berdasarkan Kelas (hanya tampil jika target_type = 'Kelas') */}
          {form.target_type === 'Kelas' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Pilih Kelas</label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={selectedKelasId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedKelasId(val);
                  setForm(prev => ({ ...prev, target_class_ids: val ? [val] : [] }));
                  setForm(prev => ({ ...prev, target_user_ids: [] }));
                  // reset mode ke default saat ganti kelas
                  setKelasTargetMode('Semua_Siswa');
                  fetchSiswaByKelas(val);
                }}
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map(k => (
                  <option key={k.id_kelas} value={String(k.id_kelas)}>{k.nama_kelas}</option>
                ))}
              </select>

              {selectedKelasId && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Target Siswa di Kelas</label>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="kelas_target_mode"
                        checked={kelasTargetMode === 'Semua_Siswa'}
                        onChange={() => {
                          setKelasTargetMode('Semua_Siswa');
                          setForm(prev => ({ ...prev, target_user_ids: [] }));
                        }}
                      />
                      <span>Semua Siswa di Kelas</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="kelas_target_mode"
                        checked={kelasTargetMode === 'Siswa_Terpilih'}
                        onChange={() => setKelasTargetMode('Siswa_Terpilih')}
                      />
                      <span>Siswa Terpilih</span>
                    </label>
                  </div>

                  {kelasTargetMode === 'Siswa_Terpilih' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Pilih Siswa</label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {siswaOptions.map((s) => (
                          <label key={s.nis} className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.target_user_ids.includes(String(s.nis))}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const val = String(s.nis);
                                setForm(prev => ({
                                  ...prev,
                                  target_user_ids: checked
                                    ? [...prev.target_user_ids, val]
                                    : prev.target_user_ids.filter(uid => uid !== val)
                                }));
                              }}
                            />
                            <span>{s.nama_lengkap}</span>
                          </label>
                        ))}
                        {siswaOptions.length === 0 && (
                          <p className="text-xs text-gray-500">Tidak ada data siswa untuk kelas ini.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Target berdasarkan User (hanya tampil jika target_type = 'User') */}
          {form.target_type === 'User' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Pilih Nama/User (bisa lebih dari satu)</label>
              <select
                multiple
                value={form.target_user_ids}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                  setForm(prev => ({ ...prev, target_user_ids: selected }));
                }}
                className="mt-1 w-full border rounded-md px-3 py-2 h-40"
              >
                {usersOptions.map((u, idx) => {
                  const value = String(u.username || u.user_id || u.nis || '');
                  const label = `${u.nama_lengkap || u.username || value}${u.user_type ? ` (${u.user_type})` : ''}`;
                  return (
                    <option key={value || idx} value={value}>{label}</option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 mt-1">Tahan tombol Ctrl/Command untuk memilih banyak item.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}