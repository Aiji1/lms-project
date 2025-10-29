'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  BookOpen, 
  Target,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Siswa {
  nis: string;
  nama_siswa: string;
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
  id_tahun_ajaran: number;
  total_baris_target: number;
  target_surah_mulai: string;
  target_ayat_mulai: number;
  target_surah_selesai: string;
  target_ayat_selesai: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_target: 'Aktif' | 'Selesai' | 'Tertunda';
  catatan: string;
}

export default function TambahTargetHafalanPage() {
  const router = useRouter();
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    nis: '',
    id_tahun_ajaran: 0,
    total_baris_target: 0,
    target_surah_mulai: '',
    target_ayat_mulai: 1,
    target_surah_selesai: '',
    target_ayat_selesai: 1,
    tanggal_mulai: '',
    tanggal_selesai: '',
    status_target: 'Aktif',
    catatan: ''
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/target-hafalan-siswa-form-data');
      if (response.data.success) {
        setSiswaList(response.data.data.siswa || []);
        setTahunAjaran(response.data.data.tahun_ajaran || []);
        
        // Set default tahun ajaran to active one
        const activeTahunAjaran = response.data.data.tahun_ajaran?.find((ta: TahunAjaran) => ta.status === 'Aktif');
        if (activeTahunAjaran) {
          setFormData(prev => ({ ...prev, id_tahun_ajaran: activeTahunAjaran.id_tahun_ajaran }));
        }

        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          tanggal_mulai: today,
          tanggal_selesai: nextMonthStr
        }));
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('ayat') || name.includes('baris') || name === 'id_tahun_ajaran' 
        ? parseInt(value) || 0 
        : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nis) newErrors.nis = 'NIS siswa harus dipilih';
    if (!formData.id_tahun_ajaran) newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';
    if (formData.total_baris_target <= 0) newErrors.total_baris_target = 'Total baris target harus lebih dari 0';
    if (!formData.target_surah_mulai) newErrors.target_surah_mulai = 'Surah mulai harus diisi';
    if (!formData.target_surah_selesai) newErrors.target_surah_selesai = 'Surah selesai harus diisi';
    if (formData.target_ayat_mulai <= 0) newErrors.target_ayat_mulai = 'Ayat mulai harus lebih dari 0';
    if (formData.target_ayat_selesai <= 0) newErrors.target_ayat_selesai = 'Ayat selesai harus lebih dari 0';
    if (!formData.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai harus diisi';
    if (!formData.tanggal_selesai) newErrors.tanggal_selesai = 'Tanggal selesai harus diisi';
    
    // Validate date range
    if (formData.tanggal_mulai && formData.tanggal_selesai) {
      const startDate = new Date(formData.tanggal_mulai);
      const endDate = new Date(formData.tanggal_selesai);
      if (endDate <= startDate) {
        newErrors.tanggal_selesai = 'Tanggal selesai harus setelah tanggal mulai';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/target-hafalan-siswa', formData);
      if (response.data.success) {
        router.push('/keagamaan/hafalan/target');
      }
    } catch (error: any) {
      console.error('Error creating target hafalan:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aktif': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Selesai': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'Tertunda': { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Aktif'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const selectedSiswa = siswaList.find(s => s.nis === formData.nis);
  const selectedTahunAjaran = tahunAjaran.find(ta => ta.id_tahun_ajaran === formData.id_tahun_ajaran);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/keagamaan/hafalan/target"
            className="text-gray-500 hover:text-gray-700 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Target className="mr-3 text-orange-600" />
            Tambah Target Hafalan
          </h1>
        </div>
        <p className="text-gray-600">
          Tetapkan target hafalan untuk siswa
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Siswa Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Informasi Siswa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Siswa *
                  </label>
                  <select
                    name="nis"
                    value={formData.nis}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.nis ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih Siswa</option>
                    {siswaList.map((siswa) => (
                      <option key={siswa.nis} value={siswa.nis}>
                        {siswa.nis} - {siswa.nama_siswa} ({siswa.nama_kelas})
                      </option>
                    ))}
                  </select>
                  {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Ajaran *
                  </label>
                  <select
                    name="id_tahun_ajaran"
                    value={formData.id_tahun_ajaran}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
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
                  {errors.id_tahun_ajaran && <p className="text-red-500 text-sm mt-1">{errors.id_tahun_ajaran}</p>}
                </div>
              </div>
            </div>

            {/* Target Hafalan */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                Target Hafalan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Baris Target *
                  </label>
                  <input
                    type="number"
                    name="total_baris_target"
                    value={formData.total_baris_target}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.total_baris_target ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.total_baris_target && <p className="text-red-500 text-sm mt-1">{errors.total_baris_target}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surah Mulai *
                  </label>
                  <input
                    type="text"
                    name="target_surah_mulai"
                    value={formData.target_surah_mulai}
                    onChange={handleInputChange}
                    placeholder="Contoh: Al-Fatihah"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.target_surah_mulai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.target_surah_mulai && <p className="text-red-500 text-sm mt-1">{errors.target_surah_mulai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Mulai *
                  </label>
                  <input
                    type="number"
                    name="target_ayat_mulai"
                    value={formData.target_ayat_mulai}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.target_ayat_mulai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.target_ayat_mulai && <p className="text-red-500 text-sm mt-1">{errors.target_ayat_mulai}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surah Selesai *
                  </label>
                  <input
                    type="text"
                    name="target_surah_selesai"
                    value={formData.target_surah_selesai}
                    onChange={handleInputChange}
                    placeholder="Contoh: Al-Baqarah"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.target_surah_selesai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.target_surah_selesai && <p className="text-red-500 text-sm mt-1">{errors.target_surah_selesai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Selesai *
                  </label>
                  <input
                    type="number"
                    name="target_ayat_selesai"
                    value={formData.target_ayat_selesai}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.target_ayat_selesai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.target_ayat_selesai && <p className="text-red-500 text-sm mt-1">{errors.target_ayat_selesai}</p>}
                </div>
              </div>
            </div>

            {/* Jadwal */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Jadwal Target
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    name="tanggal_mulai"
                    value={formData.tanggal_mulai}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.tanggal_mulai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tanggal_mulai && <p className="text-red-500 text-sm mt-1">{errors.tanggal_mulai}</p>}
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.tanggal_selesai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tanggal_selesai && <p className="text-red-500 text-sm mt-1">{errors.tanggal_selesai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Target *
                  </label>
                  <select
                    name="status_target"
                    value={formData.status_target}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Tertunda">Tertunda</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catatan */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan
              </label>
              <textarea
                name="catatan"
                value={formData.catatan}
                onChange={handleInputChange}
                rows={3}
                placeholder="Catatan tambahan untuk target hafalan ini..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/keagamaan/hafalan/target"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Target
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-600" />
              Preview Target
            </h3>

            {selectedSiswa && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Siswa</p>
                  <p className="font-medium">{selectedSiswa.nama_siswa}</p>
                  <p className="text-sm text-gray-500">{selectedSiswa.nis} • {selectedSiswa.nama_kelas}</p>
                </div>

                {selectedTahunAjaran && (
                  <div>
                    <p className="text-sm text-gray-600">Tahun Ajaran</p>
                    <p className="font-medium">{selectedTahunAjaran.tahun_ajaran}</p>
                    <p className="text-sm text-gray-500">{selectedTahunAjaran.semester}</p>
                  </div>
                )}

                {formData.total_baris_target > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Target</p>
                    <p className="font-medium">{formData.total_baris_target} baris</p>
                  </div>
                )}

                {formData.target_surah_mulai && formData.target_surah_selesai && (
                  <div>
                    <p className="text-sm text-gray-600">Range Hafalan</p>
                    <p className="font-medium text-sm">
                      {formData.target_surah_mulai}:{formData.target_ayat_mulai} - {formData.target_surah_selesai}:{formData.target_ayat_selesai}
                    </p>
                  </div>
                )}

                {formData.tanggal_mulai && formData.tanggal_selesai && (
                  <div>
                    <p className="text-sm text-gray-600">Periode</p>
                    <p className="font-medium text-sm">
                      {new Date(formData.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(formData.tanggal_selesai).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.ceil((new Date(formData.tanggal_selesai).getTime() - new Date(formData.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24))} hari
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(formData.status_target)}
                </div>

                {formData.catatan && (
                  <div>
                    <p className="text-sm text-gray-600">Catatan</p>
                    <p className="text-sm text-gray-900">{formData.catatan}</p>
                  </div>
                )}
              </div>
            )}

            {!selectedSiswa && (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Pilih siswa untuk melihat preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}