'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  nis: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat: string;
  id_kelas: string;
  id_jurusan: string;
  rombel: string;
  status: 'Aktif' | 'Non-aktif' | 'Lulus';
  asal_sekolah: string;
  nama_ayah: string;
  nama_ibu: string;
  no_hp_orang_tua: string;
  alamat_orang_tua: string;
  golongan_darah: 'A' | 'B' | 'AB' | 'O' | '';
}

interface Kelas {
  id_kelas: number;
  nama_kelas: string;
  nama_jurusan: string;
}

interface Jurusan {
  id_jurusan: number;
  nama_jurusan: string;
}

export default function TambahSiswaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // User account creation state (optional)
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [userAccount, setUserAccount] = useState({
    username: '',
    password: '',
    password_confirmation: '',
    status: 'Aktif'
  });

  const [formData, setFormData] = useState<FormData>({
    nis: '',
    nama_lengkap: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    id_kelas: '',
    id_jurusan: '',
    rombel: '',
    status: 'Aktif',
    asal_sekolah: '',
    nama_ayah: '',
    nama_ibu: '',
    no_hp_orang_tua: '',
    alamat_orang_tua: '',
    golongan_darah: ''
  });

  // Fetch form data
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/v1/siswa-form-data');
      if (response.data.success) {
        setKelas(response.data.data.kelas);
        setJurusan(response.data.data.jurusan);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUserAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserAccount(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear related errors
    if (errors[`user_${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`user_${name}`]: ''
      }));
    }
  };

  const generateUserId = () => {
    const prefix = 'SW'; // Siswa
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nis) newErrors.nis = 'NIS wajib diisi';
    if (!formData.nama_lengkap) newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
    if (!formData.tanggal_lahir) newErrors.tanggal_lahir = 'Tanggal lahir wajib diisi';
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih';

    // Validate optional user account fields when enabled
    if (createUserAccount) {
      if (!userAccount.username) newErrors.user_username = 'Username wajib diisi';
      if (userAccount.username && userAccount.username.length < 3) newErrors.user_username = 'Username minimal 3 karakter';
      if (!userAccount.password) newErrors.user_password = 'Password wajib diisi';
      if (userAccount.password && userAccount.password.length < 6) newErrors.user_password = 'Password minimal 6 karakter';
      if (!userAccount.password_confirmation) newErrors.user_password_confirmation = 'Konfirmasi password wajib diisi';
      if (userAccount.password !== userAccount.password_confirmation) newErrors.user_password_confirmation = 'Konfirmasi password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        id_kelas: formData.id_kelas ? parseInt(formData.id_kelas) : null,
        id_jurusan: formData.id_jurusan ? parseInt(formData.id_jurusan) : null,
        rombel: formData.rombel || null,
        golongan_darah: formData.golongan_darah || null
      };

      const response = await api.post('/v1/siswa', submitData);
      
      if (response.data.success) {
        let userCreationMessage = '';
        if (createUserAccount) {
          try {
            const userPayload = {
              user_id: generateUserId(),
              username: userAccount.username,
              password: userAccount.password,
              password_confirmation: userAccount.password_confirmation,
              user_type: 'Siswa',
              reference_id: formData.nis,
              status: userAccount.status
            };
            const userRes = await api.post('/v1/users', userPayload);
            if (userRes.data?.success) {
              userCreationMessage = '\nAkun user siswa berhasil dibuat.';
            }
          } catch (err: any) {
            const msg = err?.response?.data?.message || 'Gagal membuat akun user.';
            userCreationMessage = `\n${msg}`;
          }
        }
        alert('Data siswa berhasil ditambahkan!' + userCreationMessage);
        router.push('/admin/siswa');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/siswa"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tambah Siswa Baru</h1>
              <p className="text-gray-600 mt-1">
                Isi form di bawah untuk menambahkan data siswa baru
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Pribadi */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Pribadi Siswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIS <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nis"
                value={formData.nis}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nis ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan NIS"
              />
              {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nama_lengkap ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {errors.nama_lengkap && <p className="text-red-500 text-sm mt-1">{errors.nama_lengkap}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tanggal_lahir ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.tanggal_lahir && <p className="text-red-500 text-sm mt-1">{errors.tanggal_lahir}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Golongan Darah</label>
              <select
                name="golongan_darah"
                value={formData.golongan_darah}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih golongan darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asal Sekolah</label>
              <input
                type="text"
                name="asal_sekolah"
                value={formData.asal_sekolah}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan asal sekolah"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan alamat lengkap"
              />
            </div>
          </div>
        </div>

        {/* Data Akademik */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Akademik</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jurusan</label>
              <select
                name="id_jurusan"
                value={formData.id_jurusan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih jurusan</option>
                {jurusan.map((item) => (
                  <option key={item.id_jurusan} value={item.id_jurusan}>
                    {item.nama_jurusan}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
              <select
                name="id_kelas"
                value={formData.id_kelas}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih kelas</option>
                {kelas.map((item) => (
                  <option key={item.id_kelas} value={item.id_kelas}>
                    {item.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rombel</label>
              <select
                name="rombel"
                value={formData.rombel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih rombel</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
                <option value="Lulus">Lulus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Orang Tua</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ayah</label>
              <input
                type="text"
                name="nama_ayah"
                value={formData.nama_ayah}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama ayah"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ibu</label>
              <input
                type="text"
                name="nama_ibu"
                value={formData.nama_ibu}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama ibu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">No. HP Orang Tua</label>
              <input
                type="text"
                name="no_hp_orang_tua"
                value={formData.no_hp_orang_tua}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nomor HP"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Orang Tua</label>
              <textarea
                name="alamat_orang_tua"
                value={formData.alamat_orang_tua}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan alamat orang tua"
              />
            </div>
          </div>
        </div>

        {/* Akun User (Opsional) */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Akun User (Opsional)</h2>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={createUserAccount}
                onChange={(e) => setCreateUserAccount(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Buat akun untuk siswa ini</span>
            </label>
          </div>

          {createUserAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={userAccount.username}
                  onChange={handleUserAccountChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.user_username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan username"
                />
                {errors.user_username && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Akun *</label>
                <select
                  name="status"
                  value={userAccount.status}
                  onChange={handleUserAccountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={userAccount.password}
                  onChange={handleUserAccountChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.user_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan password"
                />
                {errors.user_password && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password *</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={userAccount.password_confirmation}
                  onChange={handleUserAccountChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.user_password_confirmation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ulangi password"
                />
                {errors.user_password_confirmation && (
                  <p className="text-red-500 text-sm mt-1">{errors.user_password_confirmation}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-end space-x-3">
            <Link
              href="/admin/siswa"
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X size={20} className="mr-2" />
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save size={20} className="mr-2" />
              )}
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}