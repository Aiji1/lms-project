'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';

interface Siswa {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

interface FormData {
  nis: string;
  surah_mulai: string;
  ayat_mulai: number;
  surah_selesai: string;
  ayat_selesai: number;
  total_baris: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_hafalan: 'Proses' | 'Selesai' | 'Tertunda';
  catatan: string;
  id_tahun_ajaran: number;
}

export default function TambahHafalanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    nis: '',
    surah_mulai: '',
    ayat_mulai: 1,
    surah_selesai: '',
    ayat_selesai: 1,
    total_baris: 0,
    tanggal_mulai: '',
    tanggal_selesai: '',
    status_hafalan: 'Proses',
    catatan: '',
    id_tahun_ajaran: 0
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/hafalan-form-data');
      if (response.data.success) {
        setSiswa(response.data.data.siswa || []);
        setTahunAjaran(response.data.data.tahun_ajaran || []);
        
        // Set default tahun ajaran aktif
        const activeTahunAjaran = response.data.data.tahun_ajaran?.find((ta: TahunAjaran) => ta.status === 'Aktif');
        if (activeTahunAjaran) {
          setFormData(prev => ({
            ...prev,
            id_tahun_ajaran: activeTahunAjaran.id_tahun_ajaran
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ayat_mulai' || name === 'ayat_selesai' || name === 'total_baris' || name === 'id_tahun_ajaran' 
        ? parseInt(value) || 0 
        : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nis) {
      newErrors.nis = 'Siswa harus dipilih';
    }

    if (!formData.surah_mulai) {
      newErrors.surah_mulai = 'Surah mulai harus diisi';
    }

    if (!formData.surah_selesai) {
      newErrors.surah_selesai = 'Surah selesai harus diisi';
    }

    if (formData.ayat_mulai < 1) {
      newErrors.ayat_mulai = 'Ayat mulai harus lebih dari 0';
    }

    if (formData.ayat_selesai < 1) {
      newErrors.ayat_selesai = 'Ayat selesai harus lebih dari 0';
    }

    if (formData.total_baris < 1) {
      newErrors.total_baris = 'Total baris harus lebih dari 0';
    }

    if (!formData.tanggal_mulai) {
      newErrors.tanggal_mulai = 'Tanggal mulai harus diisi';
    }

    if (!formData.tanggal_selesai) {
      newErrors.tanggal_selesai = 'Tanggal selesai harus diisi';
    }

    if (formData.tanggal_mulai && formData.tanggal_selesai) {
      if (new Date(formData.tanggal_mulai) > new Date(formData.tanggal_selesai)) {
        newErrors.tanggal_selesai = 'Tanggal selesai harus setelah tanggal mulai';
      }
    }

    if (!formData.id_tahun_ajaran) {
      newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/hafalan', formData);
      
      if (response.data.success) {
        router.push('/keagamaan/hafalan');
      } else {
        if (response.data.errors) {
          setErrors(response.data.errors);
        }
      }
    } catch (error: any) {
      console.error('Error creating hafalan:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedSiswa = siswa.find(s => s.nis === formData.nis);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Link
                href="/keagamaan/hafalan"
                className="text-gray-500 hover:text-gray-700 mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookOpen className="mr-3 text-blue-600" />
                Tambah Hafalan
              </h1>
            </div>
            <p className="text-gray-600">
              Tambahkan data hafalan baru untuk siswa
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Siswa Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Siswa *
              </label>
              <select
                name="nis"
                value={formData.nis}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nis ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Siswa</option>
                {siswa.map((s) => (
                  <option key={s.nis} value={s.nis}>
                    {s.nama_lengkap} - {s.nis} ({s.nama_kelas})
                  </option>
                ))}
              </select>
              {errors.nis && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nis}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tahun Ajaran *
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
                {tahunAjaran.map((ta) => (
                  <option key={ta.id_tahun_ajaran} value={ta.id_tahun_ajaran}>
                    {ta.tahun_ajaran} - {ta.semester}
                  </option>
                ))}
              </select>
              {errors.id_tahun_ajaran && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.id_tahun_ajaran}
                </p>
              )}
            </div>
          </div>

          {/* Hafalan Range */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Range Hafalan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mulai */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Mulai Dari:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surah *
                    </label>
                    <input
                      type="text"
                      name="surah_mulai"
                      value={formData.surah_mulai}
                      onChange={handleInputChange}
                      placeholder="Contoh: Al-Fatihah"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.surah_mulai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.surah_mulai && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.surah_mulai}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ayat *
                    </label>
                    <input
                      type="number"
                      name="ayat_mulai"
                      value={formData.ayat_mulai}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.ayat_mulai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.ayat_mulai && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.ayat_mulai}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Selesai */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Sampai:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surah *
                    </label>
                    <input
                      type="text"
                      name="surah_selesai"
                      value={formData.surah_selesai}
                      onChange={handleInputChange}
                      placeholder="Contoh: Al-Baqarah"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.surah_selesai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.surah_selesai && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.surah_selesai}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ayat *
                    </label>
                    <input
                      type="number"
                      name="ayat_selesai"
                      value={formData.ayat_selesai}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.ayat_selesai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.ayat_selesai && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.ayat_selesai}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Baris *
              </label>
              <input
                type="number"
                name="total_baris"
                value={formData.total_baris}
                onChange={handleInputChange}
                min="1"
                className={`w-full md:w-1/3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.total_baris ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.total_baris && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.total_baris}
                </p>
              )}
            </div>
          </div>

          {/* Periode dan Status */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Periode & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_mulai && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.tanggal_mulai}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai *
                </label>
                <input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_selesai && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.tanggal_selesai}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Hafalan *
                </label>
                <select
                  name="status_hafalan"
                  value={formData.status_hafalan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Proses">Proses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Tertunda">Tertunda</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Catatan
            </label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Catatan tambahan tentang hafalan ini..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Buttons */}
          <div className="border-t pt-6 flex justify-end space-x-3">
            <Link
              href="/keagamaan/hafalan"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Hafalan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}