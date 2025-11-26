'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

interface Tagihan {
  id_tagihan: number;
  bulan_tagihan: string | null;
  tahun_tagihan: string;
  nominal_tagihan: string;
  status_tagihan: string;
  tanggal_jatuh_tempo: string;
}

interface SiswaData {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
  nama_jurusan: string;
  tagihan: {
    [key: number]: Tagihan[] | null;
  };
}

interface JenisPembayaran {
  id_jenis_pembayaran: number;
  nama_pembayaran: string;
  kode: string;
}

interface FormData {
  kelas: Array<{ id: number; nama_kelas: string; nama_jurusan: string }>;
}

export default function TagihanPivotPage() {
  const [loading, setLoading] = useState(true);
  const [siswaData, setSiswaData] = useState<SiswaData[]>([]);
  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaran[]>([]);
  const [formData, setFormData] = useState<FormData>({ kelas: [] });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [tahunFilter, setTahunFilter] = useState(new Date().getFullYear().toString());
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 0,
    to: 0
  });

  // Fetch form data
  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/tagihan-form-data', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  // Fetch pivot data
  const fetchPivotData = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        tahun_tagihan: tahunFilter,
        ...(searchTerm && { search: searchTerm }),
        ...(kelasFilter && { id_kelas: kelasFilter })
      });

      const response = await fetch(
        `http://localhost:8000/api/v1/tagihan-pivot?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSiswaData(data.data.siswa);
        setJenisPembayaran(data.data.jenis_pembayaran);
        if (data.meta) {
          setPagination(data.meta);
        }
      }
    } catch (error) {
      console.error('Error fetching pivot data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchPivotData(currentPage);
  }, [currentPage, tahunFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPivotData(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setKelasFilter('');
    setTahunFilter(new Date().getFullYear().toString());
    setCurrentPage(1);
    fetchPivotData(1);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      'Lunas': <CheckCircle className="w-4 h-4 text-green-600" />,
      'Belum_Bayar': <Clock className="w-4 h-4 text-yellow-600" />,
      'Cicilan': <DollarSign className="w-4 h-4 text-blue-600" />,
      'Overdue': <AlertCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Lunas': 'bg-green-50 border-green-200',
      'Belum_Bayar': 'bg-yellow-50 border-yellow-200',
      'Cicilan': 'bg-blue-50 border-blue-200',
      'Overdue': 'bg-red-50 border-red-200'
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  const getBulanName = (bulan: string | null) => {
    if (!bulan) return '';
    const bulanNames: any = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
      '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
    };
    return bulanNames[bulan] || bulan;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <Link href="/keuangan" className="hover:text-blue-600">Keuangan</Link>
          <span>/</span>
          <Link href="/keuangan/tagihan" className="hover:text-blue-600">Tagihan</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Pivot View</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tagihan Per Siswa</h1>
            <p className="text-gray-600 mt-1">Lihat semua tagihan siswa dalam satu tampilan</p>
          </div>
          
          <Link
            href="/keuangan/tagihan"
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Kembali ke List View
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Filter & Pencarian</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari NIS atau nama siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cari
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas
                </label>
                <select
                  value={kelasFilter}
                  onChange={(e) => setKelasFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Kelas</option>
                  {formData.kelas.map((kelas) => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas} - {kelas.nama_jurusan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2099"
                  value={tahunFilter}
                  onChange={(e) => setTahunFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full flex items-center justify-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Pivot Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : siswaData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Tidak ada data siswa</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-gray-200 min-w-[200px]">
                      Siswa
                    </th>
                    {jenisPembayaran.map((jp) => (
                      <th
                        key={jp.id_jenis_pembayaran}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-200 min-w-[120px]"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-semibold">{jp.kode}</span>
                          <span className="text-[10px] font-normal text-gray-400 mt-1">
                            {jp.nama_pembayaran}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {siswaData.map((siswa) => (
                    <tr key={siswa.nis} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-gray-200">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {siswa.nama_lengkap}
                          </span>
                          <span className="text-xs text-gray-500">
                            {siswa.nis}
                          </span>
                          <span className="text-xs text-gray-500">
                            {siswa.nama_kelas} • {siswa.nama_jurusan}
                          </span>
                        </div>
                      </td>
                      {jenisPembayaran.map((jp) => {
                        const tagihanList = siswa.tagihan[jp.id_jenis_pembayaran];
                        
                        return (
                          <td
                            key={jp.id_jenis_pembayaran}
                            className="px-2 py-2 text-center border-r border-gray-200"
                          >
                            {tagihanList && tagihanList.length > 0 ? (
                              <div className="space-y-1">
                                {tagihanList.map((tagihan) => (
                                  <Link
                                    key={tagihan.id_tagihan}
                                    href={`/keuangan/tagihan/${tagihan.id_tagihan}`}
                                    className={`block p-2 rounded border ${getStatusColor(tagihan.status_tagihan)} hover:shadow-md transition-shadow`}
                                  >
                                    <div className="flex items-center justify-center mb-1">
                                      {getStatusIcon(tagihan.status_tagihan)}
                                    </div>
                                    {tagihan.bulan_tagihan && (
                                      <div className="text-[10px] text-gray-600 font-medium">
                                        {getBulanName(tagihan.bulan_tagihan)}
                                      </div>
                                    )}
                                    <div className="text-xs font-semibold text-gray-900">
                                      {formatCurrency(tagihan.nominal_tagihan)}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-300 text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{pagination.from}</span> sampai{' '}
                  <span className="font-medium">{pagination.to}</span> dari{' '}
                  <span className="font-medium">{pagination.total}</span> siswa
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {[...Array(pagination.last_page)].map((_, idx) => {
                      const page = idx + 1;
                      if (
                        page === 1 ||
                        page === pagination.last_page ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                    disabled={currentPage === pagination.last_page}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Keterangan Status:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">Lunas</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-700">Belum Bayar</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">Cicilan</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-gray-700">Terlambat</span>
          </div>
        </div>
      </div>
    </div>
  );
}