'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, GraduationCap, User, BookOpen, Calendar, Award } from 'lucide-react';
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
  siswa: Array<{ nis: string; nama_lengkap: string; kelas: string }>;
  mata_pelajaran: Array<{ id_mata_pelajaran: number; nama_mata_pelajaran: string }>;
  tahun_ajaran: Array<{ id_tahun_ajaran: number; tahun_ajaran: string; semester: string }>;
}

interface NilaiSiswa {
  id_nilai: number;
  nis: string;
  nama_siswa: string;
  kelas: string;
  mata_pelajaran: string;
  id_mata_pelajaran: number;
  id_tahun_ajaran: number;
  jenis_penilaian: string;
  nilai: number;
  status: string;
  tanggal_input: string;
  nama_guru: string;
  keterangan?: string;
  tahun_ajaran: string;
  semester: string;
}

export default function EditNilaiSiswaPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  // Permission configuration
  const nilaiSiswaPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.role as any || 'Siswa', nilaiSiswaPermissions);

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
    siswa: [],
    mata_pelajaran: [],
    tahun_ajaran: []
  });

  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiSiswa | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check permissions
  useEffect(() => {
    if (!user) return;
    
    if (!userPermissions.edit) {
      router.push('/pembelajaran/nilai-siswa');
      return;
    }
  }, [user, userPermissions, router]);

  useEffect(() => {
    if (id && userPermissions.edit) {
      fetchNilaiSiswa();
      fetchFormOptions();
    }
  }, [id, userPermissions]);

  const fetchNilaiSiswa = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/v1/nilai/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setNilaiSiswa(data);
        
        // Populate form with existing data
        setFormData({
          nis: data.nis,
          id_mata_pelajaran: data.id_mata_pelajaran.toString(),
          id_tahun_ajaran: data.id_tahun_ajaran.toString(),
          jenis_penilaian: data.jenis_penilaian,
          nilai: data.nilai.toString(),
          status: data.status,
          keterangan: data.keterangan || ''
        });
      } else {
        router.push('/pembelajaran/nilai-siswa');
      }
    } catch (error) {
      console.error('Error fetching nilai siswa:', error);
      router.push('/pembelajaran/nilai-siswa');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/v1/nilai-form-data');
      if (response.data.success) {
        setFormOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nis) {
      newErrors.nis = 'Siswa harus dipilih';
    }

    if (!formData.id_mata_pelajaran) {
      newErrors.id_mata_pelajaran = 'Mata pelajaran harus dipilih';
    }

    if (!formData.id_tahun_ajaran) {
      newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';
    }

    if (!formData.jenis_penilaian) {
      newErrors.jenis_penilaian = 'Jenis penilaian harus dipilih';
    }

    if (!formData.nilai) {
      newErrors.nilai = 'Nilai harus diisi';
    } else {
      const nilaiNum = parseFloat(formData.nilai);
      if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
        newErrors.nilai = 'Nilai harus berupa angka antara 0-100';
      }
    }

    if (!formData.status) {
      newErrors.status = 'Status harus dipilih';
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
        nilai: parseFloat(formData.nilai),
        id_mata_pelajaran: parseInt(formData.id_mata_pelajaran),
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran)
      };

      const response = await api.put(`/v1/nilai/${id}`, submitData);
      
      if (response.data.success) {
        router.push(`/pembelajaran/nilai-siswa/${id}`);
      } else {
        if (response.data.errors) {
          setErrors(response.data.errors);
        } else {
          alert(response.data.message || 'Gagal mengupdate nilai siswa');
        }
      }
    } catch (error: any) {
      console.error('Error updating nilai siswa:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Terjadi kesalahan saat mengupdate nilai siswa');
      }
    } finally {
      setLoading(false);
    }
  };

  const getJenisPenilaianLabel = (jenis: string) => {
    const labels: Record<string, string> = {
      'PH1': 'Penilaian Harian 1',
      'PH2': 'Penilaian Harian 2',
      'PH3': 'Penilaian Harian 3',
      'ASTS1': 'Asesmen Sumatif Tengah Semester 1',
      'ASAS': 'Asesmen Sumatif Akhir Semester',
      'ASTS2': 'Asesmen Sumatif Tengah Semester 2',
      'ASAT': 'Asesmen Sumatif Akhir Tahun',
      'Tugas': 'Tugas',
      'Praktek': 'Praktek'
    };
    return labels[jenis] || jenis;
  };

  if (initialLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nilaiSiswa) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nilai Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Data nilai yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Link
            href="/pembelajaran/nilai-siswa"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Nilai
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/pembelajaran/nilai-siswa/${id}`}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              Edit Nilai Siswa
            </h1>
            <p className="text-gray-600">Ubah data nilai siswa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Student Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informasi Siswa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-2">
                      Siswa <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="nis"
                      name="nis"
                      value={formData.nis}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nis ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Pilih Siswa</option>
                      {formOptions.siswa.map((siswa) => (
                        <option key={siswa.nis} value={siswa.nis}>
                          {siswa.nis} - {siswa.nama_lengkap} ({siswa.kelas})
                        </option>
                      ))}
                    </select>
                    {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
                  </div>

                  <div>
                    <label htmlFor="id_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                      Mata Pelajaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="id_mata_pelajaran"
                      name="id_mata_pelajaran"
                      value={formData.id_mata_pelajaran}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.id_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Pilih Mata Pelajaran</option>
                      {formOptions.mata_pelajaran.map((mapel) => (
                        <option key={mapel.id_mata_pelajaran} value={mapel.id_mata_pelajaran}>
                          {mapel.nama_mata_pelajaran}
                        </option>
                      ))}
                    </select>
                    {errors.id_mata_pelajaran && <p className="text-red-500 text-sm mt-1">{errors.id_mata_pelajaran}</p>}
                  </div>

                  <div>
                    <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
                      Tahun Ajaran <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="id_tahun_ajaran"
                      name="id_tahun_ajaran"
                      value={formData.id_tahun_ajaran}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Pilih Tahun Ajaran</option>
                      {formOptions.tahun_ajaran.map((ta) => (
                        <option key={ta.id_tahun_ajaran} value={ta.id_tahun_ajaran}>
                          {ta.tahun_ajaran} - {ta.semester}
                        </option>
                      ))}
                    </select>
                    {errors.id_tahun_ajaran && <p className="text-red-500 text-sm mt-1">{errors.id_tahun_ajaran}</p>}
                  </div>
                </div>
              </div>

              {/* Assessment Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Detail Penilaian
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jenis_penilaian" className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Penilaian <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="jenis_penilaian"
                      name="jenis_penilaian"
                      value={formData.jenis_penilaian}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.jenis_penilaian ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="PH1">Penilaian Harian 1</option>
                      <option value="PH2">Penilaian Harian 2</option>
                      <option value="PH3">Penilaian Harian 3</option>
                      <option value="ASTS1">Asesmen Sumatif Tengah Semester 1</option>
                      <option value="ASAS">Asesmen Sumatif Akhir Semester</option>
                      <option value="ASTS2">Asesmen Sumatif Tengah Semester 2</option>
                      <option value="ASAT">Asesmen Sumatif Akhir Tahun</option>
                      <option value="Tugas">Tugas</option>
                      <option value="Praktek">Praktek</option>
                    </select>
                    {errors.jenis_penilaian && <p className="text-red-500 text-sm mt-1">{errors.jenis_penilaian}</p>}
                  </div>

                  <div>
                    <label htmlFor="nilai" className="block text-sm font-medium text-gray-700 mb-2">
                      Nilai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="nilai"
                      name="nilai"
                      value={formData.nilai}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nilai ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan nilai (0-100)"
                      required
                    />
                    {errors.nilai && <p className="text-red-500 text-sm mt-1">{errors.nilai}</p>}
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.status ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="Draft">Draft</option>
                      <option value="Final">Final</option>
                    </select>
                    {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan keterangan tambahan (opsional)"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <Link
                  href={`/pembelajaran/nilai-siswa/${id}`}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Saat Ini</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Siswa:</span>
                <p className="font-medium">{nilaiSiswa.nama_siswa}</p>
              </div>
              <div>
                <span className="text-gray-600">Mata Pelajaran:</span>
                <p className="font-medium">{nilaiSiswa.mata_pelajaran}</p>
              </div>
              <div>
                <span className="text-gray-600">Jenis Penilaian:</span>
                <p className="font-medium">{getJenisPenilaianLabel(nilaiSiswa.jenis_penilaian)}</p>
              </div>
              <div>
                <span className="text-gray-600">Nilai:</span>
                <p className="font-medium text-2xl text-blue-600">{nilaiSiswa.nilai}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  nilaiSiswa.status === 'Final' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {nilaiSiswa.status}
                </span>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Panduan</h2>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Nilai harus berupa angka antara 0-100</p>
              <p>• Status "Draft" dapat diubah sewaktu-waktu</p>
              <p>• Status "Final" menandakan nilai sudah dikunci</p>
              <p>• Keterangan bersifat opsional</p>
            </div>
          </div>

          {/* Grade Scale */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skala Nilai</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">85-100</span>
                <span className="font-medium text-green-600">Sangat Baik</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">70-84</span>
                <span className="font-medium text-blue-600">Baik</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">60-69</span>
                <span className="font-medium text-yellow-600">Cukup</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">0-59</span>
                <span className="font-medium text-red-600">Kurang</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}