'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  tahun_ajaran: string;
  semester: 'Ganjil' | 'Genap' | '';
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'Aktif' | 'Non-aktif' | '';
}

interface FormOptions {
  semester_options: Array<{value: string, label: string}>;
  status_options: Array<{value: string, label: string}>;
}

export default function TambahTahunAjaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    semester_options: [],
    status_options: []
  });

  const [formData, setFormData] = useState<FormData>({
    tahun_ajaran: '',
    semester: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: ''
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/v1/tahun-ajaran-form-data');
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
      const response = await api.post('/v1/tahun-ajaran', formData);
      
      if (response.data.success) {
        alert('Tahun ajaran berhasil ditambahkan!');
        router.push('/admin/tahun-ajaran');
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
          href="/admin/tahun-ajaran"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Tahun Ajaran</h1>
          <p className="text-gray-600">Tambah data tahun ajaran baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Tahun Ajaran</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tahun Ajaran */}
            <div>
              <label htmlFor="tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
                Tahun Ajaran *
              </label>
              <input
                type="text"
                id="tahun_ajaran"
                name="tahun_ajaran"
                value={formData.tahun_ajaran}
                onChange={handleInputChange}
                placeholder="2025/2026"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.tahun_ajaran && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tahun_ajaran[0]}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Format: YYYY/YYYY (contoh: 2025/2026)
              </p>
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Semester</option>
                {formOptions.semester_options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.semester && (
                <p className="mt-1 text-sm text-red-600">{formErrors.semester[0]}</p>
              )}
            </div>

            {/* Tanggal Mulai */}
            <div>
              <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai *
              </label>
              <input
                type="date"
                id="tanggal_mulai"
                name="tanggal_mulai"
                value={formData.tanggal_mulai}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.tanggal_mulai && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tanggal_mulai[0]}</p>
              )}
            </div>

            {/* Tanggal Selesai */}
            <div>
              <label htmlFor="tanggal_selesai" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai *
              </label>
              <input
                type="date"
                id="tanggal_selesai"
                name="tanggal_selesai"
                value={formData.tanggal_selesai}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.tanggal_selesai && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tanggal_selesai[0]}</p>
              )}
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:w-1/2"
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
                Hanya boleh ada satu tahun ajaran aktif per semester
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/tahun-ajaran"
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
                  Simpan Tahun Ajaran
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}