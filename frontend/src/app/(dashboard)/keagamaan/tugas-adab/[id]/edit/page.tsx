'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Target, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  Calendar,
  FileText,
  BookOpen
} from 'lucide-react';

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

interface TugasAdab {
  id_tugas_adab: number;
  nama_tugas: string;
  deskripsi_tugas: string;
  id_tahun_ajaran: number;
  status: 'Aktif' | 'Non-aktif';
}

interface FormData {
  nama_tugas: string;
  deskripsi_tugas: string;
  id_tahun_ajaran: string;
  status: 'Aktif' | 'Non-aktif';
}

export default function EditTugasAdabPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    nama_tugas: '',
    deskripsi_tugas: '',
    id_tahun_ajaran: '',
    status: 'Aktif'
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      
      // Fetch tugas adab data
      const tugasResponse = await api.get(`/v1/tugas-adab/${id}`);
      if (tugasResponse.data.success) {
        const tugas: TugasAdab = tugasResponse.data.data;
        
        setFormData({
          nama_tugas: tugas.nama_tugas,
          deskripsi_tugas: tugas.deskripsi_tugas,
          id_tahun_ajaran: tugas.id_tahun_ajaran.toString(),
          status: tugas.status
        });
      } else {
        router.push('/keagamaan/tugas-adab');
        return;
      }

      // Fetch tahun ajaran
      const tahunResponse = await api.get('/v1/tahun-ajaran');
      if (tahunResponse.data.success) {
        setTahunAjaran(tahunResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_tugas.trim()) {
      newErrors.nama_tugas = 'Nama tugas harus diisi';
    } else if (formData.nama_tugas.length < 3) {
      newErrors.nama_tugas = 'Nama tugas minimal 3 karakter';
    } else if (formData.nama_tugas.length > 200) {
      newErrors.nama_tugas = 'Nama tugas maksimal 200 karakter';
    }

    if (!formData.deskripsi_tugas.trim()) {
      newErrors.deskripsi_tugas = 'Deskripsi tugas harus diisi';
    } else if (formData.deskripsi_tugas.length < 10) {
      newErrors.deskripsi_tugas = 'Deskripsi tugas minimal 10 karakter';
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
      const response = await api.put(`/v1/tugas-adab/${id}`, {
        ...formData,
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran)
      });

      if (response.data.success) {
        router.push(`/keagamaan/tugas-adab/${id}`);
      } else {
        if (response.data.errors) {
          setErrors(response.data.errors);
        } else {
          alert(response.data.message || 'Gagal mengupdate tugas adab');
        }
      }
    } catch (error) {
      console.error('Error updating tugas adab:', error);
      alert('Terjadi kesalahan saat mengupdate tugas adab');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/keagamaan/tugas-adab/${id}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Edit Tugas Adab
              </h1>
            </div>
            <p className="text-gray-600">Ubah informasi tugas adab</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nama Tugas */}
          <div>
            <label htmlFor="nama_tugas" className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Nama Tugas *
            </label>
            <input
              type="text"
              id="nama_tugas"
              name="nama_tugas"
              value={formData.nama_tugas}
              onChange={handleInputChange}
              placeholder="Masukkan nama tugas adab"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nama_tugas ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={200}
            />
            {errors.nama_tugas && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.nama_tugas}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.nama_tugas.length}/200 karakter
            </p>
          </div>

          {/* Deskripsi Tugas */}
          <div>
            <label htmlFor="deskripsi_tugas" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Deskripsi Tugas *
            </label>
            <textarea
              id="deskripsi_tugas"
              name="deskripsi_tugas"
              value={formData.deskripsi_tugas}
              onChange={handleInputChange}
              placeholder="Masukkan deskripsi detail tugas adab"
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.deskripsi_tugas ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.deskripsi_tugas && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.deskripsi_tugas}
              </p>
            )}
          </div>

          {/* Tahun Ajaran */}
          <div>
            <label htmlFor="id_tahun_ajaran" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Tahun Ajaran *
            </label>
            <select
              id="id_tahun_ajaran"
              name="id_tahun_ajaran"
              value={formData.id_tahun_ajaran}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Tahun Ajaran</option>
              {tahunAjaran.map((tahun) => (
                <option key={tahun.id_tahun_ajaran} value={tahun.id_tahun_ajaran}>
                  {tahun.tahun_ajaran} - {tahun.semester}
                  {tahun.status === 'Aktif' && ' (Aktif)'}
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

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Aktif">Aktif</option>
              <option value="Non-aktif">Non-aktif</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link
              href={`/keagamaan/tugas-adab/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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