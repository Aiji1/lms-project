'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  X,
  Calendar,
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface FormData {
  kode: string;
  nama: string;
  nominal: string;
  deskripsi: string;
  tipe_periode: 'bulanan' | 'custom' | 'sekali';
  tipe_siswa: 'semua' | 'kelas' | 'individu';
  id_tahun_ajaran: string;
  is_active: boolean;
  periode_bulan: number[];
  id_kelas: number[];
  id_siswa: number[];
}

interface FormOptions {
  tahun_ajaran: Array<{ id: number; tahun_ajaran: string }>;
  kelas: Array<{ id: number; nama_kelas: string; nama_jurusan: string }>;
  siswa: Array<{ id: number; nama_lengkap: string; nis: string }>;
  tipe_periode: Array<{ value: string; label: string }>;
  tipe_siswa: Array<{ value: string; label: string }>;
  bulan: Array<{ value: number; label: string }>;
}

interface FormErrors {
  [key: string]: string[];
}

export default function TambahJenisPembayaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    tahun_ajaran: [],
    kelas: [],
    siswa: [],
    tipe_periode: [],
    tipe_siswa: [],
    bulan: []
  });
  
  const [formData, setFormData] = useState<FormData>({
    kode: '',
    nama: '',
    nominal: '',
    deskripsi: '',
    tipe_periode: 'sekali',
    tipe_siswa: 'semua',
    id_tahun_ajaran: '',
    is_active: true,
    periode_bulan: [],
    id_kelas: [],
    id_siswa: []
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [searchKelas, setSearchKelas] = useState('');
  const [searchSiswa, setSearchSiswa] = useState('');

  // Fetch form options
  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:8000/api/v1/jenis-pembayaran-form-data',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch form options');
      }

      const data = await response.json();
      
      if (data.success) {
        setFormOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
      alert('Gagal memuat data form');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'nominal') {
      // Only allow numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle radio change
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Reset related fields when changing type
      ...(name === 'tipe_periode' && value !== 'custom' ? { periode_bulan: [] } : {}),
      ...(name === 'tipe_siswa' && value === 'semua' ? { id_kelas: [], id_siswa: [] } : {}),
      ...(name === 'tipe_siswa' && value === 'kelas' ? { id_siswa: [] } : {}),
      ...(name === 'tipe_siswa' && value === 'individu' ? { id_kelas: [] } : {})
    }));
  };

  // Handle bulan toggle
  const handleBulanToggle = (bulanValue: number) => {
    setFormData(prev => {
      const periode_bulan = prev.periode_bulan.includes(bulanValue)
        ? prev.periode_bulan.filter(b => b !== bulanValue)
        : [...prev.periode_bulan, bulanValue].sort((a, b) => a - b);
      return { ...prev, periode_bulan };
    });
  };

  // Handle kelas toggle
  const handleKelasToggle = (kelasId: number) => {
    setFormData(prev => {
      const id_kelas = prev.id_kelas.includes(kelasId)
        ? prev.id_kelas.filter(k => k !== kelasId)
        : [...prev.id_kelas, kelasId];
      return { ...prev, id_kelas };
    });
  };

  // Handle siswa toggle
  const handleSiswaToggle = (siswaId: number) => {
    setFormData(prev => {
      const id_siswa = prev.id_siswa.includes(siswaId)
        ? prev.id_siswa.filter(s => s !== siswaId)
        : [...prev.id_siswa, siswaId];
      return { ...prev, id_siswa };
    });
  };

  // Handle select all kelas
  const handleSelectAllKelas = () => {
    const filteredKelas = formOptions.kelas.filter(k => {
      const nk = (k.nama_kelas || '').toLowerCase();
      const nj = (k.nama_jurusan || '').toLowerCase();
      const q = searchKelas.toLowerCase();
      return nk.includes(q) || nj.includes(q);
    });
    
    const allSelected = filteredKelas.every(k => formData.id_kelas.includes(k.id));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        id_kelas: prev.id_kelas.filter(id => !filteredKelas.find(k => k.id === id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        id_kelas: [...new Set([...prev.id_kelas, ...filteredKelas.map(k => k.id)])]
      }));
    }
  };

  // Handle select all siswa
  const handleSelectAllSiswa = () => {
    const filteredSiswa = formOptions.siswa.filter(s => {
      const nl = (s.nama_lengkap || '').toLowerCase();
      const q = searchSiswa.toLowerCase();
      return nl.includes(q) || (s.nis || '').includes(searchSiswa);
    });
    
    const allSelected = filteredSiswa.every(s => formData.id_siswa.includes(s.id));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        id_siswa: prev.id_siswa.filter(id => !filteredSiswa.find(s => s.id === id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        id_siswa: [...new Set([...prev.id_siswa, ...filteredSiswa.map(s => s.id)])]
      }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: FormErrors = {};
    
    if (!formData.kode) errors.kode = ['Kode wajib diisi'];
    if (!formData.nama) errors.nama = ['Nama wajib diisi'];
    if (!formData.nominal) errors.nominal = ['Nominal wajib diisi'];
    if (!formData.id_tahun_ajaran) errors.id_tahun_ajaran = ['Tahun ajaran wajib dipilih'];
    
    if (formData.tipe_periode === 'custom' && formData.periode_bulan.length === 0) {
      errors.periode_bulan = ['Pilih minimal 1 bulan untuk tipe periode custom'];
    }
    
    if (formData.tipe_siswa === 'kelas' && formData.id_kelas.length === 0) {
      errors.id_kelas = ['Pilih minimal 1 kelas'];
    }
    
    if (formData.tipe_siswa === 'individu' && formData.id_siswa.length === 0) {
      errors.id_siswa = ['Pilih minimal 1 siswa'];
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      const token = localStorage.getItem('token');

      const siswaNis = formData.tipe_siswa === 'individu'
        ? formData.id_siswa
            .map(id => formOptions.siswa.find(s => s.id === id)?.nis)
            .filter((x): x is string => Boolean(x))
        : [];

      const payload = {
        kode: formData.kode,
        nama_pembayaran: formData.nama,
        deskripsi: formData.deskripsi,
        nominal: parseInt(formData.nominal),
        tipe_periode: formData.tipe_periode,
        tipe_siswa: formData.tipe_siswa,
        id_tahun_ajaran: parseInt(formData.id_tahun_ajaran),
        periode_bulan: formData.tipe_periode === 'custom' ? formData.periode_bulan : [],
        kelas_ids: formData.tipe_siswa === 'kelas' ? formData.id_kelas : [],
        siswa_nis: siswaNis,
        is_active: formData.is_active,
      };

      const response = await fetch('http://localhost:8000/api/v1/jenis-pembayaran', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Jenis pembayaran berhasil ditambahkan');
        router.push('/keuangan/jenis-pembayaran');
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
        } else {
          throw new Error(data.message || 'Gagal menambahkan jenis pembayaran');
        }
      }
    } catch (error: unknown) {
      console.error('Error submitting form:', error);
      const msg = error instanceof Error ? error.message : 'Gagal menambahkan jenis pembayaran';
      alert(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Format currency display
  const formatCurrency = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(value));
  };

  // Filter kelas
  const filteredKelas = formOptions.kelas.filter(k => {
    const nk = (k.nama_kelas || '').toLowerCase();
    const nj = (k.nama_jurusan || '').toLowerCase();
    const q = searchKelas.toLowerCase();
    return nk.includes(q) || nj.includes(q);
  });

  // Filter siswa
  const filteredSiswa = formOptions.siswa.filter(s => {
    const nl = (s.nama_lengkap || '').toLowerCase();
    const q = searchSiswa.toLowerCase();
    return nl.includes(q) || (s.nis || '').includes(searchSiswa);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/keuangan" className="hover:text-blue-600">Keuangan</Link>
          <span>/</span>
          <Link href="/keuangan/jenis-pembayaran" className="hover:text-blue-600">
            Jenis Pembayaran
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Tambah</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Jenis Pembayaran</h1>
            <p className="text-gray-600 mt-1">Buat jenis pembayaran baru untuk sekolah</p>
          </div>
          
          <Link
            href="/keuangan/jenis-pembayaran"
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informasi Dasar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Informasi Dasar
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleChange}
                    placeholder="Contoh: SPP, UANG_PANGKAL"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.kode ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.kode && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.kode[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Contoh: SPP Bulanan"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.nama ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.nama && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.nama[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nominal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <input
                      type="text"
                      name="nominal"
                      value={formatCurrency(formData.nominal)}
                      onChange={handleChange}
                      placeholder="500.000"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.nominal ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.nominal && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.nominal[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun Ajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_tahun_ajaran"
                    value={formData.id_tahun_ajaran}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.id_tahun_ajaran ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {formOptions.tahun_ajaran.map(ta => (
                      <option key={ta.id} value={ta.id}>
                        {ta.tahun_ajaran}
                      </option>
                    ))}
                  </select>
                  {formErrors.id_tahun_ajaran && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.id_tahun_ajaran[0]}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Deskripsi jenis pembayaran (opsional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tipe Periode */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Periode Pembayaran
              </h2>

              <div className="space-y-3">
                {formOptions.tipe_periode.map(option => (
                  <label
                    key={option.value}
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: formData.tipe_periode === option.value ? '#3B82F6' : '#E5E7EB'
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_periode"
                      value={option.value}
                      checked={formData.tipe_periode === option.value}
                      onChange={(e) => handleRadioChange('tipe_periode', e.target.value)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.value === 'bulanan' && 'Pembayaran dilakukan setiap bulan (12x pembayaran)'}
                        {option.value === 'custom' && 'Pembayaran dilakukan pada bulan-bulan tertentu yang dipilih'}
                        {option.value === 'sekali' && 'Pembayaran dilakukan sekali saja dalam tahun ajaran'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Pilihan Bulan untuk Custom */}
              {formData.tipe_periode === 'custom' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Bulan <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {formOptions.bulan.map(bulan => (
                      <button
                        type="button"
                        key={bulan.value}
                        onClick={() => handleBulanToggle(bulan.value)}
                        className={`flex items-center justify-center p-2 rounded-lg border-2 transition-colors focus:outline-none ${
                          formData.periode_bulan.includes(bulan.value)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                        aria-pressed={formData.periode_bulan.includes(bulan.value)}
                      >
                        <span className="text-sm font-medium">{bulan.label}</span>
                      </button>
                    ))}
                  </div>
                  {formErrors.periode_bulan && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.periode_bulan[0]}
                    </p>
                  )}
                  {formData.periode_bulan.length > 0 && (
                    <p className="mt-2 text-sm text-blue-600">
                      Dipilih: {formData.periode_bulan.length} bulan
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Target Siswa */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Target Siswa
              </h2>

              <div className="space-y-3">
                {formOptions.tipe_siswa.map(option => (
                  <label
                    key={option.value}
                    className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: formData.tipe_siswa === option.value ? '#3B82F6' : '#E5E7EB'
                    }}
                  >
                    <input
                      type="radio"
                      name="tipe_siswa"
                      value={option.value}
                      checked={formData.tipe_siswa === option.value}
                      onChange={(e) => handleRadioChange('tipe_siswa', e.target.value)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.value === 'semua' && 'Semua siswa di sekolah akan dikenakan pembayaran ini'}
                        {option.value === 'kelas' && 'Hanya siswa di kelas tertentu yang akan dikenakan'}
                        {option.value === 'individu' && 'Hanya siswa tertentu yang dipilih secara manual'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Pilihan Kelas */}
              {formData.tipe_siswa === 'kelas' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Pilih Kelas <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllKelas}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {filteredKelas.every(k => formData.id_kelas.includes(k.id))
                        ? 'Batal Pilih Semua'
                        : 'Pilih Semua'}
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={searchKelas}
                    onChange={(e) => setSearchKelas(e.target.value)}
                    placeholder="Cari kelas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                  />

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredKelas.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tidak ada kelas ditemukan
                      </p>
                    ) : (
                      filteredKelas.map(kelas => (
                        <button
                          type="button"
                          key={kelas.id}
                          onClick={() => handleKelasToggle(kelas.id)}
                          aria-pressed={formData.id_kelas.includes(kelas.id)}
                          className={`w-full text-left flex items-center p-3 rounded-lg border-2 transition-colors focus:outline-none ${
                            formData.id_kelas.includes(kelas.id)
                              ? 'bg-orange-600 text-white border-orange-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="font-medium">{kelas.nama_kelas}</span>
                            <span className="text-sm ml-2">({kelas.nama_jurusan})</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  
                  {formErrors.id_kelas && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.id_kelas[0]}
                    </p>
                  )}
                  {formData.id_kelas.length > 0 && (
                    <p className="mt-2 text-sm text-orange-600">
                      Dipilih: {formData.id_kelas.length} kelas
                    </p>
                  )}
                </div>
              )}

              {/* Pilihan Siswa */}
              {formData.tipe_siswa === 'individu' && (
                <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Pilih Siswa <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllSiswa}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {filteredSiswa.every(s => formData.id_siswa.includes(s.id))
                        ? 'Batal Pilih Semua'
                        : 'Pilih Semua'}
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                    placeholder="Cari siswa (nama/NIS)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 text-sm"
                  />

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredSiswa.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tidak ada siswa ditemukan
                      </p>
                    ) : (
                      filteredSiswa.map(siswa => (
                        <button
                          type="button"
                          key={siswa.id}
                          onClick={() => handleSiswaToggle(siswa.id)}
                          aria-pressed={formData.id_siswa.includes(siswa.id)}
                          className={`w-full text-left flex items-center p-3 rounded-lg border-2 transition-colors focus:outline-none ${
                            formData.id_siswa.includes(siswa.id)
                              ? 'bg-pink-600 text-white border-pink-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="font-medium">{siswa.nama_lengkap}</span>
                            <span className="text-sm ml-2">({siswa.nis})</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  
                  {formErrors.id_siswa && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.id_siswa[0]}
                    </p>
                  )}
                  {formData.id_siswa.length > 0 && (
                    <p className="mt-2 text-sm text-pink-600">
                      Dipilih: {formData.id_siswa.length} siswa
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Aktif (pembayaran dapat digunakan)
                </span>
              </label>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ringkasan</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Nominal:</span>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.nominal ? `Rp ${formatCurrency(formData.nominal)}` : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Tipe Periode:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formOptions.tipe_periode.find(t => t.value === formData.tipe_periode)?.label}
                  </p>
                </div>
                {formData.tipe_periode === 'custom' && formData.periode_bulan.length > 0 && (
                  <div>
                    <span className="text-gray-600">Bulan:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.periode_bulan.length} bulan dipilih
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Target Siswa:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formOptions.tipe_siswa.find(t => t.value === formData.tipe_siswa)?.label}
                  </p>
                </div>
                {formData.tipe_siswa === 'kelas' && formData.id_kelas.length > 0 && (
                  <div>
                    <span className="text-gray-600">Jumlah Kelas:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.id_kelas.length} kelas
                    </p>
                  </div>
                )}
                {formData.tipe_siswa === 'individu' && formData.id_siswa.length > 0 && (
                  <div>
                    <span className="text-gray-600">Jumlah Siswa:</span>
                    <p className="font-medium text-gray-900 mt-1">
                      {formData.id_siswa.length} siswa
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Jenis Pembayaran
                  </>
                )}
              </button>
              
              <Link
                href="/keuangan/jenis-pembayaran"
                className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                <X className="w-5 h-5 mr-2" />
                Batal
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
