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
  BarChart3,
  CheckCircle,
  AlertCircle,
  Target,
  TrendingUp
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

interface TargetHafalan {
  id_target: number;
  nis: string;
  nama_siswa: string;
  total_baris_target: number;
  target_surah_mulai: string;
  target_ayat_mulai: number;
  target_surah_selesai: string;
  target_ayat_selesai: number;
}

interface FormData {
  nis: string;
  periode_evaluasi: 'Bulanan' | '3_Bulanan' | 'Semesteran';
  bulan_periode: string;
  total_baris_target: number;
  target_surah_mulai: string;
  target_ayat_mulai: number;
  target_surah_selesai: string;
  target_ayat_selesai: number;
  total_baris_tercapai: number;
  tercapai_surah_mulai: string;
  tercapai_ayat_mulai: number;
  tercapai_surah_selesai: string;
  tercapai_ayat_selesai: number;
  id_tahun_ajaran: number;
}

export default function TambahEvaluasiHafalanPage() {
  const router = useRouter();
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [targetHafalan, setTargetHafalan] = useState<TargetHafalan[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetHafalan | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    nis: '',
    periode_evaluasi: 'Bulanan',
    bulan_periode: '',
    total_baris_target: 0,
    target_surah_mulai: '',
    target_ayat_mulai: 1,
    target_surah_selesai: '',
    target_ayat_selesai: 1,
    total_baris_tercapai: 0,
    tercapai_surah_mulai: '',
    tercapai_ayat_mulai: 1,
    tercapai_surah_selesai: '',
    tercapai_ayat_selesai: 1,
    id_tahun_ajaran: 0
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (formData.nis) {
      fetchTargetHafalan(formData.nis);
    }
  }, [formData.nis]);

  useEffect(() => {
    if (selectedTarget) {
      setFormData(prev => ({
        ...prev,
        total_baris_target: selectedTarget.total_baris_target,
        target_surah_mulai: selectedTarget.target_surah_mulai,
        target_ayat_mulai: selectedTarget.target_ayat_mulai,
        target_surah_selesai: selectedTarget.target_surah_selesai,
        target_ayat_selesai: selectedTarget.target_ayat_selesai
      }));
    }
  }, [selectedTarget]);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/evaluasi-hafalan-form-data');
      if (response.data.success) {
        setSiswaList(response.data.data.siswa || []);
        setTahunAjaran(response.data.data.tahun_ajaran || []);
        
        // Set default tahun ajaran to active one
        const activeTahunAjaran = response.data.data.tahun_ajaran?.find((ta: TahunAjaran) => ta.status === 'Aktif');
        if (activeTahunAjaran) {
          setFormData(prev => ({ ...prev, id_tahun_ajaran: activeTahunAjaran.id_tahun_ajaran }));
        }
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const fetchTargetHafalan = async (nis: string) => {
    try {
      const response = await api.get('/target-hafalan-siswa', {
        params: { nis }
      });
      if (response.data.success) {
        const targets = response.data.data.data || [];
        setTargetHafalan(targets);
        if (targets.length > 0) {
          setSelectedTarget(targets[0]); // Auto select first target
        }
      }
    } catch (error) {
      console.error('Error fetching target hafalan:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.periode_evaluasi) newErrors.periode_evaluasi = 'Periode evaluasi harus dipilih';
    if (!formData.bulan_periode) newErrors.bulan_periode = 'Bulan periode harus diisi';
    if (formData.total_baris_target <= 0) newErrors.total_baris_target = 'Total baris target harus lebih dari 0';
    if (!formData.target_surah_mulai) newErrors.target_surah_mulai = 'Surah mulai target harus diisi';
    if (!formData.target_surah_selesai) newErrors.target_surah_selesai = 'Surah selesai target harus diisi';
    if (formData.total_baris_tercapai < 0) newErrors.total_baris_tercapai = 'Total baris tercapai tidak boleh negatif';
    if (formData.total_baris_tercapai > formData.total_baris_target) {
      newErrors.total_baris_tercapai = 'Baris tercapai tidak boleh melebihi target';
    }
    if (!formData.tercapai_surah_mulai) newErrors.tercapai_surah_mulai = 'Surah mulai tercapai harus diisi';
    if (!formData.tercapai_surah_selesai) newErrors.tercapai_surah_selesai = 'Surah selesai tercapai harus diisi';
    if (!formData.id_tahun_ajaran) newErrors.id_tahun_ajaran = 'Tahun ajaran harus dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/evaluasi-hafalan', formData);
      if (response.data.success) {
        router.push('/keagamaan/hafalan/evaluasi');
      }
    } catch (error: any) {
      console.error('Error creating evaluasi hafalan:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = () => {
    if (formData.total_baris_target === 0) return 0;
    return Math.round((formData.total_baris_tercapai / formData.total_baris_target) * 100);
  };

  const getStatusKetuntasan = () => {
    return getPercentage() >= 75 ? 'Tuntas' : 'Belum Tuntas';
  };

  const selectedSiswa = siswaList.find(s => s.nis === formData.nis);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            href="/keagamaan/hafalan/evaluasi"
            className="text-gray-500 hover:text-gray-700 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-purple-600" />
            Tambah Evaluasi Hafalan
          </h1>
        </div>
        <p className="text-gray-600">
          Tambahkan evaluasi dan penilaian progress hafalan siswa
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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

            {/* Periode Evaluasi */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-600" />
                Periode Evaluasi
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Periode *
                  </label>
                  <select
                    name="periode_evaluasi"
                    value={formData.periode_evaluasi}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.periode_evaluasi ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Bulanan">Bulanan</option>
                    <option value="3_Bulanan">3 Bulanan</option>
                    <option value="Semesteran">Semesteran</option>
                  </select>
                  {errors.periode_evaluasi && <p className="text-red-500 text-sm mt-1">{errors.periode_evaluasi}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bulan/Periode *
                  </label>
                  <input
                    type="text"
                    name="bulan_periode"
                    value={formData.bulan_periode}
                    onChange={handleInputChange}
                    placeholder="Contoh: Januari 2024, Triwulan 1, Semester Ganjil"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.bulan_periode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.bulan_periode && <p className="text-red-500 text-sm mt-1">{errors.bulan_periode}</p>}
                </div>
              </div>
            </div>

            {/* Target Hafalan */}
            {targetHafalan.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-orange-600" />
                  Target Hafalan
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Target Hafalan
                  </label>
                  <select
                    value={selectedTarget?.id_target || ''}
                    onChange={(e) => {
                      const target = targetHafalan.find(t => t.id_target === parseInt(e.target.value));
                      setSelectedTarget(target || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Pilih Target</option>
                    {targetHafalan.map((target) => (
                      <option key={target.id_target} value={target.id_target}>
                        {target.target_surah_mulai}:{target.target_ayat_mulai} - {target.target_surah_selesai}:{target.target_ayat_selesai} ({target.total_baris_target} baris)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.total_baris_target ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.total_baris_target && <p className="text-red-500 text-sm mt-1">{errors.total_baris_target}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dari Surah *
                    </label>
                    <input
                      type="text"
                      name="target_surah_mulai"
                      value={formData.target_surah_mulai}
                      onChange={handleInputChange}
                      placeholder="Contoh: Al-Fatihah"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.target_surah_mulai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.target_surah_mulai && <p className="text-red-500 text-sm mt-1">{errors.target_surah_mulai}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sampai Surah *
                    </label>
                    <input
                      type="text"
                      name="target_surah_selesai"
                      value={formData.target_surah_selesai}
                      onChange={handleInputChange}
                      placeholder="Contoh: Al-Baqarah"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.target_surah_selesai ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.target_surah_selesai && <p className="text-red-500 text-sm mt-1">{errors.target_surah_selesai}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Pencapaian */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Pencapaian Hafalan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Baris Tercapai *
                  </label>
                  <input
                    type="number"
                    name="total_baris_tercapai"
                    value={formData.total_baris_tercapai}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.total_baris_target}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.total_baris_tercapai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.total_baris_tercapai && <p className="text-red-500 text-sm mt-1">{errors.total_baris_tercapai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dari Surah *
                  </label>
                  <input
                    type="text"
                    name="tercapai_surah_mulai"
                    value={formData.tercapai_surah_mulai}
                    onChange={handleInputChange}
                    placeholder="Contoh: Al-Fatihah"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.tercapai_surah_mulai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tercapai_surah_mulai && <p className="text-red-500 text-sm mt-1">{errors.tercapai_surah_mulai}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sampai Surah *
                  </label>
                  <input
                    type="text"
                    name="tercapai_surah_selesai"
                    value={formData.tercapai_surah_selesai}
                    onChange={handleInputChange}
                    placeholder="Contoh: Al-Baqarah"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.tercapai_surah_selesai ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.tercapai_surah_selesai && <p className="text-red-500 text-sm mt-1">{errors.tercapai_surah_selesai}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Mulai Tercapai
                  </label>
                  <input
                    type="number"
                    name="tercapai_ayat_mulai"
                    value={formData.tercapai_ayat_mulai}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Selesai Tercapai
                  </label>
                  <input
                    type="number"
                    name="tercapai_ayat_selesai"
                    value={formData.tercapai_ayat_selesai}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/keagamaan/hafalan/evaluasi"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Evaluasi
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
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Preview Evaluasi
            </h3>

            {selectedSiswa && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Siswa</p>
                  <p className="font-medium">{selectedSiswa.nama_siswa}</p>
                  <p className="text-sm text-gray-500">{selectedSiswa.nis} • {selectedSiswa.nama_kelas}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Periode</p>
                  <p className="font-medium">{formData.periode_evaluasi.replace('_', ' ')}</p>
                  {formData.bulan_periode && (
                    <p className="text-sm text-gray-500">{formData.bulan_periode}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{formData.total_baris_tercapai} / {formData.total_baris_target} baris</span>
                    <span className="text-sm font-medium text-purple-600">{getPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${getPercentage()}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status Ketuntasan</p>
                  <div className="flex items-center mt-1">
                    {getStatusKetuntasan() === 'Tuntas' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-green-600 font-medium">Tuntas</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-red-600 font-medium">Belum Tuntas</span>
                      </>
                    )}
                  </div>
                </div>

                {formData.target_surah_mulai && formData.target_surah_selesai && (
                  <div>
                    <p className="text-sm text-gray-600">Target Range</p>
                    <p className="font-medium text-sm">
                      {formData.target_surah_mulai}:{formData.target_ayat_mulai} - {formData.target_surah_selesai}:{formData.target_ayat_selesai}
                    </p>
                  </div>
                )}

                {formData.tercapai_surah_mulai && formData.tercapai_surah_selesai && (
                  <div>
                    <p className="text-sm text-gray-600">Tercapai Range</p>
                    <p className="font-medium text-sm">
                      {formData.tercapai_surah_mulai}:{formData.tercapai_ayat_mulai} - {formData.tercapai_surah_selesai}:{formData.tercapai_ayat_selesai}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}