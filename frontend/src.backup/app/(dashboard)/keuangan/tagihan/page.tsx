'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import BulkPaymentModal from '@/components/Bulkpaymentmodal';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

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

interface SelectedPayment {
  tagihan: Tagihan & {
    jenis_pembayaran: string;
  };
  siswa: {
    nis: string;
    nama_lengkap: string;
  };
  jenisPembayaran: string;
  totalTerbayar: number;
}

interface PembayaranSummary {
  [key: number]: {
    total_terbayar: number;
    jumlah_pembayaran: number;
  };
}

interface BulkPaymentItem {
  id_tagihan: number;
  siswa_nama: string;
  jenis_pembayaran: string;
  nominal_tagihan: number;
  sisa_bayar: number;
  bulan_tahun: string;
}

interface DashboardStats {
  total_tagihan: number;
  total_terbayar: number;
  total_sisa: number;
  jumlah_lunas: number;
  jumlah_belum_bayar: number;
  jumlah_cicilan: number;
  jumlah_overdue: number;
}

export default function TagihanPage() {
  // Route protection - redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'tagihan',
    redirectTo: '/dashboard'
  });

  // Get permissions from centralized system
  const { canCreate, canEdit, canDelete } = usePermission('tagihan');

  const [loading, setLoading] = useState(true);
  const [siswaData, setSiswaData] = useState<SiswaData[]>([]);
  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaran[]>([]);
  const [formData, setFormData] = useState<FormData>({ kelas: [] });
  const [pembayaranSummary, setPembayaranSummary] = useState<PembayaranSummary>({});
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_tagihan: 0,
    total_terbayar: 0,
    total_sisa: 0,
    jumlah_lunas: 0,
    jumlah_belum_bayar: 0,
    jumlah_cicilan: 0,
    jumlah_overdue: 0
  });

  // Bulk selection
  const [selectedTagihan, setSelectedTagihan] = useState<Set<number>>(new Set());
  const [selectedTagihanData, setSelectedTagihanData] = useState<Map<number, BulkPaymentItem>>(new Map());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [tahunFilter, setTahunFilter] = useState(new Date().getFullYear().toString());
  const [bulanFilter, setBulanFilter] = useState(() => {
    const m = new Date().getMonth() + 1;
    return m < 10 ? `0${m}` : String(m);
  });
  const [statusFilter, setStatusFilter] = useState('');

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null);

  // Bulk Payment Modal
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);

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

  const bulanOptions = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const statusOptions = [
    { value: 'Belum_Bayar', label: 'Belum Bayar' },
    { value: 'Cicilan', label: 'Cicilan' },
    { value: 'Lunas', label: 'Lunas' },
    { value: 'Overdue', label: 'Terlambat' }
  ];

  const getPaidAmount = useCallback((tagihan: Tagihan): number => {
    const nominal = parseFloat(tagihan.nominal_tagihan);
    const summaryPaid = pembayaranSummary[tagihan.id_tagihan]?.total_terbayar || 0;
    if (tagihan.status_tagihan === 'Lunas') return nominal;
    return Math.min(summaryPaid, nominal);
  }, [pembayaranSummary]);

  // Calculate dashboard stats
  const calculateDashboardStats = useCallback((siswaList: SiswaData[]) => {
    const stats: DashboardStats = {
      total_tagihan: 0,
      total_terbayar: 0,
      total_sisa: 0,
      jumlah_lunas: 0,
      jumlah_belum_bayar: 0,
      jumlah_cicilan: 0,
      jumlah_overdue: 0
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    siswaList.forEach((siswa) => {
      Object.values(siswa.tagihan).forEach((tagihanList) => {
        if (tagihanList) {
          tagihanList.forEach((t) => {
            const nominal = parseFloat(t.nominal_tagihan);
            const terbayar = getPaidAmount(t);
            const sisa = nominal - terbayar;

            stats.total_tagihan += nominal;
            stats.total_terbayar += terbayar;
            stats.total_sisa += sisa;

            if (terbayar >= nominal) {
              stats.jumlah_lunas++;
            } else if (terbayar > 0) {
              stats.jumlah_cicilan++;
            } else {
              stats.jumlah_belum_bayar++;
            }

            if (terbayar < nominal) {
              const dueDate = new Date(t.tanggal_jatuh_tempo);
              dueDate.setHours(0, 0, 0, 0);
              if (dueDate < today) {
                stats.jumlah_overdue++;
              }
            }
          });
        }
      });
    });

    setDashboardStats(stats);
  }, [getPaidAmount]);

  const fetchFormData = useCallback(async () => {
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
  }, []);

  const fetchPembayaranSummary = useCallback(async (tagihanIds: number[]) => {
    if (tagihanIds.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/tagihan-pembayaran-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagihan_ids: tagihanIds })
      });

      const data = await response.json();
      if (data.success) {
        setPembayaranSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching pembayaran summary:', error);
    }
  }, []);

  const fetchPivotData = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '5000',
        tahun_tagihan: tahunFilter,
        ...(searchTerm && { search: searchTerm }),
        ...(kelasFilter && { id_kelas: kelasFilter }),
        ...(bulanFilter && { bulan_tagihan: bulanFilter })
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
        let filteredSiswa = data.data.siswa;

        if (bulanFilter || statusFilter) {
          filteredSiswa = filteredSiswa.map((siswa: SiswaData) => {
            const filteredTagihan: { [key: number]: Tagihan[] | null } = {};
            
            Object.keys(siswa.tagihan).forEach((jpId) => {
              const key = parseInt(jpId, 10);
              const tagihanList = siswa.tagihan[key];
              if (!tagihanList) {
                filteredTagihan[key] = null;
                return;
              }

              const filtered = tagihanList.filter((t: Tagihan) => {
                let match = true;
                if (bulanFilter && t.bulan_tagihan !== bulanFilter) match = false;
                if (statusFilter && t.status_tagihan !== statusFilter) match = false;
                return match;
              });

              filteredTagihan[key] = filtered.length > 0 ? filtered : null;
            });

            return { ...siswa, tagihan: filteredTagihan };
          });
        }

        setSiswaData(filteredSiswa);
        setJenisPembayaran(data.data.jenis_pembayaran);
        if (data.meta) {
          setPagination(data.meta);
        }

        const tagihanIds: number[] = [];
        filteredSiswa.forEach((siswa: SiswaData) => {
          Object.values(siswa.tagihan).forEach((tagihanList) => {
            if (tagihanList) {
              tagihanList.forEach((t: Tagihan) => {
                tagihanIds.push(t.id_tagihan);
              });
            }
          });
        });

        if (tagihanIds.length > 0) {
          await fetchPembayaranSummary(tagihanIds);
        }
      }
    } catch (error) {
      console.error('Error fetching pivot data:', error);
    } finally {
      setLoading(false);
    }
  }, [tahunFilter, searchTerm, kelasFilter, bulanFilter, statusFilter, fetchPembayaranSummary]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  useEffect(() => {
    fetchPivotData(currentPage);
    setSelectedTagihan(new Set());
    setSelectedTagihanData(new Map());
  }, [currentPage, tahunFilter, fetchPivotData]);

  useEffect(() => {
    calculateDashboardStats(siswaData);
  }, [siswaData, calculateDashboardStats]);

  useEffect(() => {
    calculateDashboardStats(siswaData);
  }, [pembayaranSummary, siswaData, calculateDashboardStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPivotData(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setKelasFilter('');
    setTahunFilter(new Date().getFullYear().toString());
    setBulanFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchPivotData(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyShort = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}jt`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
    return num.toString();
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      'Lunas': <CheckCircle className="w-4 h-4 text-green-600" />,
      'Belum_Bayar': <Clock className="w-4 h-4 text-yellow-600" />,
      'Cicilan': <DollarSign className="w-4 h-4 text-blue-600" />,
      'Overdue': <AlertCircle className="w-4 h-4 text-red-600" />
    };
    return icons[status] || <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Lunas': 'bg-green-50 border-green-300 border-2',
      'Belum_Bayar': 'bg-yellow-50 border-yellow-200',
      'Cicilan': 'bg-blue-50 border-blue-200',
      'Overdue': 'bg-red-50 border-red-300 border-2'
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  const getBulanName = (bulan: string | null) => {
    if (!bulan) return '';
    const bulanNames: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
      '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
    };
    return bulanNames[bulan] || bulan;
  };

  const isOverdue = (tanggalJatuhTempo: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(tanggalJatuhTempo);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getRealStatus = (tagihan: Tagihan): string => {
    if (tagihan.status_tagihan === 'Lunas') return 'Lunas';
    const nominal = parseFloat(tagihan.nominal_tagihan);
    const terbayar = getPaidAmount(tagihan);
    if (terbayar >= nominal) return 'Lunas';
    if (terbayar > 0) return 'Cicilan';
    return 'Belum_Bayar';
  };

  const getSiswaTotal = useCallback((siswa: SiswaData) => {
    let total = 0;
    let terbayar = 0;

    Object.values(siswa.tagihan).forEach((tagihanList) => {
      if (tagihanList) {
        tagihanList.forEach((t) => {
          total += parseFloat(t.nominal_tagihan);
          terbayar += getPaidAmount(t);
        });
      }
    });

    return {
      total,
      terbayar,
      sisa: total - terbayar,
      percentage: total > 0 ? (terbayar / total) * 100 : 0
    };
  }, [getPaidAmount]);

  const handleToggleSelect = (
    tagihan: Tagihan, 
    siswa: SiswaData, 
    jenisPembayaran: string
  ) => {
    const newSelected = new Set(selectedTagihan);
    const newData = new Map(selectedTagihanData);
    
    if (newSelected.has(tagihan.id_tagihan)) {
      newSelected.delete(tagihan.id_tagihan);
      newData.delete(tagihan.id_tagihan);
    } else {
      newSelected.add(tagihan.id_tagihan);
      const paid = getPaidAmount(tagihan);
      newData.set(tagihan.id_tagihan, {
        id_tagihan: tagihan.id_tagihan,
        siswa_nama: siswa.nama_lengkap,
        jenis_pembayaran: jenisPembayaran,
        nominal_tagihan: parseFloat(tagihan.nominal_tagihan),
        sisa_bayar: parseFloat(tagihan.nominal_tagihan) - paid,
        bulan_tahun: tagihan.bulan_tagihan 
          ? `${getBulanName(tagihan.bulan_tagihan)} ${tagihan.tahun_tagihan}`
          : tagihan.tahun_tagihan
      });
    }
    
    setSelectedTagihan(newSelected);
    setSelectedTagihanData(newData);
  };

  const handleBayar = (tagihan: Tagihan, siswa: SiswaData, jenisPembayaran: string) => {
    const totalTerbayar = getPaidAmount(tagihan);
    
    setSelectedPayment({
      tagihan: {
        ...tagihan,
        jenis_pembayaran: jenisPembayaran
      },
      siswa: {
        nis: siswa.nis,
        nama_lengkap: siswa.nama_lengkap
      },
      jenisPembayaran,
      totalTerbayar
    });
    setShowPaymentModal(true);
  };

  const handleBulkPayment = () => {
    setShowBulkPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    alert('✅ Pembayaran berhasil dikonfirmasi!');
    window.location.reload();
  };

  const handleBulkPaymentSuccess = () => {
    setShowBulkPaymentModal(false);
    setSelectedTagihan(new Set());
    setSelectedTagihanData(new Map());
    alert('✅ Pembayaran massal berhasil dikonfirmasi!');
    window.location.reload();
  };

  // Show loading while checking permission
  if (permLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authorized, return null (will redirect)
  if (!isAuthorized) {
    return null;
  }

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
            <p className="text-gray-600 mt-1">Kelola pembayaran siswa dalam satu tampilan</p>
          </div>
          
          <div className="flex space-x-3">
            {selectedTagihan.size > 0 && canCreate && (
              <button
                onClick={handleBulkPayment}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Bayar Terpilih ({selectedTagihan.size})
              </button>
            )}
            <button
              onClick={() => {/* TODO: Export Excel */}}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats cards sama seperti sebelumnya */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tagihan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboardStats.total_tagihan)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardStats.jumlah_lunas + dashboardStats.jumlah_belum_bayar + dashboardStats.jumlah_cicilan} tagihan
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sudah Terbayar</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(dashboardStats.total_terbayar)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {dashboardStats.jumlah_lunas} lunas
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sisa Tagihan</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(dashboardStats.total_sisa)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardStats.jumlah_belum_bayar + dashboardStats.jumlah_cicilan} belum lunas
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terlambat</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {dashboardStats.jumlah_overdue}
              </p>
              <p className="text-xs text-orange-600 mt-1">Perlu perhatian</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch}>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[260px] relative">
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
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
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
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
              <input
                type="number"
                min="2020"
                max="2099"
                value={tahunFilter}
                onChange={(e) => setTahunFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bulan</label>
              <select
                value={bulanFilter}
                onChange={(e) => setBulanFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Bulan</option>
                {bulanOptions.map((bulan) => (
                  <option key={bulan.value} value={bulan.value}>
                    {bulan.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>
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
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r border-black min-w-[280px]">
                      Siswa & Total Tagihan
                    </th>
                    {jenisPembayaran.map((jp) => (
                      <th
                        key={jp.id_jenis_pembayaran}
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r border-black min-w-[160px]"
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
                <tbody className="bg-white divide-y divide-black">
                  {siswaData.map((siswa) => {
                    const siswaTotal = getSiswaTotal(siswa);
                    
                    return (
                      <tr key={siswa.nis} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-black">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {siswa.nama_lengkap}
                            </span>
                            <span className="text-xs text-gray-500">{siswa.nis}</span>
                            <span className="text-xs text-gray-500">
                              {siswa.nama_kelas} • {siswa.nama_jurusan}
                            </span>
                            
                            {/* Total Tagihan Siswa */}
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatCurrency(siswaTotal.total)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-600">Terbayar:</span>
                                <span className="font-semibold text-green-700">
                                  {formatCurrency(siswaTotal.terbayar)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs mb-2">
                                <span className="text-red-600">Sisa:</span>
                                <span className="font-semibold text-red-700">
                                  {formatCurrency(siswaTotal.sisa)}
                                </span>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    siswaTotal.percentage === 100 
                                      ? 'bg-green-500' 
                                      : siswaTotal.percentage > 50 
                                      ? 'bg-blue-500' 
                                      : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${siswaTotal.percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 text-right">
                                {siswaTotal.percentage.toFixed(1)}% terbayar
                              </p>
                            </div>
                          </div>
                        </td>
                        {jenisPembayaran.map((jp) => {
                          const tagihanList = siswa.tagihan[jp.id_jenis_pembayaran];
                          
                          return (
                            <td
                              key={jp.id_jenis_pembayaran}
                              className="px-2 py-2 text-center border-r border-black"
                            >
                              {tagihanList && tagihanList.length > 0 ? (
                                <div className="space-y-1">
                                  {tagihanList.map((tagihan) => {
                                    const totalTerbayar = getPaidAmount(tagihan);
                                    const sisaBayar = parseFloat(tagihan.nominal_tagihan) - totalTerbayar;
                                    const realStatus = getRealStatus(tagihan); // Use real status
                                    const overdue = isOverdue(tagihan.tanggal_jatuh_tempo) && realStatus !== 'Lunas';
                                    const isSelected = selectedTagihan.has(tagihan.id_tagihan);
                                    
                                    return (
                                      <div
                                        key={tagihan.id_tagihan}
                                        className={`p-2 rounded border ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-50 border-2'
                                            : overdue 
                                            ? 'bg-red-50 border-red-300 border-2' 
                                            : getStatusColor(realStatus)
                                        }`}
                                      >
                                        {/* Checkbox - only for unpaid */}
                                        {realStatus !== 'Lunas' && (
                                          <div className="flex justify-center mb-1">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleToggleSelect(tagihan, siswa, jp.nama_pembayaran)}
                                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center justify-center mb-1">
                                          {getStatusIcon(overdue ? 'Overdue' : realStatus)}
                                        </div>
                                        {tagihan.bulan_tagihan && (
                                          <div className="text-[10px] text-gray-600 font-medium">
                                            {getBulanName(tagihan.bulan_tagihan)}
                                          </div>
                                        )}
                                        <div className="text-xs font-semibold text-gray-900">
                                          {formatCurrencyShort(tagihan.nominal_tagihan)}
                                        </div>
                                        
                                        {/* Info Cicilan */}
                                        {totalTerbayar > 0 && realStatus !== 'Lunas' && (
                                          <div className="mt-1 text-[9px] space-y-0.5">
                                            <div className="text-green-700 font-semibold">
                                              Bayar: {formatCurrencyShort(totalTerbayar)}
                                            </div>
                                            <div className="text-red-700 font-semibold">
                                              Sisa: {formatCurrencyShort(sisaBayar)}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Tombol Bayar */}
                                        {realStatus !== 'Lunas' && (
                                          <button
                                            onClick={() => handleBayar(tagihan, siswa, jp.nama_pembayaran)}
                                            className={`mt-2 w-full px-2 py-1 text-white text-[10px] rounded transition-colors flex items-center justify-center font-medium ${
                                              overdue
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                          >
                                            <CreditCard className="w-3 h-3 mr-1" />
                                            {realStatus === 'Cicilan' ? 'Lanjut' : 'Bayar'}
                                          </button>
                                        )}
                                        
                                        {/* Link Detail */}
                                        <Link
                                          href={`/keuangan/tagihan/${tagihan.id_tagihan}`}
                                          className="block mt-1 text-[9px] text-blue-600 hover:text-blue-700"
                                        >
                                          Detail
                                        </Link>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-gray-300 text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Keterangan:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <span className="text-sm text-gray-700">Terlambat (Border Merah)</span>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-700">Centang untuk bayar massal</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
          tagihan={selectedPayment.tagihan}
          sisaBayar={parseFloat(selectedPayment.tagihan.nominal_tagihan) - selectedPayment.totalTerbayar}
        />
      )}

      {/* Bulk Payment Modal */}
      <BulkPaymentModal
        isOpen={showBulkPaymentModal}
        onClose={() => setShowBulkPaymentModal(false)}
        onSuccess={handleBulkPaymentSuccess}
        items={Array.from(selectedTagihanData.values())}
      />
    </div>
  );
}
