'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  nama_jurusan: string;
  status: 'Aktif' | 'Non-aktif' | '';
}

interface FormOptions {
  jurusan_options: Array<{value: string, label: string}>;
  status_options: Array<{value: string, label: string}>;
}

export default function TambahJurusanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    jurusan_options: [],
    status_options: []
  });

  const [formData, setFormData] = useState<FormData>({
    nama_jurusan: '',
    status: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/v1/jurusan-form-data');
      if (response.data.success) {
        setFormOptions(response.data.data);
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
      const response = await api.post('/v1/jurusan', formData);
      
      if (response.data.success) {
        alert('Jurusan berhasil ditambahkan!');
        router.push('/admin/jurusan');
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
          href="/admin/jurusan"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Jurusan</h1>
          <p className="text-gray-600">Tambah data master jurusan baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Jurusan</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Jurusan */}
            <div>
              <label htmlFor="nama_jurusan" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Jurusan *
              </label>
              <input
                type="text"
                id="nama_jurusan"
                name="nama_jurusan"
                value={formData.nama_jurusan}
                onChange={handleInputChange}
                placeholder="Masukkan nama jurusan"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.nama_jurusan && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nama_jurusan[0]}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Masukkan nama jurusan baru (contoh: Tahfizh, Digital, IPA, dll)
              </p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Status</option>
                {formOptions.status_options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.status && (
                <p className="mt-1 text-sm text-red-600">{formErrors.status[0]}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Status aktif/non-aktif untuk jurusan ini
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/jurusan"
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Jurusan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}