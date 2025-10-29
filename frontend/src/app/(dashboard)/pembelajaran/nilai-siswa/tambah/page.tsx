'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, GraduationCap, User, BookOpen, Calendar, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

interface FormData {
  nis: string;
  id_mata_pelajaran: string;
  id_tahun_ajaran: string;
  jenis_penilaian: 'PH1' | 'PH2' | 'PH3' | 'ASTS1' | 'ASAS' | 'ASTS2' | 'ASAT' | 'Tugas' | 'Praktek';
  nilai: string;
  status: 'Draft' | 'Final';
  keterangan: string;
}

interface FormOptions {
  siswa_options: Array<{ value: string; label: string }>;
  mata_pelajaran_options: Array<{ value: number; label: string }>;
  tahun_ajaran_options: Array<{ value: number; label: string }>;
  jenis_penilaian_options: Array<{ value: string; label: string }>;
  status_options: Array<{ value: string; label: string }>;
}

export default function TambahNilaiSiswaPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Permission configuration
  const nilaiSiswaPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as any || 'Siswa', nilaiSiswaPermissions);

  const [formData, setFormData] = useState<FormData>({
    nis: '',
    id_mata_pelajaran: '',
    id_tahun_ajaran: '',
    jenis_penilaian: 'PH1',
    nilai: '',
    status: 'Draft',
    keterangan: ''
  });

  const [formOptions, setFormOptions] = useState<FormOptions>({
    siswa_options: [],
    mata_pelajaran_options: [],
    tahun_ajaran_options: [],
    jenis_penilaian_options: [],
    status_options: []
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(true);

  useEffect(() => {
    // Wait for user data to load before checking permissions
    if (user === null) {
      return; // Still loading user data
    }
    
    // Check permissions
    if (!userPermissions.create) {
      router.push('/pembelajaran/nilai-siswa');
      return;
    }
    
    fetchFormOptions();
  }, [user, userPermissions.create, router]);

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/v1/nilai-form-data');
      if (response.data.success) {
        setFormOptions(response.data.data);
        
        // Set default tahun ajaran to active one (first in the list since ordered by latest)
        const tahunAjaranOptions = response.data.data.tahun_ajaran_options;
        if (tahunAjaranOptions && tahunAjaranOptions.length > 0) {
          setFormData(prev => ({
            ...prev,
            id_tahun_ajaran: tahunAjaranOptions[0].value.toString()
          }));
        }

        // Auto-fill mata pelajaran for teachers (if only one subject assigned)
        const mataPelajaranOptions = response.data.data.mata_pelajaran_options;
        if (mataPelajaranOptions && mataPelajaranOptions.length === 1) {
          setFormData(prev => ({
            ...prev,
            id_mata_pelajaran: mataPelajaranOptions[0].value.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
    } finally {
      setFetchingOptions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nis) {
      newErrors.nis = 'Siswa harus dipilih';
    }

    if (!formData.id_mata_pelajaran) {
      newErrors.id_mata_pelajaran = 'Mata pelajaran harus dipilih';
    }

    if (!formData.id_tahun_ajaran) {
      newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';
    }

    if (!formData.nilai) {
      newErrors.nilai = 'Nilai harus diisi';
    } else {
      const nilaiNum = parseInt(formData.nilai);
      if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        newErrors.nilai = 'Nilai harus berupa angka antara 0-100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        nilai: parseInt(formData.nilai),
        id_mata_pelajaran: parseInt(formData.id_mata_pelajaran),
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran)
      };

      console.log('Submitting data:', submitData);
      console.log('Token:', localStorage.getItem('token'));
      console.log('User:', localStorage.getItem('user'));

      const response = await api.post('/v1/nilai', submitData);
      
      if (response.data.success) {
        router.push('/pembelajaran/nilai-siswa');
      } else {
        alert('Gagal menyimpan data nilai');
      }
    } catch (error: any) {
      console.error('Error saving nilai:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Terjadi kesalahan saat menyimpan data nilai');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSiswa = () => {
    return formOptions.siswa_options?.find(siswa => siswa.value === formData.nis);
  };

  const jenisPenilaianOptions = [
    { value: 'PH1', label: 'Penilaian Harian 1' },
    { value: 'PH2', label: 'Penilaian Harian 2' },
    { value: 'PH3', label: 'Penilaian Harian 3' },
    { value: 'ASTS1', label: 'Asesmen Sumatif Tengah Semester 1' },
    { value: 'ASAS', label: 'Asesmen Sumatif Akhir Semester' },
    { value: 'ASTS2', label: 'Asesmen Sumatif Tengah Semester 2' },
    { value: 'ASAT', label: 'Asesmen Sumatif Akhir Tahun' },
    { value: 'Tugas', label: 'Tugas' },
    { value: 'Praktek', label: 'Praktek' }
  ];

  if (fetchingOptions) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/pembelajaran/nilai-siswa"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Tambah Nilai Siswa
          </h1>
          <p className="text-gray-600">Input nilai siswa baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Siswa */}
            <div>
              <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Siswa *
              </label>
              <select
                id="nis"
                name="nis"
                value={formData.nis}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nis ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Siswa</option>
                {formOptions.siswa_options?.map((siswa) => (
                  <option key={siswa.value} value={siswa.value}>
                    {siswa.label}
                  </option>
                ))}
              </select>
              {errors.nis && (
                <p className="mt-1 text-sm text-red-600">{errors.nis}</p>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label htmlFor="id_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="inline h-4 w-4 mr-1" />
                Mata Pelajaran *
              </label>
              <select
                id="id_mata_pelajaran"
                name="id_mata_pelajaran"
                value={formData.id_mata_pelajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {formOptions.mata_pelajaran_options?.map((mp) => (
                  <option key={mp.value} value={mp.value}>
                    {mp.label}
                  </option>
                ))}
              </select>
              {errors.id_mata_pelajaran && (
                <p className="mt-1 text-sm text-red-600">{errors.id_mata_pelajaran}</p>
              )}
            </div>

            {/* Tahun Ajaran */}
            <div>
              <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tahun Ajaran *
              </label>
              <select
                id="id_tahun_ajaran"
                name="id_tahun_ajaran"
                value={formData.id_tahun_ajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Tahun Ajaran</option>
                {formOptions.tahun_ajaran_options?.map((ta) => (
                  <option key={ta.value} value={ta.value}>
                    {ta.label}
                  </option>
                ))}
              </select>
              {errors.id_tahun_ajaran && (
                <p className="mt-1 text-sm text-red-600">{errors.id_tahun_ajaran}</p>
              )}
            </div>

            {/* Jenis Penilaian */}
            <div>
              <label htmlFor="jenis_penilaian" className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="inline h-4 w-4 mr-1" />
                Jenis Penilaian *
              </label>
              <select
                id="jenis_penilaian"
                name="jenis_penilaian"
                value={formData.jenis_penilaian}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {jenisPenilaianOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nilai */}
            <div>
              <label htmlFor="nilai" className="block text-sm font-medium text-gray-700 mb-2">
                Nilai (0-100) *
              </label>
              <input
                type="number"
                id="nilai"
                name="nilai"
                min="0"
                max="100"
                value={formData.nilai}
                onChange={handleInputChange}
                placeholder="Masukkan nilai (0-100)"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nilai ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.nilai && (
                <p className="mt-1 text-sm text-red-600">{errors.nilai}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {formOptions.status_options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Draft: Nilai masih dapat diubah. Final: Nilai sudah dikunci.
              </p>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={3}
              placeholder="Masukkan keterangan tambahan (opsional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Selected Siswa Info */}
          {getSelectedSiswa() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Informasi Siswa Terpilih</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Siswa:</strong> {getSelectedSiswa()?.label}</p>
                <p><strong>NIS:</strong> {getSelectedSiswa()?.value}</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Link
              href="/pembelajaran/nilai-siswa"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}