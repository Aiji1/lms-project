'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Clock, BookOpen, Users } from 'lucide-react';
import { api } from '@/lib/api';

interface EditJadwalPelajaranPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface FormData {
  id_tahun_ajaran: string;
  id_mata_pelajaran: string;
  nik_guru: string;
  id_kelas: string;
  hari: string;
  jam_ke: string;
}

interface FormOptions {
  tahun_ajaran: Array<{id_tahun_ajaran: number, tahun_ajaran: string, semester: string, status: string}>;
  mata_pelajaran: Array<{id_mata_pelajaran: number, nama_mata_pelajaran: string, kode_mata_pelajaran: string, kategori: string, status: string}>;
  guru: Array<{nik_guru: string, nama_lengkap: string, jabatan: string, status: string}>;
  kelas: Array<{id_kelas: number, nama_kelas: string, tingkat: string, ruangan: string}>;
  hari: Array<{value: string, label: string}>;
  jam_ke: Array<{value: string, label: string}>;
}

export default function EditJadwalPelajaranPage({ params }: EditJadwalPelajaranPageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    tahun_ajaran: [],
    mata_pelajaran: [],
    guru: [],
    kelas: [],
    hari: [
      { value: 'Senin', label: 'Senin' },
      { value: 'Selasa', label: 'Selasa' },
      { value: 'Rabu', label: 'Rabu' },
      { value: 'Kamis', label: 'Kamis' },
      { value: 'Jumat', label: 'Jumat' }
    ],
    jam_ke: [
      { value: '1', label: 'Jam ke-1' },
      { value: '2', label: 'Jam ke-2' },
      { value: '3', label: 'Jam ke-3' },
      { value: '4', label: 'Jam ke-4' },
      { value: '5', label: 'Jam ke-5' },
      { value: '6', label: 'Jam ke-6' },
      { value: '7', label: 'Jam ke-7' },
      { value: '8', label: 'Jam ke-8' }
    ]
  });

  const [formData, setFormData] = useState<FormData>({
    id_tahun_ajaran: '',
    id_mata_pelajaran: '',
    nik_guru: '',
    id_kelas: '',
    hari: '',
    jam_ke: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    if (id) {
      fetchData();
      fetchFormOptions();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const response = await api.get(`/v1/jadwal-pelajaran/${id}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          id_tahun_ajaran: data.id_tahun_ajaran?.toString() || '',
          id_mata_pelajaran: data.id_mata_pelajaran?.toString() || '',
          nik_guru: data.nik_guru || '',
          id_kelas: data.id_kelas?.toString() || '',
          hari: data.hari || '',
          jam_ke: data.jam_ke?.toString() || ''
        });
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/jadwal-pelajaran');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/jadwal-pelajaran-form-data');
      if (response.data.success) {
        setFormOptions(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
      // Keep default options if API fails
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev: any) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormErrors({});

    try {
      // Convert string values to integers for backend validation
      const submitData = {
        ...formData,
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran),
        id_mata_pelajaran: parseInt(formData.id_mata_pelajaran),
        id_kelas: parseInt(formData.id_kelas),
        jam_ke: parseInt(formData.jam_ke)
      };

      const response = await api.put(`/v1/jadwal-pelajaran/${id}`, submitData);
      
      if (response.data.success) {
        alert('Jadwal pelajaran berhasil diperbarui!');
        router.push('/admin/jadwal-pelajaran');
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      } else {
        alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/jadwal-pelajaran"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Edit Jadwal Pelajaran
          </h1>
          <p className="text-gray-600">Perbarui jadwal pelajaran</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tahun Ajaran */}
            <div>
              <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <select
                id="id_tahun_ajaran"
                name="id_tahun_ajaran"
                value={formData.id_tahun_ajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Tahun Ajaran</option>
                {formOptions?.tahun_ajaran?.map((option, index) => (
                  <option key={`tahun-${option.id_tahun_ajaran || index}`} value={option.id_tahun_ajaran}>
                    {option.tahun_ajaran} - {option.semester}
                  </option>
                ))}
              </select>
              {formErrors.id_tahun_ajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id_tahun_ajaran[0]}</p>
              )}
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label htmlFor="id_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="inline h-4 w-4 mr-1" />
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                id="id_mata_pelajaran"
                name="id_mata_pelajaran"
                value={formData.id_mata_pelajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.id_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {formOptions?.mata_pelajaran?.map((option, index) => (
                  <option key={`mapel-${option.id_mata_pelajaran || index}`} value={option.id_mata_pelajaran}>
                    {option.nama_mata_pelajaran} ({option.kode_mata_pelajaran})
                  </option>
                ))}
              </select>
              {formErrors.id_mata_pelajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id_mata_pelajaran[0]}</p>
              )}
            </div>

            {/* Guru */}
            <div>
              <label htmlFor="nik_guru" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Guru <span className="text-red-500">*</span>
              </label>
              <select
                id="nik_guru"
                name="nik_guru"
                value={formData.nik_guru}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.nik_guru ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Guru</option>
                {formOptions?.guru?.map((option, index) => (
                  <option key={`guru-${option.nik_guru || index}`} value={option.nik_guru}>
                    {option.nama_lengkap} ({option.nik_guru})
                  </option>
                ))}
              </select>
              {formErrors.nik_guru && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nik_guru[0]}</p>
              )}
            </div>

            {/* Kelas */}
            <div>
              <label htmlFor="id_kelas" className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                id="id_kelas"
                name="id_kelas"
                value={formData.id_kelas}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.id_kelas ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Kelas</option>
                {formOptions?.kelas?.map((option, index) => (
                  <option key={`kelas-${option.id_kelas || index}`} value={option.id_kelas}>
                    {option.nama_kelas} - {option.ruangan}
                  </option>
                ))}
              </select>
              {formErrors.id_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id_kelas[0]}</p>
              )}
            </div>

            {/* Hari */}
            <div>
              <label htmlFor="hari" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Hari <span className="text-red-500">*</span>
              </label>
              <select
                id="hari"
                name="hari"
                value={formData.hari}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.hari ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Hari</option>
                {formOptions?.hari?.map((option, index) => (
                  <option key={`hari-${option.value || index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.hari && (
                <p className="mt-1 text-sm text-red-600">{formErrors.hari[0]}</p>
              )}
            </div>

            {/* Jam Ke */}
            <div>
              <label htmlFor="jam_ke" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Jam Ke <span className="text-red-500">*</span>
              </label>
              <select
                id="jam_ke"
                name="jam_ke"
                value={formData.jam_ke}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.jam_ke ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Jam Ke</option>
                {formOptions?.jam_ke?.map((option, index) => (
                  <option key={`jam-${option.value || index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.jam_ke && (
                <p className="mt-1 text-sm text-red-600">{formErrors.jam_ke[0]}</p>
              )}
            </div>
          </div>

          {/* Conflict Warning */}
          {(formData.hari && formData.jam_ke && (formData.id_kelas || formData.nik_guru)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Peringatan Konflik Jadwal
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Pastikan tidak ada konflik jadwal untuk kelas dan guru yang dipilih pada hari dan jam yang sama.
                      Sistem akan melakukan validasi saat menyimpan data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/jadwal-pelajaran"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Perbarui'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}