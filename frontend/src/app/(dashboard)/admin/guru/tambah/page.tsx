'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Phone, 
  MapPin,
  BookOpen,
  Briefcase,
  X,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import SearchableDropdownMultiple from '@/components/ui/SearchableDropdownMultiple';

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: string;
}

interface FormData {
  nik_guru: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat: string;
  no_telepon: string;
  status_kepegawaian: string;
  jabatan: string;
  status: string;
  mata_pelajaran: number[];
}

interface FormDataResponse {
  mata_pelajaran: MataPelajaran[];
  mata_pelajaran_grouped: Record<string, MataPelajaran[]>;
  status_kepegawaian_options: string[];
  jabatan_options: string[];
}

export default function TambahGuruPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formDataLoading, setFormDataLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormDataResponse | null>(null);
  const [selectedMapel, setSelectedMapel] = useState<MataPelajaran[]>([]);

  const [formData, setFormData] = useState<FormData>({
    nik_guru: '',
    nama_lengkap: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    no_telepon: '',
    status_kepegawaian: 'Honorer',
    jabatan: 'Guru',
    status: 'Aktif',
    mata_pelajaran: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // User account creation state (optional)
  const [createUserAccount, setCreateUserAccount] = useState(false);
  const [userAccount, setUserAccount] = useState({
    username: '',
    password: '',
    password_confirmation: '',
    status: 'Aktif'
  });

  // Fetch form options
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await api.get('/guru-form-data');
        if (response.data.success) {
          setFormOptions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setFormDataLoading(false);
      }
    };

    fetchFormData();
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  // Handle mata pelajaran selection
  const handleMapelSelect = (mapel: MataPelajaran) => {
    if (!selectedMapel.find(item => item.id_mata_pelajaran === mapel.id_mata_pelajaran)) {
      const newSelectedMapel = [...selectedMapel, mapel];
      setSelectedMapel(newSelectedMapel);
      setFormData(prev => ({
        ...prev,
        mata_pelajaran: newSelectedMapel.map(item => item.id_mata_pelajaran)
      }));
    }
  };

  // Remove mata pelajaran
  const handleMapelRemove = (mapelId: number) => {
    const newSelectedMapel = selectedMapel.filter(item => item.id_mata_pelajaran !== mapelId);
    setSelectedMapel(newSelectedMapel);
    setFormData(prev => ({
      ...prev,
      mata_pelajaran: newSelectedMapel.map(item => item.id_mata_pelajaran)
    }));
  };

  // Handle optional user account input change
  const handleUserAccountChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserAccount(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear related errors when user edits
    if (errors[`user_${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`user_${name}`]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nik_guru.trim()) {
      newErrors.nik_guru = 'NIK Guru harus diisi';
    }

    if (!formData.nama_lengkap.trim()) {
      newErrors.nama_lengkap = 'Nama lengkap harus diisi';
    }

    if (!formData.tanggal_lahir) {
      newErrors.tanggal_lahir = 'Tanggal lahir harus diisi';
    } else {
      const birthDate = new Date(formData.tanggal_lahir);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 20 || age > 70) {
        newErrors.tanggal_lahir = 'Umur guru harus antara 20-70 tahun';
      }
    }

    if (formData.no_telepon && !/^[0-9+\-\s]+$/.test(formData.no_telepon)) {
      newErrors.no_telepon = 'Format nomor telepon tidak valid';
    }

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

  // Generate user id for Guru
  const generateUserId = () => {
    const prefix = 'GR'; // Guru
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/guru', formData);
      
      if (response.data.success) {
        let userCreationMessage = '';
        if (createUserAccount) {
          try {
            const userPayload = {
              user_id: generateUserId(),
              username: userAccount.username,
              password: userAccount.password,
              password_confirmation: userAccount.password_confirmation,
              user_type: 'Guru',
              reference_id: formData.nik_guru,
              status: userAccount.status
            };
            const userRes = await api.post('/users', userPayload);
            if (userRes.data?.success) {
              userCreationMessage = '\nAkun user guru berhasil dibuat.';
            }
          } catch (err: any) {
            const msg = err?.response?.data?.message || 'Gagal membuat akun user.';
            userCreationMessage = `\n${msg}`;
          }
        }
        alert('Data guru berhasil ditambahkan' + userCreationMessage);
        router.push('/admin/guru');
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};
        
        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0];
        });
        
        setErrors(newErrors);
      } else {
        alert('Error: ' + (error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (formDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/guru"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tambah Data Guru</h1>
              <p className="text-gray-600 mt-1">Masukkan informasi guru baru</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data Pribadi */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Data Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Guru *
                </label>
                <input
                  type="text"
                  name="nik_guru"
                  value={formData.nik_guru}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nik_guru ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan NIK Guru"
                />
                {errors.nik_guru && (
                  <p className="mt-1 text-sm text-red-600">{errors.nik_guru}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nama_lengkap ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.nama_lengkap && (
                  <p className="mt-1 text-sm text-red-600">{errors.nama_lengkap}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tanggal_lahir ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_lahir && (
                  <p className="mt-1 text-sm text-red-600">{errors.tanggal_lahir}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Telepon
                </label>
                <input
                  type="text"
                  name="no_telepon"
                  value={formData.no_telepon}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.no_telepon ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="08xxx-xxxx-xxxx"
                />
                {errors.no_telepon && (
                  <p className="mt-1 text-sm text-red-600">{errors.no_telepon}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Data Kepegawaian */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase size={20} className="mr-2" />
              Data Kepegawaian
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Kepegawaian *
                </label>
                <select
                  name="status_kepegawaian"
                  value={formData.status_kepegawaian}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formOptions?.status_kepegawaian_options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jabatan *
                </label>
                <select
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formOptions?.jabatan_options.map(option => (
                    <option key={option} value={option}>
                      {option.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen size={20} className="mr-2" />
              Mata Pelajaran
            </h2>
            
            <SearchableDropdownMultiple
              options={formOptions?.mata_pelajaran || []}
              selectedOptions={selectedMapel}
              onSelect={handleMapelSelect}
              onRemove={handleMapelRemove}
              placeholder="Cari mata pelajaran..."
              label="Tambah Mata Pelajaran"
              className="max-w-full"
            />
          </div>

          {/* Akun User (Opsional) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Akun User (Opsional)
            </h2>
            <div className="flex items-center justify-between mb-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createUserAccount}
                  onChange={(e) => setCreateUserAccount(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Buat akun untuk guru ini</span>
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
                      errors.user_username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan username"
                  />
                  {errors.user_username && (
                    <p className="mt-1 text-sm text-red-600">{errors.user_username}</p>
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
                      errors.user_password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan password"
                  />
                  {errors.user_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.user_password}</p>
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
                      errors.user_password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ulangi password"
                  />
                  {errors.user_password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">{errors.user_password_confirmation}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/guru"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Simpan Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}