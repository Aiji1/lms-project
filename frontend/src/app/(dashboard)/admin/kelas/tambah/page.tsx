'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  ruangan: string;
  nama_kelas: string;
  tingkat: string;
  id_jurusan: string;
  id_tahun_ajaran: string;
  kapasitas_maksimal: string;
  wali_kelas: string;
}

interface FormOptions {
  ruangan_options: Array<{value: string, label: string}>;
  tingkat_options: Array<{value: string, label: string}>;
  jurusan_options: Array<{value: string, label: string}>;
  tahun_ajaran_options: Array<{value: string, label: string}>;
  guru_options: Array<{value: string, label: string}>;
}

export default function TambahKelasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    ruangan_options: [],
    tingkat_options: [],
    jurusan_options: [],
    tahun_ajaran_options: [],
    guru_options: []
  });

  const [formData, setFormData] = useState<FormData>({
    ruangan: '',
    nama_kelas: '',
    tingkat: '',
    id_jurusan: '',
    id_tahun_ajaran: '',
    kapasitas_maksimal: '',
    wali_kelas: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/kelas-form-data');
      if (response.data.success) {
        setFormOptions(response.data.data);
        
        // Auto-select active academic year (since API only returns active ones)
        const tahunAjaranOptions = response.data.data.tahun_ajaran_options;
        if (tahunAjaranOptions && tahunAjaranOptions.length > 0) {
          setFormData(prev => ({
            ...prev,
            id_tahun_ajaran: tahunAjaranOptions[0].value
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
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
        id_jurusan: parseInt(formData.id_jurusan),
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran),
        kapasitas_maksimal: parseInt(formData.kapasitas_maksimal)
      };

      const response = await api.post('/kelas', submitData);
      
      if (response.data.success) {
        alert('Kelas berhasil ditambahkan!');
        router.push('/admin/kelas');
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
          href="/admin/kelas"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Kelas</h1>
          <p className="text-gray-600">Tambahkan data kelas baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ruangan */}
            <div>
              <label htmlFor="ruangan" className="block text-sm font-medium text-gray-700 mb-2">
                Ruangan <span className="text-red-500">*</span>
              </label>
              <select
                id="ruangan"
                name="ruangan"
                value={formData.ruangan}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.ruangan ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Pilih Ruangan</option>
                {formOptions.ruangan_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.ruangan && (
                <p className="mt-1 text-sm text-red-600">{formErrors.ruangan[0]}</p>
              )}
            </div>

            {/* Nama Kelas */}
            <div>
              <label htmlFor="nama_kelas" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nama_kelas"
                name="nama_kelas"
                value={formData.nama_kelas}
                onChange={handleInputChange}
                placeholder="Contoh: XE1, XI.F1, XII.A1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.nama_kelas ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.nama_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nama_kelas[0]}</p>
              )}
            </div>

            {/* Tingkat */}
            <div>
              <label htmlFor="tingkat" className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat <span className="text-red-500">*</span>
              </label>
              <select
                id="tingkat"
                name="tingkat"
                value={formData.tingkat}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.tingkat ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Pilih Tingkat</option>
                {formOptions.tingkat_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.tingkat && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tingkat[0]}</p>
              )}
            </div>

            {/* Jurusan */}
            <div>
              <label htmlFor="id_jurusan" className="block text-sm font-medium text-gray-700 mb-2">
                Jurusan <span className="text-red-500">*</span>
              </label>
              <select
                id="id_jurusan"
                name="id_jurusan"
                value={formData.id_jurusan}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.id_jurusan ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Pilih Jurusan</option>
                {formOptions.jurusan_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.id_jurusan && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id_jurusan[0]}</p>
              )}
            </div>

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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Pilih Tahun Ajaran</option>
                {formOptions.tahun_ajaran_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.id_tahun_ajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id_tahun_ajaran[0]}</p>
              )}
            </div>

            {/* Kapasitas Maksimal */}
            <div>
              <label htmlFor="kapasitas_maksimal" className="block text-sm font-medium text-gray-700 mb-2">
                Kapasitas Maksimal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="kapasitas_maksimal"
                name="kapasitas_maksimal"
                value={formData.kapasitas_maksimal}
                onChange={handleInputChange}
                min="1"
                max="50"
                placeholder="Contoh: 30"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.kapasitas_maksimal ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {formErrors.kapasitas_maksimal && (
                <p className="mt-1 text-sm text-red-600">{formErrors.kapasitas_maksimal[0]}</p>
              )}
            </div>

            {/* Wali Kelas */}
            <div className="md:col-span-2">
              <label htmlFor="wali_kelas" className="block text-sm font-medium text-gray-700 mb-2">
                Wali Kelas
              </label>
              <select
                id="wali_kelas"
                name="wali_kelas"
                value={formData.wali_kelas}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.wali_kelas ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Wali Kelas (Opsional)</option>
                {formOptions.guru_options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.wali_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.wali_kelas[0]}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/kelas"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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