'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Calendar,
  Clock,
  Users,
  FileText,
  Upload,
  X,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { createPermissionForRoles, getUserPermission, mergePermissions } from '@/lib/permissions';
import { fetchMergedOverrides, mergeItemPermissions } from '@/lib/permissionOverrides';
import { useAuth } from '@/hooks/useAuth';
import { FULL_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

// Base permission configuration
const baseTugasPermissions = mergePermissions(
  createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS)
);

interface FormData {
  judul_tugas: string;
  deskripsi_tugas: string;
  id_mata_pelajaran: string;
  id_kelas: string;
  id_tahun_ajaran: string;
  tanggal_diberikan: string;
  tanggal_deadline: string;
  jenis_tugas: 'Individu' | 'Kelompok' | 'Proyek' | 'Ujian' | 'Kuis';
  bobot_nilai: string;
  status_tugas: 'Aktif' | 'Selesai' | 'Dibatalkan';
  siswa_terpilih: string[];
}

interface FormOptions {
  mataPelajaran: Array<{id_mata_pelajaran: number, nama_mata_pelajaran: string}>;
  kelas: Array<{id_kelas: number, nama_kelas: string}>;
  tahunAjaran: Array<{id_tahun_ajaran: number, tahun_ajaran: string}>;
  siswa: Array<{nis: string, nama_siswa: string}>;
}

interface Tugas {
  id_tugas: number;
  judul_tugas: string;
  deskripsi_tugas: string;
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  id_kelas: number;
  nama_kelas: string;
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  nik_guru: string;
  nama_guru: string;
  tanggal_diberikan: string;
  tanggal_deadline: string;
  jenis_tugas: 'Individu' | 'Kelompok' | 'Proyek' | 'Ujian' | 'Kuis';
  bobot_nilai: number;
  status_tugas: 'Aktif' | 'Selesai' | 'Dibatalkan';
  file_tugas?: string;
  siswa_terpilih?: Array<{nis: string, nama_siswa: string}>;
  created_at: string;
  updated_at: string;
}

export default function EditTugasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<{ role?: string, nik?: string } | null>(null);
  const [userPermissions, setUserPermissions] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false
  });
  const { userRole } = useAuth();

  const [tugas, setTugas] = useState<Tugas | null>(null);
  const [formData, setFormData] = useState<FormData>({
    judul_tugas: '',
    deskripsi_tugas: '',
    id_mata_pelajaran: '',
    id_kelas: '',
    id_tahun_ajaran: '',
    tanggal_diberikan: '',
    tanggal_deadline: '',
    jenis_tugas: 'Individu',
    bobot_nilai: '',
    status_tugas: 'Aktif',
    siswa_terpilih: []
  });

  const [formOptions, setFormOptions] = useState<FormOptions>({
    mataPelajaran: [],
    kelas: [],
    tahunAjaran: [],
    siswa: []
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initPermissions = async () => {
      try {
        const userData = localStorage.getItem('user');
        let userId: string | undefined = undefined;
        let role = userRole;
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          userId = parsedUser?.id || parsedUser?.user_id || undefined;
          // Fallback to parsedUser.user_type if userRole not yet
          if (!role && parsedUser?.user_type) role = parsedUser.user_type;
        }
        if (!role) return;
        const overrides = await fetchMergedOverrides({ role, user_id: userId });
        const merged = mergeItemPermissions(baseTugasPermissions, overrides, 'pembelajaran.tugas');
        const permissions = getUserPermission(role as any, merged);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });
      } catch (e) {
        const role = userRole as any;
        const permissions = getUserPermission(role, baseTugasPermissions);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });
      }
    };
    initPermissions();
  }, [userRole]);

  useEffect(() => {
    if (user && userPermissions.edit) {
      fetchTugas();
      fetchFormOptions();
    }
  }, [id, user, userPermissions]);

  const fetchTugas = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get(`/v1/tugas/${id}`);
      const tugasData = response.data.data;
      setTugas(tugasData);
      
      // Populate form with existing data
      setFormData({
        judul_tugas: tugasData.judul_tugas,
        deskripsi_tugas: tugasData.deskripsi_tugas,
        id_mata_pelajaran: tugasData.id_mata_pelajaran.toString(),
        id_kelas: tugasData.id_kelas.toString(),
        id_tahun_ajaran: tugasData.id_tahun_ajaran.toString(),
        tanggal_diberikan: tugasData.tanggal_diberikan,
        tanggal_deadline: tugasData.tanggal_deadline,
        jenis_tugas: tugasData.jenis_tugas,
        bobot_nilai: String(tugasData?.bobot_nilai ?? ''),
        status_tugas: tugasData.status_tugas,
        siswa_terpilih: Array.isArray(tugasData?.siswa_terpilih) 
          ? tugasData.siswa_terpilih.map((s: any) => s.nis) 
          : []
      });
    } catch (error) {
      console.error('Error fetching tugas:', error);
      router.push('/pembelajaran/tugas');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [guruResponse, kelasResponse, tahunResponse] = await Promise.all([
        api.get('/guru-form-data'),
        // Use kelas index endpoint to get actual kelas list (array)
        api.get('/kelas', { params: { per_page: 200 } }),
        api.get('/tahun-ajaran-form-data')
      ]);

      const kelasData = Array.isArray(kelasResponse?.data?.data)
        ? kelasResponse.data.data
        : Array.isArray(kelasResponse?.data?.data?.data)
          ? kelasResponse.data.data.data
          : [];

      setFormOptions({
        mataPelajaran: Array.isArray(guruResponse?.data?.data?.mata_pelajaran)
          ? guruResponse.data.data.mata_pelajaran
          : [],
        kelas: kelasData,
        tahunAjaran: Array.isArray(tahunResponse?.data?.data)
          ? tahunResponse.data.data
          : [],
        siswa: []
      });
    } catch (error) {
      console.error('Error fetching form options:', error);
      // Keep existing options if API fails
      setFormOptions(prev => ({
        mataPelajaran: Array.isArray(prev.mataPelajaran) ? prev.mataPelajaran : [],
        kelas: Array.isArray(prev.kelas) ? prev.kelas : [],
        tahunAjaran: Array.isArray(prev.tahunAjaran) ? prev.tahunAjaran : [],
        siswa: Array.isArray(prev.siswa) ? prev.siswa : []
      }));
    }
  };

  const fetchSiswaByKelas = async (idKelas: string) => {
    if (!idKelas) return;
    
    try {
      const response = await api.get(`/v1/siswa-by-kelas/${idKelas}`);
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

    if (!formData.judul_tugas.trim()) newErrors.judul_tugas = 'Judul tugas harus diisi';
    if (!formData.deskripsi_tugas.trim()) newErrors.deskripsi_tugas = 'Deskripsi tugas harus diisi';
    if (!formData.id_mata_pelajaran) newErrors.id_mata_pelajaran = 'Mata pelajaran harus dipilih';
    if (!formData.id_kelas) newErrors.id_kelas = 'Kelas harus dipilih';
    if (!formData.id_tahun_ajaran) newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';
    if (!formData.tanggal_diberikan) newErrors.tanggal_diberikan = 'Tanggal diberikan harus diisi';
    if (!formData.tanggal_deadline) newErrors.tanggal_deadline = 'Tanggal deadline harus diisi';
    if (!formData.bobot_nilai) newErrors.bobot_nilai = 'Bobot nilai harus diisi';
    if (formData.siswa_terpilih.length === 0) newErrors.siswa_terpilih = 'Minimal satu siswa harus dipilih';

    // Validate dates
    if (formData.tanggal_diberikan && formData.tanggal_deadline) {
      const diberikan = new Date(formData.tanggal_diberikan);
      const deadline = new Date(formData.tanggal_deadline);
      if (deadline <= diberikan) {
        newErrors.tanggal_deadline = 'Tanggal deadline harus setelah tanggal diberikan';
      }
    }

    // Validate bobot nilai
    const bobot = parseFloat(formData.bobot_nilai);
    if (isNaN(bobot) || bobot < 0 || bobot > 100) {
      newErrors.bobot_nilai = 'Bobot nilai harus antara 0-100';
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

    // Fetch siswa when kelas changes
    if (name === 'id_kelas') {
      fetchSiswaByKelas(value);
      setFormData(prev => ({ ...prev, siswa_terpilih: [] }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'Ukuran file maksimal 10MB' }));
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG' }));
        return;
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleSiswaSelection = (nis: string) => {
    setFormData(prev => ({
      ...prev,
      siswa_terpilih: prev.siswa_terpilih.includes(nis)
        ? prev.siswa_terpilih.filter(s => s !== nis)
        : [...prev.siswa_terpilih, nis]
    }));
    
    if (errors.siswa_terpilih) {
      setErrors(prev => ({ ...prev, siswa_terpilih: '' }));
    }
  };

  const handleSelectAllSiswa = () => {
    const allNis = formOptions.siswa.map(s => s.nis);
    setFormData(prev => ({
      ...prev,
      siswa_terpilih: prev.siswa_terpilih.length === allNis.length ? [] : allNis
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'siswa_terpilih') {
          submitData.append(key, JSON.stringify(value));
        } else {
          submitData.append(key, value.toString());
        }
      });

      // Append file if selected
      if (selectedFile) {
        submitData.append('file_tugas', selectedFile);
      }

      await api.put(`/v1/tugas/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      router.push('/pembelajaran/tugas');
    } catch (error: any) {
      console.error('Error updating tugas:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userPermissions.edit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Akses Ditolak</h3>
          <p className="mt-1 text-sm text-gray-500">Anda tidak memiliki izin untuk mengedit tugas.</p>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tugas tidak ditemukan</h3>
          <p className="mt-1 text-sm text-gray-500">Tugas yang Anda cari tidak ada atau telah dihapus.</p>
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
              <BookOpen className="mr-3 text-blue-600" />
              Edit Tugas
            </h1>
            <p className="text-gray-600 mt-2">
              Edit tugas: {tugas.judul_tugas}
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
              <FileText className="h-5 w-5 text-gray-600 mr-2" />
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Judul Tugas */}
              <div className="md:col-span-2">
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
                  {formOptions.mataPelajaran.map(mapel => (
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
                  {(Array.isArray(formOptions.kelas) ? formOptions.kelas : []).map(kelas => (
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

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_tahun_ajaran"
                  value={formData.id_tahun_ajaran}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {formOptions.tahunAjaran.map(tahun => (
                    <option key={tahun.id_tahun_ajaran} value={tahun.id_tahun_ajaran}>
                      {tahun.tahun_ajaran}
                    </option>
                  ))}
                </select>
                {errors.id_tahun_ajaran && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.id_tahun_ajaran}
                  </p>
                )}
              </div>

              {/* Jenis Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Tugas
                </label>
                <select
                  name="jenis_tugas"
                  value={formData.jenis_tugas}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Individu">Individu</option>
                  <option value="Kelompok">Kelompok</option>
                  <option value="Proyek">Proyek</option>
                  <option value="Ujian">Ujian</option>
                  <option value="Kuis">Kuis</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
              Jadwal Tugas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tanggal Diberikan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Diberikan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_diberikan"
                  value={formData.tanggal_diberikan}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tanggal_diberikan ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_diberikan && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.tanggal_diberikan}
                  </p>
                )}
              </div>

              {/* Tanggal Deadline */}
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

              {/* Bobot Nilai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bobot Nilai (%) <span className="text-red-500">*</span>
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
                  placeholder="0-100"
                />
                {errors.bobot_nilai && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.bobot_nilai}
                  </p>
                )}
              </div>

              {/* Status Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Tugas
                </label>
                <select
                  name="status_tugas"
                  value={formData.status_tugas}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-gray-600 mr-2" />
              Deskripsi Tugas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Tugas <span className="text-red-500">*</span>
              </label>
              <textarea
                name="deskripsi_tugas"
                value={formData.deskripsi_tugas}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deskripsi_tugas ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan deskripsi tugas secara detail"
              />
              {errors.deskripsi_tugas && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.deskripsi_tugas}
                </p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Upload className="h-5 w-5 text-gray-600 mr-2" />
              File Tugas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File Tugas (Opsional)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Format yang didukung: PDF, DOC, DOCX, JPG, PNG. Maksimal 10MB.
              </p>
              {tugas.file_tugas && (
                <p className="mt-2 text-sm text-blue-600">
                  File saat ini: {tugas.file_tugas}
                </p>
              )}
              {errors.file && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.file}
                </p>
              )}
            </div>
          </div>

          {/* Student Selection */}
          {formOptions.siswa.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 text-gray-600 mr-2" />
                Pilih Siswa
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Siswa yang Mengerjakan Tugas <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllSiswa}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {formData.siswa_terpilih.length === formOptions.siswa.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {formOptions.siswa.map(siswa => (
                      <label key={siswa.nis} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.siswa_terpilih.includes(siswa.nis)}
                          onChange={() => handleSiswaSelection(siswa.nis)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {siswa.nama_siswa} ({siswa.nis})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500">
                  {formData.siswa_terpilih.length} dari {formOptions.siswa.length} siswa dipilih
                </p>
                
                {errors.siswa_terpilih && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.siswa_terpilih}
                  </p>
                )}
              </div>
            </div>
          )}

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
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}