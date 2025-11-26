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
  FileText,
  Target
} from 'lucide-react';

interface Siswa {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface Guru {
  nik_guru: string;
  nama_guru: string;
}

interface TargetHalaqoh {
  id_target_hafalan: number;
  nis: string;
  target_baris_perpertemuan: number; // 3,5,7
  status: 'Aktif' | 'Non-aktif';
}

interface FormData {
  nis: string;
  nama_surah: string;
  ayat_mulai: number;
  ayat_selesai: number;
  jumlah_baris: number;
  tanggal_setoran: string;
  status_hafalan: 'Lancar' | 'Kurang_Lancar' | 'Belum_Lancar';
  nik_guru_penguji: string;
  catatan: string;
}

export default function TambahHafalanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetHalaqoh | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    nis: '',
    nama_surah: '',
    ayat_mulai: 1,
    ayat_selesai: 1,
    jumlah_baris: 0,
    tanggal_setoran: '',
    status_hafalan: 'Lancar',
    nik_guru_penguji: '',
    catatan: '',
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/v1/hafalan-form-data');
      if (response.data.success) {
        setSiswa(response.data.data.siswa || []);
        setGuru(response.data.data.guru || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }

    try {
      const targetResponse = await api.get('/v1/target-hafalan-siswa', { params: { status: 'Aktif', per_page: 1000 }});
      if (targetResponse.data.success) {
        const list = targetResponse.data.data.data || [];
        const map: Record<string, TargetHalaqoh> = {};
        list.forEach((t: any) => {
          if (t.status === 'Aktif') {
            map[t.nis] = {
              id_target_hafalan: t.id_target_hafalan,
              nis: t.nis,
              target_baris_perpertemuan: t.target_baris_perpertemuan,
              status: t.status,
            };
          }
        });
        setTargets(map);
      }
    } catch (error) {
      console.error('Error fetching target halaqoh:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ayat_mulai' || name === 'ayat_selesai' || name === 'jumlah_baris' 
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

    if (!formData.nama_surah) {
      newErrors.nama_surah = 'Nama surah harus diisi';
    }

    if (formData.ayat_mulai < 1) {
      newErrors.ayat_mulai = 'Ayat mulai harus lebih dari 0';
    }

    if (formData.ayat_selesai < 1) {
      newErrors.ayat_selesai = 'Ayat selesai harus lebih dari 0';
    }

    if (formData.jumlah_baris < 1) {
      newErrors.jumlah_baris = 'Jumlah baris harus lebih dari 0';
    }

    if (!formData.tanggal_setoran) {
      newErrors.tanggal_setoran = 'Tanggal setoran harus diisi';
    }

    if (!formData.nik_guru_penguji) {
      newErrors.nik_guru_penguji = 'Guru penguji harus dipilih';
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
      const response = await api.post('/v1/hafalan', formData);
      
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
  const targetHalaqoh = selectedSiswa ? targets[selectedSiswa.nis] : undefined;

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
                <User className="w-4 h-4 inline mr-1" />
                Guru Penguji *
              </label>
              <select
                name="nik_guru_penguji"
                value={formData.nik_guru_penguji}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nik_guru_penguji ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Guru</option>
                {guru.map((g) => (
                  <option key={g.nik_guru} value={g.nik_guru}>
                    {g.nama_guru} - {g.nik_guru}
                  </option>
                ))}
              </select>
              {errors.nik_guru_penguji && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nik_guru_penguji}
                </p>
              )}
            </div>
          </div>

          {/* Detail Hafalan */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Hafalan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Surah *
                </label>
                <input
                  type="text"
                  name="nama_surah"
                  value={formData.nama_surah}
                  onChange={handleInputChange}
                  placeholder="Contoh: Al-Baqarah"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nama_surah ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nama_surah && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.nama_surah}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayat Mulai *
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ayat Selesai *
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Baris *
              </label>
              <input
                type="number"
                name="jumlah_baris"
                value={formData.jumlah_baris}
                onChange={handleInputChange}
                min="1"
                className={`w-full md:w-1/3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.jumlah_baris ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.jumlah_baris && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.jumlah_baris}
                </p>
              )}
              {targetHalaqoh && (
                <p className="mt-1 text-sm text-gray-600 flex items-center">
                  <Target className="w-4 h-4 mr-1 text-blue-600" />
                  Target halaqoh siswa: {targetHalaqoh.target_baris_perpertemuan} baris per pertemuan
                </p>
              )}
            </div>
          </div>

          {/* Setoran & Status */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Setoran & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Setoran *
                </label>
                <input
                  type="date"
                  name="tanggal_setoran"
                  value={formData.tanggal_setoran}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tanggal_setoran ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_setoran && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.tanggal_setoran}
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
                  <option value="Lancar">Lancar</option>
                  <option value="Kurang_Lancar">Kurang Lancar</option>
                  <option value="Belum_Lancar">Belum Lancar</option>
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