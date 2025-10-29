'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  BookOpen,
  Calendar,
  User,
  Clock,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

interface JurnalMengajar {
  id_jurnal: number;
  id_jadwal: number;
  tanggal: string;
  nik_guru: string;
  nama_guru: string;
  mata_pelajaran: string;
  kelas: string;
  hari: string;
  jam_ke: string;
  status_mengajar: 'Hadir' | 'Tidak_Hadir' | 'Diganti';
  materi_diajarkan: string;
  keterangan?: string;
  keterangan_tambahan?: string;
  jam_input: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: JurnalMengajar[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function JurnalMengajarPage() {
  const { user } = useAuth();
  
  // Debug logging
  console.log('User data:', user);
  console.log('User type:', user?.user_type);
  
  // Permission configuration for Jurnal Mengajar
  const jurnalMengajarPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as any || 'Siswa', jurnalMengajarPermissions);
  
  console.log('User permissions:', userPermissions);
  console.log('Can create:', userPermissions.create);

  const [jurnal, setJurnal] = useState<JurnalMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [perPage] = useState(10);
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJurnal, setSelectedJurnal] = useState<JurnalMengajar | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Filter states - Set default tanggal to today
  const [statusFilter, setStatusFilter] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [guruFilter, setGuruFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  
  // Export states
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  
  // Dropdown data states
  const [kelasList, setKelasList] = useState<{id: string, nama: string}[]>([]);
  const [guruList, setGuruList] = useState<{nik: string, nama: string}[]>([]);

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if we're showing today's data
      if (tanggalFilter === new Date().toISOString().split('T')[0]) {
        fetchJurnal();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [tanggalFilter]);

  useEffect(() => {
    fetchJurnal();
  }, [currentPage, search, statusFilter, tanggalFilter, guruFilter, kelasFilter]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      // Fetch kelas data - get all data without pagination
      const kelasResponse = await api.get('/v1/kelas?per_page=1000');
      console.log('Kelas response:', kelasResponse.data);
      if (kelasResponse.data.success) {
        const mappedKelas = kelasResponse.data.data.map((kelas: any) => ({
          id: kelas.id_kelas,
          nama: kelas.nama_kelas
        }));
        console.log('Mapped kelas:', mappedKelas);
        setKelasList(mappedKelas);
      }

      // Fetch guru data - get all data without pagination
      const guruResponse = await api.get('/v1/guru?per_page=1000');
      console.log('Guru response:', guruResponse.data);
      if (guruResponse.data.success && Array.isArray(guruResponse.data.data)) {
        const mappedGuru = guruResponse.data.data.map((guru: any) => ({
          nik: guru.nik_guru,
          nama: guru.nama_lengkap
        }));
        console.log('Mapped guru:', mappedGuru);
        setGuruList(mappedGuru);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchJurnal = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(tanggalFilter && { tanggal: tanggalFilter }),
        ...(guruFilter && { guru: guruFilter }),
        ...(kelasFilter && { kelas: kelasFilter })
      });

      const response = await api.get(`/v1/jurnal-mengajar?${params}`);
      if (response.data.success) {
        const apiResponse: ApiResponse = response.data;
        setJurnal(apiResponse.data.data || []);
        setCurrentPage(apiResponse.data.current_page);
        setTotalPages(apiResponse.data.last_page);
        setTotalData(apiResponse.data.total);
      }
    } catch (error) {
      console.error('Error fetching jurnal mengajar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (jurnal: JurnalMengajar) => {
    setSelectedJurnal(jurnal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedJurnal) return;
    
    try {
      const response = await api.delete(`/v1/jurnal-mengajar/${selectedJurnal.id_jurnal}`);
      if (response.data.success) {
        setJurnal(jurnal.filter(item => item.id_jurnal !== selectedJurnal.id_jurnal));
        setShowDeleteModal(false);
        setSelectedJurnal(null);
      } else {
        alert('Gagal menghapus jurnal mengajar');
      }
    } catch (error) {
      console.error('Error deleting jurnal mengajar:', error);
      alert('Terjadi kesalahan saat menghapus jurnal mengajar');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Hadir': 'bg-green-100 text-green-800 border-green-200',
      'Tidak_Hadir': 'bg-red-100 text-red-800 border-red-200',
      'Diganti': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export functionality
  const handleExportMonthly = async () => {
    try {
      const params = new URLSearchParams({
        year: exportYear.toString(),
        month: exportMonth.toString(),
        ...(guruFilter && { guru: guruFilter }),
        ...(kelasFilter && { kelas: kelasFilter })
      });

      const response = await api.get(`/v1/jurnal-mengajar/export?${params}`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      link.setAttribute('download', `Jurnal_Mengajar_${monthNames[exportMonth - 1]}_${exportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Close modal after successful export
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Gagal mengekspor data. Silakan coba lagi.');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Jurnal Mengajar
          </h1>
          <p className="text-gray-600 mt-1">Kelola jurnal mengajar harian guru</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:inline">Export Bulanan</span>
          </button>
          
          {userPermissions.create && (
            <Link
              href="/pembelajaran/jurnal-mengajar/tambah"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Tambah Jurnal</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Cari materi atau keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Tidak_Hadir">Tidak Hadir</option>
            <option value="Diganti">Diganti</option>
          </select>

          {/* Tanggal Filter */}
          <input
            type="date"
            value={tanggalFilter}
            onChange={(e) => setTanggalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Kelas Filter */}
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map((kelas) => (
              <option key={kelas.id} value={kelas.nama}>
                {kelas.nama}
              </option>
            ))}
          </select>

          {/* Guru Filter */}
          <select
            value={guruFilter}
            onChange={(e) => setGuruFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Guru</option>
            {guruList.map((guru) => (
              <option key={guru.nik} value={guru.nama}>
                {guru.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam Ke
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Materi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan Tambahan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : jurnal.length > 0 ? (
                jurnal.map((item, index) => (
                  <tr key={item.id_jurnal} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * perPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(item.tanggal)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{item.nama_guru}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mata_pelajaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.kelas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">Jam ke-{item.jam_ke}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status_mengajar)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.materi_diajarkan}>
                        {item.materi_diajarkan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.keterangan_tambahan || '-'}>
                        {item.keterangan_tambahan || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {userPermissions.view && (
                          <Link
                            href={`/pembelajaran/jurnal-mengajar/${item.id_jurnal}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {userPermissions.edit && (
                          <Link
                            href={`/pembelajaran/jurnal-mengajar/${item.id_jurnal}/edit`}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        {userPermissions.delete && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    {search || statusFilter || tanggalFilter || guruFilter ? 'Tidak ada data yang ditemukan' : 'Belum ada data jurnal mengajar'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> sampai{' '}
                  <span className="font-medium">{Math.min(currentPage * perPage, totalData)}</span> dari{' '}
                  <span className="font-medium">{totalData}</span> hasil
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-500 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedJurnal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Hapus Jurnal Mengajar</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus jurnal mengajar tanggal {formatDate(selectedJurnal.tanggal)} untuk mata pelajaran {selectedJurnal.mata_pelajaran}?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Hapus
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedJurnal(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Export Data Jurnal Mengajar</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tahun
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bulan
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                    ].map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleExportMonthly}
                  className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}