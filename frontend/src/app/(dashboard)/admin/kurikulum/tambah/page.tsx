'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  id_tahun_ajaran: string;
  id_mata_pelajaran: string;
  tingkat_kelas: string;
  rombel: string;
  status: 'Aktif' | 'Non-aktif' | '';
  sks_jam_perminggu: string;
}

interface FormOptions {
  tahun_ajaran: Array<{id_tahun_ajaran: number, tahun_ajaran: string, semester: string, status: string}>;
  mata_pelajaran: Array<{id_mata_pelajaran: number, nama_mata_pelajaran: string, kode_mata_pelajaran: string, kategori: string, status: string}>;
  tingkat_kelas: Array<{value: string, label: string}>;
  rombel: Array<{value: string, label: string}>;
  status: Array<{value: string, label: string}>;
}

export default function TambahKurikulumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    tahun_ajaran: [],
    mata_pelajaran: [],
    tingkat_kelas: [
      { value: '10', label: 'Kelas 10' },
      { value: '11', label: 'Kelas 11' },
      { value: '12', label: 'Kelas 12' }
    ],
    rombel: [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' },
      { value: '4', label: '4' }
    ],
    status: [
      { value: 'Aktif', label: 'Aktif' },
      { value: 'Non-aktif', label: 'Non-aktif' }
    ]
  });

  const [formData, setFormData] = useState<FormData>({
    id_tahun_ajaran: '',
    id_mata_pelajaran: '',
    tingkat_kelas: '',
    rombel: '',
    status: '',
    sks_jam_perminggu: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await api.get('/v1/kurikulum-form-data');
      if (response.data.success) {
        setFormOptions(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
      // Keep default options if API fails
    } finally {
      setOptionsLoading(false);
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
        sks_jam_perminggu: formData.sks_jam_perminggu ? parseInt(formData.sks_jam_perminggu) : null
      };

      const response = await api.post('/v1/kurikulum', submitData);
      
      if (response.data.success) {
        alert('Kurikulum berhasil ditambahkan!');
        router.push('/admin/kurikulum');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/kurikulum"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Kurikulum</h1>
          <p className="text-gray-600">Tambah data kurikulum baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tahun Ajaran */}
            <div>
              <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
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
                disabled={optionsLoading}
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
                disabled={optionsLoading}
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

            {/* Tingkat Kelas */}
            <div>
              <label htmlFor="tingkat_kelas" className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat Kelas <span className="text-red-500">*</span>
              </label>
              <select
                id="tingkat_kelas"
                name="tingkat_kelas"
                value={formData.tingkat_kelas}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.tingkat_kelas ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Tingkat Kelas</option>
                {formOptions?.tingkat_kelas?.map((option, index) => (
                  <option key={`tingkat-${option.value || index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.tingkat_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tingkat_kelas[0]}</p>
              )}
            </div>

            {/* Rombel */}
            <div>
              <label htmlFor="rombel" className="block text-sm font-medium text-gray-700 mb-2">
                Rombel <span className="text-red-500">*</span>
              </label>
              <select
                id="rombel"
                name="rombel"
                value={formData.rombel}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.rombel ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Rombel</option>
                {formOptions?.rombel?.map((option, index) => (
                  <option key={`rombel-${option.value || index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.rombel && (
                <p className="mt-1 text-sm text-red-600">{formErrors.rombel[0]}</p>
              )}
            </div>

            {/* SKS/Jam Per Minggu */}
            <div>
              <label htmlFor="sks_jam_perminggu" className="block text-sm font-medium text-gray-700 mb-2">
                SKS/Jam Per Minggu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="sks_jam_perminggu"
                name="sks_jam_perminggu"
                value={formData.sks_jam_perminggu}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.sks_jam_perminggu ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan jumlah SKS/jam per minggu"
                min="1"
              />
              {formErrors.sks_jam_perminggu && (
                <p className="mt-1 text-sm text-red-600">{formErrors.sks_jam_perminggu[0]}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Status</option>
                {formOptions?.status?.map((option, index) => (
                  <option key={`status-${option.value || index}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.status && (
                <p className="mt-1 text-sm text-red-600">{formErrors.status[0]}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/kurikulum"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading || optionsLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}