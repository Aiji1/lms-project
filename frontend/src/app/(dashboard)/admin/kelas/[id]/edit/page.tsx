'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditKelasPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
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
    if (id) {
      fetchData();
      fetchFormOptions();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const response = await api.get(`/v1/kelas/${id}`);
      
      if (response.data.success) {
        const data = response.data.data.kelas;
        setFormData({
          ruangan: data.ruangan,
          nama_kelas: data.nama_kelas,
          tingkat: data.tingkat,
          id_jurusan: data.id_jurusan?.toString() || '',
          id_tahun_ajaran: data.id_tahun_ajaran?.toString() || '',
          kapasitas_maksimal: data.kapasitas_maksimal?.toString() || '',
          wali_kelas: data.wali_kelas || ''
        });
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/kelas');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/kelas-form-data');
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
      // Convert string values to integers for backend validation
      const submitData = {
        ...formData,
        id_jurusan: parseInt(formData.id_jurusan),
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran),
        kapasitas_maksimal: parseInt(formData.kapasitas_maksimal)
      };

      const response = await api.put(`/v1/kelas/${id}`, submitData);
      
      if (response.data.success) {
        alert('Kelas berhasil diperbarui!');
        router.push(`/admin/kelas/${id}`);
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
          href={`/admin/kelas/${id}`}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Kelas</h1>
          <p className="text-gray-600">Perbarui data kelas</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Kelas</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ruangan */}
            <div>
              <label htmlFor="ruangan" className="block text-sm font-medium text-gray-700 mb-2">
                Ruangan *
              </label>
              <select
                id="ruangan"
                name="ruangan"
                value={formData.ruangan}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Ruangan</option>
                {formOptions.ruangan_options.map(option => (
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
                Nama Kelas *
              </label>
              <input
                type="text"
                id="nama_kelas"
                name="nama_kelas"
                value={formData.nama_kelas}
                onChange={handleInputChange}
                placeholder="X RPL 1"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.nama_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nama_kelas[0]}</p>
              )}
            </div>

            {/* Tingkat */}
            <div>
              <label htmlFor="tingkat" className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat *
              </label>
              <select
                id="tingkat"
                name="tingkat"
                value={formData.tingkat}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Tingkat</option>
                {formOptions.tingkat_options.map(option => (
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
                Jurusan *
              </label>
              <select
                id="id_jurusan"
                name="id_jurusan"
                value={formData.id_jurusan}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Jurusan</option>
                {formOptions.jurusan_options.map(option => (
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
                Tahun Ajaran *
              </label>
              <select
                id="id_tahun_ajaran"
                name="id_tahun_ajaran"
                value={formData.id_tahun_ajaran}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Tahun Ajaran</option>
                {formOptions.tahun_ajaran_options.map(option => (
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
                Kapasitas Maksimal *
              </label>
              <input
                type="number"
                id="kapasitas_maksimal"
                name="kapasitas_maksimal"
                value={formData.kapasitas_maksimal}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                max="50"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {formErrors.kapasitas_maksimal && (
                <p className="mt-1 text-sm text-red-600">{formErrors.kapasitas_maksimal[0]}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Jumlah maksimal siswa dalam kelas (1-50)
              </p>
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
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:w-1/2"
              >
                <option value="">Pilih Wali Kelas (Opsional)</option>
                {formOptions.guru_options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formErrors.wali_kelas && (
                <p className="mt-1 text-sm text-red-600">{formErrors.wali_kelas[0]}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Guru yang bertanggung jawab sebagai wali kelas
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/admin/kelas/${id}`}
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
                  Perbarui Kelas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}