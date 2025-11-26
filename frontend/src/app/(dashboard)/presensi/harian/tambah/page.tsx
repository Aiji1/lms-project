'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { api } from '@/lib/api';

interface FormData {
  nis: string;
  tanggal: string;
  status_kehadiran: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  metode_presensi: 'Manual' | 'RFID' | 'QRCode';
  keterangan: string;
}

interface Siswa {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface StatusKehadiran {
  value: string;
  label: string;
}

interface MetodePresensi {
  value: string;
  label: string;
}

export default function TambahPresensiHarianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [statusKehadiran, setStatusKehadiran] = useState<StatusKehadiran[]>([]);
  const [metodePresensi, setMetodePresensi] = useState<MetodePresensi[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [formData, setFormData] = useState<FormData>({
    nis: '',
    tanggal: new Date().toISOString().split('T')[0], // Default to today
    status_kehadiran: 'Hadir',
    metode_presensi: 'Manual',
    keterangan: ''
  });

  // Fetch form data
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const response = await api.get('/presensi-harian-form-data');
      if (response.data.success) {
        setSiswa(response.data.data.siswa);
        setStatusKehadiran(response.data.data.status_kehadiran);
        setMetodePresensi(response.data.data.metode_presensi);
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
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nis) newErrors.nis = 'Siswa wajib dipilih';
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    if (!formData.status_kehadiran) newErrors.status_kehadiran = 'Status kehadiran wajib dipilih';
    if (!formData.metode_presensi) newErrors.metode_presensi = 'Metode presensi wajib dipilih';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/presensi-harian', formData);
      
      if (response.data.success) {
        alert('Data presensi harian berhasil ditambahkan!');
        router.push('/presensi/harian');
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Error: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/presensi/harian"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tambah Presensi Harian</h1>
              <p className="text-gray-600 mt-1">
                Isi form di bawah untuk menambahkan data presensi harian baru
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Presensi</h2>
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
                {siswa.map((s) => (
                  <option key={s.nis} value={s.nis}>
                    {s.nis} - {s.nama_lengkap} ({s.nama_kelas})
                  </option>
                ))}
              </select>
              {errors.nis && <p className="text-red-500 text-sm mt-1">{errors.nis}</p>}
            </div>

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
                Status Kehadiran <span className="text-red-500">*</span>
              </label>
              <select
                name="status_kehadiran"
                value={formData.status_kehadiran}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.status_kehadiran ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {statusKehadiran.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              {errors.status_kehadiran && <p className="text-red-500 text-sm mt-1">{errors.status_kehadiran}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Presensi <span className="text-red-500">*</span>
              </label>
              <select
                name="metode_presensi"
                value={formData.metode_presensi}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.metode_presensi ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {metodePresensi.map((metode) => (
                  <option key={metode.value} value={metode.value}>
                    {metode.label}
                  </option>
                ))}
              </select>
              {errors.metode_presensi && <p className="text-red-500 text-sm mt-1">{errors.metode_presensi}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan keterangan (opsional)"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-end space-x-4">
            <Link
              href="/presensi/harian"
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <X size={16} className="mr-2" />
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}