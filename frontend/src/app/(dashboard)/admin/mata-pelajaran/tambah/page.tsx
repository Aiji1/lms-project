'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: 'Wajib' | 'Umum' | 'Peminatan' | 'TL' | 'Agama' | 'Mulok' | '';
  status: 'Aktif' | 'Non-aktif' | '';
}

interface FormOptions {
  kategori_options: Array<{value: string, label: string}>;
  status_options: Array<{value: string, label: string}>;
}

export default function TambahMataPelajaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    kategori_options: [
      { value: 'Wajib', label: 'Wajib' },
      { value: 'Umum', label: 'Umum' },
      { value: 'Peminatan', label: 'Peminatan' },
      { value: 'TL', label: 'TL' },
      { value: 'Agama', label: 'Agama' },
      { value: 'Mulok', label: 'Mulok' }
    ],
    status_options: [
      { value: 'Aktif', label: 'Aktif' },
      { value: 'Non-aktif', label: 'Non-aktif' }
    ]
  });

  const [formData, setFormData] = useState<FormData>({
    nama_mata_pelajaran: '',
    kode_mata_pelajaran: '',
    kategori: '',
    status: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      setOptionsLoading(true);
      const response = await api.get('/mata-pelajaran-form-data');
      if (response.data.success) {
        setFormOptions(response.data.data);
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
      const response = await api.post('/mata-pelajaran', formData);
      
      if (response.data.success) {
        alert('Mata pelajaran berhasil ditambahkan!');
        router.push('/admin/mata-pelajaran');
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
          href="/admin/mata-pelajaran"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Mata Pelajaran</h1>
          <p className="text-gray-600">Tambah data mata pelajaran baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Mata Pelajaran */}
            <div>
              <label htmlFor="nama_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nama_mata_pelajaran"
                name="nama_mata_pelajaran"
                value={formData.nama_mata_pelajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.nama_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama mata pelajaran"
              />
              {formErrors.nama_mata_pelajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nama_mata_pelajaran[0]}</p>
              )}
            </div>

            {/* Kode Mata Pelajaran */}
            <div>
              <label htmlFor="kode_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                Kode Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="kode_mata_pelajaran"
                name="kode_mata_pelajaran"
                value={formData.kode_mata_pelajaran}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.kode_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan kode mata pelajaran"
              />
              {formErrors.kode_mata_pelajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.kode_mata_pelajaran[0]}</p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="kategori"
                name="kategori"
                value={formData.kategori}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.kategori ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Kategori</option>
                {formOptions?.kategori_options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.kategori && (
                <p className="mt-1 text-sm text-red-600">{formErrors.kategori[0]}</p>
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
                {formOptions?.status_options?.map((option) => (
                  <option key={option.value} value={option.value}>
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
              href="/admin/mata-pelajaran"
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
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}