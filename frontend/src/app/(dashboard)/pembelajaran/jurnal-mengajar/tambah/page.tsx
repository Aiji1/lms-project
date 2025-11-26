'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, BookOpen, Calendar, User, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface FormData {
  id_jadwal: string;
  tanggal: string;
  status_mengajar: 'Hadir' | 'Tidak_Hadir' | 'Diganti';
  materi_diajarkan: string;
  keterangan_tambahan: string;
}

interface JadwalOption {
  id_jadwal: number;
  display_name: string;
  mata_pelajaran: string;
  kelas: string;
  hari: string;
  jam_ke: number;
  nama_guru: string;
  tahun_ajaran: string;
  semester: string;
}

interface TahunAjaranOption {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

export default function TambahJurnalMengajarPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    id_jadwal: '',
    tanggal: new Date().toISOString().split('T')[0],
    status_mengajar: 'Hadir',
    materi_diajarkan: '',
    keterangan_tambahan: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [jadwalOptions, setJadwalOptions] = useState<JadwalOption[]>([]);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranOption[]>([]);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      // Fetch jadwal options
      const jadwalResponse = await api.get('/jurnal-mengajar-form-data');
      if (jadwalResponse.data.success) {
        setJadwalOptions(jadwalResponse.data.data.jadwal_pelajaran || []);
      }

      // Fetch tahun ajaran options
      const tahunAjaranResponse = await api.get('/tahun-ajaran-form-data');
      if (tahunAjaranResponse.data.success) {
        setTahunAjaranOptions(tahunAjaranResponse.data.data.tahun_ajaran || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.id_jadwal) {
      newErrors.id_jadwal = 'Jadwal harus dipilih';
    }

    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }

    if (!formData.materi_diajarkan.trim()) {
      newErrors.materi_diajarkan = 'Materi yang diajarkan harus diisi';
    } else if (formData.materi_diajarkan.length < 10) {
      newErrors.materi_diajarkan = 'Materi yang diajarkan minimal 10 karakter';
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
      const response = await api.post('/jurnal-mengajar', {
        ...formData,
        id_jadwal: parseInt(formData.id_jadwal)
      });

      if (response.data.success) {
        router.push('/pembelajaran/jurnal-mengajar');
      } else {
        alert(response.data.message || 'Gagal menyimpan jurnal mengajar');
      }
    } catch (error) {
      console.error('Error saving jurnal mengajar:', error);
      alert('Terjadi kesalahan saat menyimpan jurnal mengajar');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedJadwal = () => {
    return jadwalOptions.find(jadwal => jadwal.id_jadwal.toString() === formData.id_jadwal);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/pembelajaran/jurnal-mengajar"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Tambah Jurnal Mengajar
          </h1>
          <p className="text-gray-600">Buat jurnal mengajar baru</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jadwal */}
            <div>
              <label htmlFor="id_jadwal" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Jadwal Pelajaran *
              </label>
              <select
                id="id_jadwal"
                name="id_jadwal"
                value={formData.id_jadwal}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id_jadwal ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Jadwal Pelajaran</option>
                {jadwalOptions.map((jadwal) => (
                  <option key={jadwal.id_jadwal} value={jadwal.id_jadwal}>
                    {jadwal.display_name}
                  </option>
                ))}
              </select>
              {errors.id_jadwal && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  {errors.id_jadwal}
                </p>
              )}
            </div>

            {/* Tanggal */}
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Tanggal Mengajar *
              </label>
              <input
                type="date"
                id="tanggal"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.tanggal ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.tanggal && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  {errors.tanggal}
                </p>
              )}
            </div>

            {/* Jam Ke - Auto-filled from selected schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Jam Ke
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                {getSelectedJadwal() ? `Jam ke-${getSelectedJadwal()?.jam_ke}` : 'Pilih jadwal terlebih dahulu'}
              </div>
            </div>

            {/* Status Mengajar */}
            <div>
              <label htmlFor="status_mengajar" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Status Mengajar *
              </label>
              <select
                id="status_mengajar"
                name="status_mengajar"
                value={formData.status_mengajar}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Hadir">Hadir</option>
                <option value="Tidak_Hadir">Tidak Hadir</option>
                <option value="Diganti">Diganti</option>
              </select>
            </div>

            {/* Info Jadwal Terpilih */}
            {getSelectedJadwal() && (
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Informasi Jadwal
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Mata Pelajaran:</strong> {getSelectedJadwal()?.mata_pelajaran}</p>
                    <p><strong>Kelas:</strong> {getSelectedJadwal()?.kelas}</p>
                    <p><strong>Hari:</strong> {getSelectedJadwal()?.hari}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Materi Diajarkan */}
          <div>
            <label htmlFor="materi_diajarkan" className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Materi yang Diajarkan *
            </label>
            <textarea
              id="materi_diajarkan"
              name="materi_diajarkan"
              value={formData.materi_diajarkan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Masukkan materi yang diajarkan secara detail..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.materi_diajarkan ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.materi_diajarkan && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                {errors.materi_diajarkan}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.materi_diajarkan.length} karakter
            </p>
          </div>

          {/* Keterangan Tambahan */}
          <div>
            <label htmlFor="keterangan_tambahan" className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan Tambahan
            </label>
            <textarea
              id="keterangan_tambahan"
              name="keterangan_tambahan"
              value={formData.keterangan_tambahan}
              onChange={handleInputChange}
              rows={3}
              placeholder="Masukkan keterangan tambahan untuk mencatat murid yang tidak hadir atau keterangan lainnya..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.keterangan_tambahan.length} karakter
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/pembelajaran/jurnal-mengajar"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}