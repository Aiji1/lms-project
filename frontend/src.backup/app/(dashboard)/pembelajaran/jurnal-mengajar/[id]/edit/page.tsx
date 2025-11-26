'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, BookOpen, Calendar, User, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

interface JadwalPelajaran {
  id_jadwal: number;
  mata_pelajaran: string;
  kelas: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  nama_guru: string;
  nik_guru: string;
}

interface FormData {
  id_jadwal: string;
  tanggal: string;
  status_mengajar: 'Hadir' | 'Tidak_Hadir' | 'Diganti';
  materi_diajarkan: string;
  keterangan: string;
}

export default function EditJurnalMengajarPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  // Permission configuration
  const jurnalMengajarPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': VIEW_EDIT_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as any || 'Siswa', jurnalMengajarPermissions);

  const [formData, setFormData] = useState<FormData>({
    id_jadwal: '',
    tanggal: '',
    status_mengajar: 'Hadir',
    materi_diajarkan: '',
    keterangan: ''
  });

  const [jadwalOptions, setJadwalOptions] = useState<JadwalPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check permissions
  useEffect(() => {
    // Wait for user data to be loaded
    if (!user) {
      console.log('User not loaded yet, waiting...');
      return;
    }
    
    console.log('User permissions:', userPermissions);
    console.log('User role:', user?.user_type);
    console.log('Has edit permission:', userPermissions.edit);
    
    if (!userPermissions.edit) {
      console.log('Redirecting due to no edit permission');
      router.push('/pembelajaran/jurnal-mengajar');
      return;
    }
  }, [userPermissions, router, user]);

  useEffect(() => {
    if (id) {
      fetchJurnalMengajar();
      fetchJadwalOptions();
    }
  }, [id]);

  const fetchJurnalMengajar = async () => {
    try {
      const response = await api.get(`/v1/jurnal-mengajar/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          id_jadwal: data.id_jadwal.toString(),
          tanggal: data.tanggal.split('T')[0], // Format for date input
          status_mengajar: data.status_mengajar,
          materi_diajarkan: data.materi_diajarkan,
          keterangan: data.keterangan || ''
        });
      } else {
        router.push('/pembelajaran/jurnal-mengajar');
      }
    } catch (error) {
      console.error('Error fetching jurnal mengajar:', error);
      router.push('/pembelajaran/jurnal-mengajar');
    }
  };

  const fetchJadwalOptions = async () => {
    try {
      const response = await api.get('/v1/jurnal-mengajar-form-data');
      if (response.data.success) {
        setJadwalOptions(response.data.data.jadwal_pelajaran || []);
      }
    } catch (error) {
      console.error('Error fetching jadwal options:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_jadwal) {
      newErrors.id_jadwal = 'Jadwal pelajaran harus dipilih';
    }
    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }
    if (!formData.materi_diajarkan.trim()) {
      newErrors.materi_diajarkan = 'Materi yang diajarkan harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put(`/v1/jurnal-mengajar/${id}`, formData);
      
      if (response.data.success) {
        router.push(`/pembelajaran/jurnal-mengajar/${id}`);
      } else {
        alert(response.data.message || 'Gagal mengupdate jurnal mengajar');
      }
    } catch (error: any) {
      console.error('Error updating jurnal mengajar:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Terjadi kesalahan saat mengupdate jurnal mengajar');
      }
    } finally {
      setSubmitting(false);
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

  const getSelectedJadwal = () => {
    return jadwalOptions.find(jadwal => jadwal.id_jadwal.toString() === formData.id_jadwal);
  };

  if (loading) {
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/pembelajaran/jurnal-mengajar/${id}`}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Edit Jurnal Mengajar
          </h1>
          <p className="text-gray-600">Ubah informasi jurnal mengajar</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Informasi Jurnal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jadwal Pelajaran */}
              <div className="md:col-span-2">
                <label htmlFor="id_jadwal" className="block text-sm font-medium text-gray-700 mb-2">
                  Jadwal Pelajaran *
                </label>
                <select
                  id="id_jadwal"
                  name="id_jadwal"
                  value={formData.id_jadwal}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.id_jadwal ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Pilih Jadwal Pelajaran</option>
                  {jadwalOptions.map((jadwal) => (
                    <option key={jadwal.id_jadwal} value={jadwal.id_jadwal}>
                      {jadwal.mata_pelajaran} - {jadwal.kelas} ({jadwal.hari}, {jadwal.jam_mulai}-{jadwal.jam_selesai}) - {jadwal.nama_guru}
                    </option>
                  ))}
                </select>
                {errors.id_jadwal && (
                  <p className="mt-1 text-sm text-red-600">{errors.id_jadwal}</p>
                )}
              </div>

              {/* Selected Jadwal Info */}
              {getSelectedJadwal() && (
                <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Informasi Jadwal Terpilih:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Mata Pelajaran:</span>
                      <p className="text-blue-900">{getSelectedJadwal()?.mata_pelajaran}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Kelas:</span>
                      <p className="text-blue-900">{getSelectedJadwal()?.kelas}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Hari:</span>
                      <p className="text-blue-900">{getSelectedJadwal()?.hari}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Jam:</span>
                      <p className="text-blue-900">{getSelectedJadwal()?.jam_mulai} - {getSelectedJadwal()?.jam_selesai}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal */}
              <div>
                <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Tanggal Mengajar *
                </label>
                <input
                  type="date"
                  id="tanggal"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tanggal ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.tanggal && (
                  <p className="mt-1 text-sm text-red-600">{errors.tanggal}</p>
                )}
              </div>

              {/* Status Mengajar */}
              <div>
                <label htmlFor="status_mengajar" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Status Mengajar *
                </label>
                <select
                  id="status_mengajar"
                  name="status_mengajar"
                  value={formData.status_mengajar}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Tidak_Hadir">Tidak Hadir</option>
                  <option value="Diganti">Diganti</option>
                </select>
              </div>

              {/* Materi Diajarkan */}
              <div className="md:col-span-2">
                <label htmlFor="materi_diajarkan" className="block text-sm font-medium text-gray-700 mb-2">
                  Materi yang Diajarkan *
                </label>
                <textarea
                  id="materi_diajarkan"
                  name="materi_diajarkan"
                  value={formData.materi_diajarkan}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.materi_diajarkan ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jelaskan materi yang diajarkan pada pertemuan ini..."
                  required
                />
                {errors.materi_diajarkan && (
                  <p className="mt-1 text-sm text-red-600">{errors.materi_diajarkan}</p>
                )}
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Tambahan
                </label>
                <textarea
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Keterangan tambahan (opsional)..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href={`/pembelajaran/jurnal-mengajar/${id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}