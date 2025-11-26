'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Eye,
  FileText,
  Filter,
  X,
  Calendar,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';

interface DashboardStats {
  summary: {
    total_tagihan: { nominal: number; jumlah: number };
    sudah_bayar: { nominal: number; jumlah: number; persentase: number };
    belum_bayar: { nominal: number; jumlah: number; persentase: number };
    cicilan: { nominal: number; jumlah: number; persentase: number };
    overdue: { nominal: number; jumlah: number; persentase: number };
  };
  tagihan_per_kelas: Array<{
    nama_kelas: string;
    jumlah_tagihan: number;
    total_nominal: string;
    sudah_bayar: string;
    belum_bayar: string;
  }>;
}

interface Tagihan {
  id_tagihan: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  nama_jurusan: string;
  jenis_pembayaran: string;
  bulan_tagihan: string | null;
  tahun_tagihan: string;
  nominal_tagihan: string;
  tanggal_jatuh_tempo: string;
  status_tagihan: string;
  tahun_ajaran: string;
}

interface FormData {
  kelas: Array<{ id: number; nama_kelas: string; nama_jurusan: string }>;
  status_tagihan: Array<{ value: string; label: string }>;
  bulan: Array<{ value: string; label: string }>;
}

export default function TagihanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [formData, setFormData] = useState<FormData>({
    kelas: [],
    status_tagihan: [],
    bulan: []
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [bulanFilter, setBulanFilter] = useState('');
  const [tahunFilter, setTahunFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  });

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/tagihan-dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch form data
  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/tagihan-form-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  // Fetch tagihan
  const fetchTagihan = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '15',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status_tagihan: statusFilter }),
        ...(kelasFilter && { id_kelas: kelasFilter }),
        ...(bulanFilter && { bulan_tagihan: bulanFilter }),
        ...(tahunFilter && { tahun_tagihan: tahunFilter })
      });

      const response = await fetch(
        `http://localhost:8000/api/v1/tagihan?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTagihan(data.data);
        if (data.meta) {
          setPagination(data.meta);
        }
      }
    } catch (error) {
      console.error('Error fetching tagihan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFormData();
    fetchTagihan(currentPage);
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTagihan(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setKelasFilter('');
    setBulanFilter('');
    setTahunFilter('');
    setCurrentPage(1);
    fetchTagihan(1);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'Belum_Bayar': 'bg-yellow-100 text-yellow-800',
      'Cicilan': 'bg-blue-100 text-blue-800',
      'Lunas': 'bg-green-100 text-green-800',
      'Overdue': 'bg-red-100 text-red-800'
    };
    
    const labels: any = {
      'Belum_Bayar': 'Belum Bayar',
      'Cicilan': 'Cicilan',
      'Lunas': 'Lunas',
      'Overdue': 'Terlambat'
    };

    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getBulanName = (bulan: string | null) => {
    if (!bulan) return '-';
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
          <span className="text-gray-900 font-medium">Tagihan</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tagihan & Pembayaran</h1>
            <p className="text-gray-600 mt-1">Kelola tagihan siswa dan konfirmasi pembayaran</p>
          </div>
          
          <Link
            href="/keuangan/tagihan/pivot"
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Pivot View
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          <div className="col-span-5 flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : stats && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tagihan</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.summary.total_tagihan.nominal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.total_tagihan.jumlah} tagihan
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sudah Lunas</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(stats.summary.sudah_bayar.nominal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.sudah_bayar.jumlah} tagihan ({stats.summary.sudah_bayar.persentase}%)
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Belum Bayar</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {formatCurrency(stats.summary.belum_bayar.nominal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.belum_bayar.jumlah} tagihan ({stats.summary.belum_bayar.persentase}%)
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cicilan</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {formatCurrency(stats.summary.cicilan.nominal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.cicilan.jumlah} tagihan
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terlambat</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(stats.summary.overdue.nominal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.summary.overdue.jumlah} tagihan
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </>
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Status</option>
                  {formData.status_tagihan.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

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
                  Bulan
                </label>
                <select
                  value={bulanFilter}
                  onChange={(e) => setBulanFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Semua Bulan</option>
                  {formData.bulan.map((bulan) => (
                    <option key={bulan.value} value={bulan.value}>
                      {bulan.label}
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
                  placeholder="2025"
                  value={tahunFilter}
                  onChange={(e) => setTahunFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tagihan.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada tagihan
            </h3>
            <p className="text-gray-600">
              Generate tagihan dari menu Jenis Pembayaran
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jenis Pembayaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Periode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nominal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Jatuh Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tagihan.map((item) => (
                    <tr key={item.id_tagihan} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {item.nama_siswa}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.nis} • {item.nama_kelas}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.jenis_pembayaran}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getBulanName(item.bulan_tagihan)} {item.tahun_tagihan}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(item.nominal_tagihan)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(item.tanggal_jatuh_tempo)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status_tagihan)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-2">
                          <Link
                            href={`/keuangan/tagihan/${item.id_tagihan}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
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
                  <span className="font-medium">{pagination.total}</span> tagihan
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
    </div>
  );
}