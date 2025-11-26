'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Calendar, Clock, BookOpen, Users } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  nis: string;
  id_mata_pelajaran: string;
  tanggal: string;
  jam_ke: string;
  status: string;
  keterangan: string;
}

interface Siswa {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
}

interface FormDataResponse {
  siswa: Siswa[];
  mata_pelajaran: MataPelajaran[];
  status_options: string[];
  jam_ke_options: number[];
}

export default function TambahPresensiMapelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nis: '',
    id_mata_pelajaran: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_ke: '',
    status: '',
    keterangan: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [statusOptions] = useState(['Sakit', 'Izin', 'Alpa']);
  const [jamKeOptions] = useState(Array.from({ length: 10 }, (_, i) => i + 1));

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/presensi-mapel-form-data');
      if (response.data.success) {
        const data: FormDataResponse = response.data.data;
        setSiswaList(data.siswa || []);
        setMataPelajaranList(data.mata_pelajaran || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nis) {
      newErrors.nis = 'Siswa harus dipilih';
    }
    if (!formData.id_mata_pelajaran) {
      newErrors.id_mata_pelajaran = 'Mata pelajaran harus dipilih';
    }
    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }
    if (!formData.jam_ke) {
      newErrors.jam_ke = 'Jam ke harus dipilih';
    }
    if (!formData.status) {
      newErrors.status = 'Status harus dipilih';
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
      const response = await api.post('/presensi-mapel', formData);
      
      if (response.data.success) {
        router.push('/presensi/mapel');
      } else {
        alert('Gagal menambah presensi mapel: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Error creating presensi mapel:', error);
      alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedSiswa = siswaList.find(s => s.nis === formData.nis);
  const selectedMapel = mataPelajaranList.find(m => m.id_mata_pelajaran.toString() === formData.id_mata_pelajaran);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/presensi/mapel"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tambah Presensi Mapel</h1>
              <p className="text-gray-600 mt-1">Tambah data ketidakhadiran siswa per mata pelajaran</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Siswa</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Siswa <span className="text-red-500">*</span>
              </label>
              <select
                name="nis"
                value={formData.nis}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nis ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Siswa</option>
                {siswaList.map((siswa) => (
                  <option key={siswa.nis} value={siswa.nis}>
                    {siswa.nis} - {siswa.nama_lengkap} ({siswa.nama_kelas})
                  </option>
                ))}
              </select>
              {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                name="id_mata_pelajaran"
                value={formData.id_mata_pelajaran}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.id_mata_pelajaran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mataPelajaranList.map((mapel) => (
                  <option key={mapel.id_mata_pelajaran} value={mapel.id_mata_pelajaran}>
                    {mapel.nama_mata_pelajaran}
                  </option>
                ))}
              </select>
              {errors.id_mata_pelajaran && <p className="text-red-500 text-sm mt-1">{errors.id_mata_pelajaran}</p>}
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Jadwal</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tanggal ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.tanggal && <p className="text-red-500 text-sm mt-1">{errors.tanggal}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Ke <span className="text-red-500">*</span>
              </label>
              <select
                name="jam_ke"
                value={formData.jam_ke}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.jam_ke ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Jam Ke</option>
                {jamKeOptions.map((jam) => (
                  <option key={jam} value={jam}>
                    Jam ke-{jam}
                  </option>
                ))}
              </select>
              {errors.jam_ke && <p className="text-red-500 text-sm mt-1">{errors.jam_ke}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Ketidakhadiran <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Tambahan</h2>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan keterangan tambahan (opsional)"
            />
          </div>
        </div>

        {/* Summary */}
        {(selectedSiswa || selectedMapel) && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Ringkasan Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedSiswa && (
                <div>
                  <span className="font-medium text-blue-800">Siswa:</span>
                  <p className="text-blue-700">{selectedSiswa.nama_lengkap} ({selectedSiswa.nis})</p>
                  <p className="text-blue-600">Kelas: {selectedSiswa.nama_kelas}</p>
                </div>
              )}
              {selectedMapel && (
                <div>
                  <span className="font-medium text-blue-800">Mata Pelajaran:</span>
                  <p className="text-blue-700">{selectedMapel.nama_mata_pelajaran}</p>
                </div>
              )}
              {formData.tanggal && (
                <div>
                  <span className="font-medium text-blue-800">Tanggal:</span>
                  <p className="text-blue-700">{new Date(formData.tanggal).toLocaleDateString('id-ID')}</p>
                </div>
              )}
              {formData.status && (
                <div>
                  <span className="font-medium text-blue-800">Status:</span>
                  <p className="text-blue-700">{formData.status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-end space-x-4">
            <Link
              href="/presensi/mapel"
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}