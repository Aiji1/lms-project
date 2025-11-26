'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar, 
  Phone, 
  MapPin,
  BookOpen,
  Briefcase,
  X,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: string;
}

interface GuruData {
  nik_guru: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat?: string;
  no_telepon?: string;
  status_kepegawaian: string;
  jabatan: string;
  status: string;
  mata_pelajaran: MataPelajaran[];
  wali_kelas_nama?: string;
}

interface FormData {
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat: string;
  no_telepon: string;
  status_kepegawaian: string;
  jabatan: string;
  status: string;
  mata_pelajaran: number[];
}

interface FormDataResponse {
  mata_pelajaran: MataPelajaran[];
  mata_pelajaran_grouped: Record<string, MataPelajaran[]>;
  status_kepegawaian_options: string[];
  jabatan_options: string[];
}

export default function EditGuruPage() {
  const router = useRouter();
  const params = useParams();
  const nik_guru = params.nik_guru as string;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formDataLoading, setFormDataLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormDataResponse | null>(null);
  const [selectedMapel, setSelectedMapel] = useState<MataPelajaran[]>([]);
  const [showMapelDropdown, setShowMapelDropdown] = useState(false);
  const [mapelSearchTerm, setMapelSearchTerm] = useState('');
  const [guruData, setGuruData] = useState<GuruData | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nama_lengkap: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    alamat: '',
    no_telepon: '',
    status_kepegawaian: 'Honorer',
    jabatan: 'Guru',
    status: 'Aktif',
    mata_pelajaran: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing guru data
  useEffect(() => {
    const fetchGuruData = async () => {
      try {
        const response = await api.get(`/v1/guru/${nik_guru}`);
        if (response.data.success) {
          const data = response.data.data;
          setGuruData(data);
          
          // Populate form with existing data
          setFormData({
            nama_lengkap: data.nama_lengkap || '',
            tanggal_lahir: data.tanggal_lahir || '',
            jenis_kelamin: data.jenis_kelamin || 'L',
            alamat: data.alamat || '',
            no_telepon: data.no_telepon || '',
            status_kepegawaian: data.status_kepegawaian || 'Honorer',
            jabatan: data.jabatan || 'Guru',
            status: data.status || 'Aktif',
            mata_pelajaran: data.mata_pelajaran?.map((mp: MataPelajaran) => mp.id_mata_pelajaran) || []
          });
          
          // Set selected mata pelajaran
          setSelectedMapel(data.mata_pelajaran || []);
        }
      } catch (error) {
        console.error('Error fetching guru data:', error);
        alert('Error mengambil data guru');
        router.push('/admin/guru');
      } finally {
        setDataLoading(false);
      }
    };

    if (nik_guru) {
      fetchGuruData();
    }
  }, [nik_guru, router]);

  // Fetch form options
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await api.get('/guru-form-data');
        if (response.data.success) {
          setFormOptions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setFormDataLoading(false);
      }
    };

    fetchFormData();
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  // Handle mata pelajaran selection
  const handleMapelSelect = (mapel: MataPelajaran) => {
    if (!selectedMapel.find(item => item.id_mata_pelajaran === mapel.id_mata_pelajaran)) {
      const newSelectedMapel = [...selectedMapel, mapel];
      setSelectedMapel(newSelectedMapel);
      setFormData(prev => ({
        ...prev,
        mata_pelajaran: newSelectedMapel.map(item => item.id_mata_pelajaran)
      }));
    }
    setMapelSearchTerm('');
    setShowMapelDropdown(false);
  };

  // Remove mata pelajaran
  const handleMapelRemove = (mapelId: number) => {
    const newSelectedMapel = selectedMapel.filter(item => item.id_mata_pelajaran !== mapelId);
    setSelectedMapel(newSelectedMapel);
    setFormData(prev => ({
      ...prev,
      mata_pelajaran: newSelectedMapel.map(item => item.id_mata_pelajaran)
    }));
  };

  // Filter mata pelajaran based on search
  const filteredMapel = formOptions?.mata_pelajaran.filter(mapel =>
    mapel.nama_mata_pelajaran.toLowerCase().includes(mapelSearchTerm.toLowerCase()) ||
    mapel.kode_mata_pelajaran.toLowerCase().includes(mapelSearchTerm.toLowerCase())
  ).filter(mapel =>
    !selectedMapel.find(selected => selected.id_mata_pelajaran === mapel.id_mata_pelajaran)
  ) || [];

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama_lengkap.trim()) {
      newErrors.nama_lengkap = 'Nama lengkap harus diisi';
    }

    if (!formData.tanggal_lahir) {
      newErrors.tanggal_lahir = 'Tanggal lahir harus diisi';
    } else {
      const birthDate = new Date(formData.tanggal_lahir);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 20 || age > 70) {
        newErrors.tanggal_lahir = 'Umur guru harus antara 20-70 tahun';
      }
    }

    if (formData.no_telepon && !/^[0-9+\-\s]+$/.test(formData.no_telepon)) {
      newErrors.no_telepon = 'Format nomor telepon tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/v1/guru/${nik_guru}`, formData);
      
      if (response.data.success) {
        alert('Data guru berhasil diupdate');
        router.push('/admin/guru');
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};
        
        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0];
        });
        
        setErrors(newErrors);
      } else {
        alert('Error: ' + (error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading || formDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading data guru...</p>
        </div>
      </div>
    );
  }

  if (!guruData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Data guru tidak ditemukan</p>
          <Link href="/admin/guru" className="text-blue-600 hover:underline mt-2 inline-block">
            Kembali ke Daftar Guru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/guru"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Data Guru</h1>
              <p className="text-gray-600 mt-1">
                NIK: {guruData.nik_guru} - {guruData.nama_lengkap}
              </p>
              {guruData.wali_kelas_nama && (
                <p className="text-sm text-blue-600">
                  Wali Kelas: {guruData.wali_kelas_nama}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* NIK (Read Only) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Informasi Dasar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Guru
                </label>
                <input
                  type="text"
                  value={guruData.nik_guru}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  placeholder="NIK tidak dapat diubah"
                />
                <p className="text-xs text-gray-500 mt-1">NIK tidak dapat diubah setelah data dibuat</p>
              </div>
            </div>
          </div>

          {/* Data Pribadi */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Data Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nama_lengkap ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan nama lengkap"
                />
                {errors.nama_lengkap && (
                  <p className="mt-1 text-sm text-red-600">{errors.nama_lengkap}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tanggal_lahir ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.tanggal_lahir && (
                  <p className="mt-1 text-sm text-red-600">{errors.tanggal_lahir}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Telepon
                </label>
                <input
                  type="text"
                  name="no_telepon"
                  value={formData.no_telepon}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.no_telepon ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="08xxx-xxxx-xxxx"
                />
                {errors.no_telepon && (
                  <p className="mt-1 text-sm text-red-600">{errors.no_telepon}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan alamat lengkap"
                />
              </div>
            </div>
          </div>

          {/* Data Kepegawaian */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase size={20} className="mr-2" />
              Data Kepegawaian
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Kepegawaian *
                </label>
                <select
                  name="status_kepegawaian"
                  value={formData.status_kepegawaian}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formOptions?.status_kepegawaian_options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jabatan *
                </label>
                <select
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formOptions?.jabatan_options.map(option => (
                    <option key={option} value={option}>
                      {option.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen size={20} className="mr-2" />
              Mata Pelajaran
            </h2>
            
            {/* Selected Mata Pelajaran */}
            {selectedMapel.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Mata Pelajaran Dipilih:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMapel.map(mapel => (
                    <div
                      key={mapel.id_mata_pelajaran}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{mapel.nama_mata_pelajaran}</span>
                      <button
                        type="button"
                        onClick={() => handleMapelRemove(mapel.id_mata_pelajaran)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Mata Pelajaran */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tambah Mata Pelajaran
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mapelSearchTerm}
                  onChange={(e) => {
                    setMapelSearchTerm(e.target.value);
                    setShowMapelDropdown(true);
                  }}
                  onFocus={() => setShowMapelDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cari mata pelajaran..."
                />
                <Plus size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Dropdown */}
              {showMapelDropdown && filteredMapel.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMapel.map(mapel => (
                    <button
                      key={mapel.id_mata_pelajaran}
                      type="button"
                      onClick={() => handleMapelSelect(mapel)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{mapel.nama_mata_pelajaran}</div>
                      <div className="text-sm text-gray-500">{mapel.kode_mata_pelajaran} - {mapel.kategori}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/guru"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Update Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}