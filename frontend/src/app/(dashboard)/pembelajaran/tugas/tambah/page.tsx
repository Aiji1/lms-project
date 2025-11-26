'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  Upload,
  Calendar,
  Users,
  BookOpen,
  User,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { createPermissionForRoles, getUserPermission, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

// Permission configuration
const tugasPermissions = mergePermissions(
  createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS)
);

interface FormData {
  id_mata_pelajaran: string;
  id_kelas: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  tanggal_pemberian: string;
  tanggal_deadline: string;
  tipe_tugas: 'Semua_Siswa' | 'Siswa_Terpilih';
  status: 'Aktif' | 'Non-aktif';
  file_tugas?: File | null;
  bobot_nilai?: string;
  keterangan?: string;
  siswa_terpilih?: string[];
}

interface FormOptions {
  mata_pelajaran: Array<{id_mata_pelajaran: number, nama_mata_pelajaran: string}>;
  kelas: Array<{id_kelas: number, nama_kelas: string}>;
  siswa: Array<{nis: string, nama_lengkap: string}>;
}

export default function TambahTugasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [userPermissions, setUserPermissions] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false
  });

  const [formData, setFormData] = useState<FormData>({
    id_mata_pelajaran: '',
    id_kelas: '',
    judul_tugas: '',
    deskripsi_tugas: '',
    tanggal_pemberian: new Date().toISOString().split('T')[0],
    tanggal_deadline: '',
    tipe_tugas: 'Semua_Siswa',
    status: 'Aktif',
    file_tugas: null,
    bobot_nilai: '',
    keterangan: '',
    siswa_terpilih: []
  });

  const [formOptions, setFormOptions] = useState<FormOptions>({
    mata_pelajaran: [],
    kelas: [],
    siswa: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('User data from localStorage:', userData);
    console.log('Token from localStorage:', token);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
        
        const permissions = getUserPermission(parsedUser.user_type as any, tugasPermissions);
        console.log('User permissions:', permissions);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });

        // Do not auto-set mata pelajaran from guru reference_id (NIK)
        // User must choose a valid mata pelajaran from options
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
      console.log('No user data found in localStorage, redirecting to login');
      // Do not create mock users here; enforce real authentication
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
    }
  }, []);

  useEffect(() => {
    if (user && userPermissions.create) {
      fetchFormOptions();
    }
  }, [user, userPermissions]);

  useEffect(() => {
    if (formData.id_kelas) {
      fetchSiswaByKelas();
    }
  }, [formData.id_kelas]);

  const fetchFormOptions = async () => {
    try {
      console.log('Fetching form options...');
      
      // Try to fetch from API first
      try {
        const response = await api.get('/tugas-form-data');
        console.log('Form options response:', response.data);

        if (response.data.success) {
          setFormOptions({
            mata_pelajaran: response.data.data.mata_pelajaran || [],
            kelas: response.data.data.kelas || [],
            siswa: []
          });
          console.log('API form options loaded successfully');
          return; // Exit early if API call succeeds
        }
      } catch (apiError: any) {
        console.log('API call failed, using mock data for development:', apiError.message);
      }
      
      // Fallback to mock data if API fails
      const mockFormOptions = {
        mata_pelajaran: [
          { id_mata_pelajaran: 1, nama_mata_pelajaran: 'Matematika' },
          { id_mata_pelajaran: 2, nama_mata_pelajaran: 'Bahasa Indonesia' },
          { id_mata_pelajaran: 3, nama_mata_pelajaran: 'Bahasa Inggris' },
          { id_mata_pelajaran: 4, nama_mata_pelajaran: 'Fisika' },
          { id_mata_pelajaran: 5, nama_mata_pelajaran: 'Kimia' },
          { id_mata_pelajaran: 6, nama_mata_pelajaran: 'Biologi' }
        ],
        kelas: [
          { id_kelas: 1, nama_kelas: 'X IPA 1' },
          { id_kelas: 2, nama_kelas: 'X IPA 2' },
          { id_kelas: 3, nama_kelas: 'X IPS 1' },
          { id_kelas: 4, nama_kelas: 'XI IPA 1' },
          { id_kelas: 5, nama_kelas: 'XI IPA 2' },
          { id_kelas: 6, nama_kelas: 'XII IPA 1' }
        ],
        siswa: []
      };
      
      setFormOptions(mockFormOptions);
      console.log('Mock form options loaded successfully');
    } catch (error: any) {
      console.error('Error in fetchFormOptions:', error);
    }
  };

  const fetchSiswaByKelas = async () => {
    try {
      const response = await api.get(`/v1/tugas/siswa/${formData.id_kelas}`);
      setFormOptions(prev => ({
        ...prev,
        siswa: response.data.data || []
      }));
    } catch (error) {
      console.error('Error fetching siswa:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_mata_pelajaran) newErrors.id_mata_pelajaran = 'Mata pelajaran harus dipilih';
    if (!formData.id_kelas) newErrors.id_kelas = 'Kelas harus dipilih';
    if (!formData.judul_tugas.trim()) newErrors.judul_tugas = 'Judul tugas harus diisi';
    if (!formData.deskripsi_tugas.trim()) newErrors.deskripsi_tugas = 'Deskripsi tugas harus diisi';
    if (!formData.tanggal_deadline) newErrors.tanggal_deadline = 'Tanggal deadline harus diisi';

    // Validate deadline is after pemberian
    if (formData.tanggal_deadline && formData.tanggal_pemberian) {
      const pemberian = new Date(formData.tanggal_pemberian);
      const deadline = new Date(formData.tanggal_deadline);
      if (deadline <= pemberian) {
        newErrors.tanggal_deadline = 'Tanggal deadline harus setelah tanggal pemberian';
      }
    }

    // Validate siswa terpilih if tipe is Siswa_Terpilih
    if (formData.tipe_tugas === 'Siswa_Terpilih' && (!formData.siswa_terpilih || formData.siswa_terpilih.length === 0)) {
      newErrors.siswa_terpilih = 'Minimal pilih satu siswa';
    }

    // Validate bobot nilai if provided
    if (formData.bobot_nilai && (isNaN(Number(formData.bobot_nilai)) || Number(formData.bobot_nilai) < 0 || Number(formData.bobot_nilai) > 100)) {
      newErrors.bobot_nilai = 'Bobot nilai harus berupa angka antara 0-100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file_tugas: file }));
  };

  const handleSiswaChange = (nis: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      siswa_terpilih: checked 
        ? [...(prev.siswa_terpilih || []), nis]
        : (prev.siswa_terpilih || []).filter(s => s !== nis)
    }));

    if (errors.siswa_terpilih) {
      setErrors(prev => ({ ...prev, siswa_terpilih: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'file_tugas' && value instanceof File) {
          submitData.append(key, value);
        } else if (key === 'siswa_terpilih' && Array.isArray(value)) {
          value.forEach(nis => submitData.append('siswa_terpilih[]', nis));
        } else if (value !== null && value !== undefined && key !== 'file_tugas' && key !== 'siswa_terpilih') {
          submitData.append(key, value.toString());
        }
      });

      console.log('Submitting tugas data...');
      const response = await api.post('/tugas', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response:', response.data);
      
      // Only redirect if success
      if (response?.data?.success) {
        console.log('Task created successfully, redirecting...');
        router.push('/pembelajaran/tugas');
      } else {
        console.error('Unexpected response format:', response.data);
        setErrors({ general: 'Format respons server tidak sesuai' });
      }
    } catch (error: any) {
      console.error('Error creating tugas:', error);
      console.error('Response data:', error.response?.data);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan saat menyimpan data' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userPermissions.create) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Akses Ditolak</h3>
          <p className="mt-1 text-sm text-gray-500">Anda tidak memiliki izin untuk menambah tugas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <Link
                href="/pembelajaran/tugas"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Kembali
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 flex items-center">
              <FileText className="mr-3 text-blue-600" />
              Tambah Tugas Baru
            </h1>
            <p className="text-gray-600 mt-2">
              Buat tugas baru untuk siswa
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 text-gray-600 mr-2" />
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guru */}
              {/* Mata Pelajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_mata_pelajaran"
                  value={formData.id_mata_pelajaran}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.id_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {formOptions.mata_pelajaran.map(mapel => (
                    <option key={mapel.id_mata_pelajaran} value={mapel.id_mata_pelajaran}>
                      {mapel.nama_mata_pelajaran}
                    </option>
                  ))}
                </select>
                {errors.id_mata_pelajaran && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.id_mata_pelajaran}
                  </p>
                )}
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_kelas"
                  value={formData.id_kelas}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.id_kelas ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Kelas</option>
                  {formOptions.kelas.map(kelas => (
                    <option key={kelas.id_kelas} value={kelas.id_kelas}>
                      {kelas.nama_kelas}
                    </option>
                  ))}
                </select>
                {errors.id_kelas && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.id_kelas}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-gray-600 mr-2" />
              Detail Tugas
            </h3>
            <div className="space-y-6">
              {/* Judul Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="judul_tugas"
                  value={formData.judul_tugas}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.judul_tugas ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan judul tugas"
                />
                {errors.judul_tugas && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.judul_tugas}
                  </p>
                )}
              </div>

              {/* Deskripsi Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Tugas <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="deskripsi_tugas"
                  value={formData.deskripsi_tugas}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deskripsi_tugas ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan deskripsi tugas"
                />
                {errors.deskripsi_tugas && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.deskripsi_tugas}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Pemberian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggal_pemberian"
                    value={formData.tanggal_pemberian}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="tanggal_deadline"
                    value={formData.tanggal_deadline}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.tanggal_deadline ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tanggal_deadline && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.tanggal_deadline}
                    </p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Tugas (Opsional)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File
                  </label>
                  {formData.file_tugas && (
                    <span className="text-sm text-gray-600">
                      {formData.file_tugas.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Format yang didukung: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, JPEG, PNG (Max: 10MB)
                </p>
              </div>

              {/* Bobot Nilai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bobot Nilai (0-100)
                </label>
                <input
                  type="number"
                  name="bobot_nilai"
                  value={formData.bobot_nilai}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.bobot_nilai ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan bobot nilai"
                />
                {errors.bobot_nilai && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bobot_nilai}
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan keterangan tambahan"
                />
              </div>
            </div>
          </div>

          {/* Target Siswa */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 text-gray-600 mr-2" />
              Target Siswa
            </h3>
            <div className="space-y-4">
              {/* Tipe Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Tugas
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipe_tugas"
                      value="Semua_Siswa"
                      checked={formData.tipe_tugas === 'Semua_Siswa'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Semua Siswa di Kelas</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipe_tugas"
                      value="Siswa_Terpilih"
                      checked={formData.tipe_tugas === 'Siswa_Terpilih'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Siswa Terpilih</span>
                  </label>
                </div>
              </div>

              {/* Siswa Terpilih */}
              {formData.tipe_tugas === 'Siswa_Terpilih' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Siswa <span className="text-red-500">*</span>
                  </label>
                  {formOptions.siswa.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                      {formOptions.siswa.map(siswa => (
                        <label key={siswa.nis} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.siswa_terpilih?.includes(siswa.nis) || false}
                            onChange={(e) => handleSiswaChange(siswa.nis, e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{siswa.nama_lengkap}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      {formData.id_kelas ? 'Tidak ada siswa di kelas ini' : 'Pilih kelas terlebih dahulu'}
                    </p>
                  )}
                  {errors.siswa_terpilih && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.siswa_terpilih}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/pembelajaran/tugas"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Tugas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}