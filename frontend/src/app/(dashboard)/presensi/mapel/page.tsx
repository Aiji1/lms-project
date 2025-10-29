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
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';

interface PresensiMapel {
  id_presensi_mapel: number;
  id_jurnal: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  mata_pelajaran: string;
  guru_pengajar: string;
  tanggal: string;
  jam_pelajaran: string;
  status_ketidakhadiran: 'Sakit' | 'Izin' | 'Alpa';
  keterangan: string | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: PresensiMapel[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function PresensiMapelPage() {
  const [presensiData, setPresensiData] = useState<PresensiMapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tanggalFilter, setTanggalFilter] = useState(new Date().toISOString().split('T')[0]);
  const [kelasFilter, setKelasFilter] = useState('');
  const [mapelFilter, setMapelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Mock data for development
  const mockPresensi: PresensiMapel[] = [
    {
      id_presensi_mapel: 1,
      id_jurnal: 101,
      nis: '2024001',
      nama_siswa: 'Ahmad Fauzi',
      nama_kelas: 'X IPA 1',
      mata_pelajaran: 'Matematika',
      guru_pengajar: 'Dr. Siti Aminah',
      tanggal: '2024-01-15',
      jam_pelajaran: '08:00-09:30',
      status_ketidakhadiran: 'Sakit',
      keterangan: 'Demam tinggi, ada surat dokter'
    },
    {
      id_presensi_mapel: 2,
      id_jurnal: 102,
      nis: '2024003',
      nama_siswa: 'Muhammad Rizki',
      nama_kelas: 'X IPA 2',
      mata_pelajaran: 'Fisika',
      guru_pengajar: 'Ahmad Hidayat, S.Pd',
      tanggal: '2024-01-15',
      jam_pelajaran: '09:45-11:15',
      status_ketidakhadiran: 'Izin',
      keterangan: 'Keperluan keluarga'
    },
    {
      id_presensi_mapel: 3,
      id_jurnal: 103,
      nis: '2024007',
      nama_siswa: 'Dewi Sartika',
      nama_kelas: 'XI IPS 1',
      mata_pelajaran: 'Sejarah',
      guru_pengajar: 'Budi Santoso, M.Pd',
      tanggal: '2024-01-15',
      jam_pelajaran: '13:00-14:30',
      status_ketidakhadiran: 'Alpa',
      keterangan: null
    },
    {
      id_presensi_mapel: 4,
      id_jurnal: 104,
      nis: '2024010',
      nama_siswa: 'Rina Wati',
      nama_kelas: 'XII IPA 1',
      mata_pelajaran: 'Kimia',
      guru_pengajar: 'Dr. Fatimah Zahra',
      tanggal: '2024-01-15',
      jam_pelajaran: '10:15-11:45',
      status_ketidakhadiran: 'Sakit',
      keterangan: 'Flu berat'
    },
    {
      id_presensi_mapel: 5,
      id_jurnal: 105,
      nis: '2024012',
      nama_siswa: 'Hasan Ali',
      nama_kelas: 'X IPA 1',
      mata_pelajaran: 'Biologi',
      guru_pengajar: 'Nurul Hidayah, S.Si',
      tanggal: '2024-01-15',
      jam_pelajaran: '14:45-16:15',
      status_ketidakhadiran: 'Alpa',
      keterangan: null
    }
  ];

  useEffect(() => {
    fetchPresensiData();
  }, [currentPage, searchTerm, tanggalFilter, kelasFilter, mapelFilter, statusFilter]);

  const fetchPresensiData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(tanggalFilter && { tanggal: tanggalFilter }),
        ...(kelasFilter && { kelas: kelasFilter }),
        ...(mapelFilter && { mapel: mapelFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await api.get(`/presensi-mapel?${params}`);
      
      if (response.data.success) {
        setPresensiData(response.data.data.data || []);
        setTotalPages(response.data.data.last_page || 1);
        setTotalRecords(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching presensi mapel:', error);
      // Fallback to empty array on error
      setPresensiData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data presensi ini?')) {
      try {
        const response = await api.delete(`/presensi-mapel/${id}`);
        if (response.data.success) {
          // Refresh data after successful deletion
          fetchPresensiData();
        } else {
          alert('Gagal menghapus data presensi mapel');
        }
      } catch (error) {
        console.error('Error deleting presensi mapel:', error);
        alert('Terjadi kesalahan saat menghapus data');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sakit':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Sakit</span>;
      case 'Izin':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Izin</span>;
      case 'Alpa':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Alpa</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Presensi Mata Pelajaran</h1>
        <p className="text-gray-600">Kelola data ketidakhadiran siswa dalam mata pelajaran</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-black">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sakit</p>
              <p className="text-2xl font-bold text-gray-900">
                {presensiData.filter(p => p.status_ketidakhadiran === 'Sakit').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-black">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Izin</p>
              <p className="text-2xl font-bold text-gray-900">
                {presensiData.filter(p => p.status_ketidakhadiran === 'Izin').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-black">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Alpa</p>
              <p className="text-2xl font-bold text-gray-900">
                {presensiData.filter(p => p.status_ketidakhadiran === 'Alpa').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-black">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Data</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-black">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari nama siswa, NIS, atau mata pelajaran..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={tanggalFilter}
                onChange={(e) => setTanggalFilter(e.target.value)}
              />
            </div>

            {/* Class Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              <option value="X IPA 1">X IPA 1</option>
              <option value="X IPA 2">X IPA 2</option>
              <option value="XI IPS 1">XI IPS 1</option>
              <option value="XII IPA 1">XII IPA 1</option>
            </select>

            {/* Subject Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={mapelFilter}
              onChange={(e) => setMapelFilter(e.target.value)}
            >
              <option value="">Semua Mapel</option>
              <option value="Matematika">Matematika</option>
              <option value="Fisika">Fisika</option>
              <option value="Kimia">Kimia</option>
              <option value="Biologi">Biologi</option>
              <option value="Sejarah">Sejarah</option>
            </select>

            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Sakit">Sakit</option>
              <option value="Izin">Izin</option>
              <option value="Alpa">Alpa</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <Link
              href="/presensi/mapel/tambah"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Tambah Ketidakhadiran
            </Link>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-black">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NIS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : presensiData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                    Tidak ada data ketidakhadiran
                  </td>
                </tr>
              ) : (
                presensiData.map((item, index) => (
                  <tr key={item.id_presensi_mapel} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nis}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_siswa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nama_kelas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.mata_pelajaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.guru_pengajar}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.jam_pelajaran}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status_ketidakhadiran)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.keterangan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/presensi/mapel/${item.id_presensi_mapel}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/presensi/mapel/${item.id_presensi_mapel}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id_presensi_mapel)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
                  Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalRecords)}
                  </span>{' '}
                  of <span className="font-medium">{totalRecords}</span> results
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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
    </div>
  );
}