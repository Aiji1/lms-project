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
  Download,
  Upload,
  User,
  BookOpen,
  Phone,
  MapPin
} from 'lucide-react';
import { api } from '@/lib/api';
import ImportModal from '@/components/forms/ImportModal';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, DEFAULT_PERMISSIONS, UserRole } from '@/types/permissions';

interface Guru {
  nik_guru: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat?: string;
  no_telepon?: string;
  status_kepegawaian: 'Pengganti' | 'Honorer' | 'Capeg' | 'PTY' | 'PTYK';
  jabatan: 'Guru' | 'Guru_dan_Wali_Kelas';
  status: 'Aktif' | 'Non-aktif';
  wali_kelas_nama?: string;
  jumlah_mapel: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: Guru[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function DataGuruPage() {
  const { user } = useAuth();
  
  // Permission configuration for Data Guru
  const dataGuruPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Guru': READ_ONLY_PERMISSIONS,
    'Siswa': DEFAULT_PERMISSIONS,
    'Petugas_Keuangan': DEFAULT_PERMISSIONS,
    'Orang_Tua': DEFAULT_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as UserRole || 'Siswa', dataGuruPermissions);

  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [perPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [statusKepegawaianFilter, setStatusKepegawaianFilter] = useState('');
  const [jabatanFilter, setJabatanFilter] = useState('');

  // Fetch data guru
  const fetchGuru = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>('/v1/guru', {
        params: {
          page,
          per_page: perPage,
          search: searchTerm,
          status: statusFilter || undefined,
          status_kepegawaian: statusKepegawaianFilter || undefined,
          jabatan: jabatanFilter || undefined
        }
      });

      if (response.data.success) {
        setGuru(response.data.data.data);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.last_page);
        setTotalData(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching guru:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuru(currentPage, search);
  }, [currentPage, statusFilter, statusKepegawaianFilter, jabatanFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchGuru(1, search);
  };

  // Handle delete
  const handleDelete = async (nik_guru: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data guru ini?')) return;

    try {
      const response = await api.delete(`/v1/guru/${nik_guru}`);
      if (response.data.success) {
        alert('Data guru berhasil dihapus');
        fetchGuru(currentPage, search);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Data guru tidak dapat dihapus karena masih digunakan di sistem');
      } else {
        alert('Error menghapus data guru');
      }
      console.error('Error deleting guru:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setStatusKepegawaianFilter('');
    setJabatanFilter('');
    setSearch('');
    setCurrentPage(1);
  };

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-300`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800';
      case 'Non-aktif': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusKepegawaianBadgeColor = (status: string) => {
    switch (status) {
      case 'PTY': return 'bg-purple-100 text-purple-800';
      case 'PTYK': return 'bg-blue-100 text-blue-800';
      case 'Capeg': return 'bg-indigo-100 text-indigo-800';
      case 'Honorer': return 'bg-yellow-100 text-yellow-800';
      case 'Pengganti': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-black p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Guru</h1>
            <p className="text-gray-600 mt-1">
              Kelola data guru SMA Islam Al-Azhar 7 Sukoharjo
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            {userPermissions.create && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Upload size={20} className="mr-2" />
                Import Excel
              </button>
            )}
            {userPermissions.create && (
              <Link 
                href="/admin/guru/tambah"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} className="mr-2" />
                Tambah Guru
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-black p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau NIK..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
              </select>
              <select
                value={statusKepegawaianFilter}
                onChange={(e) => setStatusKepegawaianFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status Kepegawaian</option>
                <option value="PTY">PTY</option>
                <option value="PTYK">PTYK</option>
                <option value="Capeg">Capeg</option>
                <option value="Honorer">Honorer</option>
                <option value="Pengganti">Pengganti</option>
              </select>
              <select
                value={jabatanFilter}
                onChange={(e) => setJabatanFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Jabatan</option>
                <option value="Guru">Guru</option>
                <option value="Guru_dan_Wali_Kelas">Guru dan Wali Kelas</option>
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="button"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 justify-center"
              >
                <Download size={20} className="mr-2" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-black overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Guru ({totalData} data)
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIK & Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Kepegawaian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jabatan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guru.length > 0 ? (
                    guru.map((item) => (
                      <tr key={item.nik_guru} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.nama_lengkap}
                              </div>
                              <div className="text-sm text-gray-500">
                                NIK: {item.nik_guru}
                              </div>
                              <div className="text-xs text-gray-400">
                                {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusKepegawaianBadgeColor(item.status_kepegawaian)}`}>
                            {item.status_kepegawaian}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {item.jabatan.replace('_', ' ')}
                          </div>
                          {item.wali_kelas_nama && (
                            <div className="text-xs text-blue-600">
                              Wali Kelas: {item.wali_kelas_nama}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <BookOpen size={16} className="mr-1 text-gray-400" />
                            {item.jumlah_mapel} Mata Pelajaran
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.no_telepon && (
                            <div className="flex items-center mb-1">
                              <Phone size={14} className="mr-1 text-gray-400" />
                              {item.no_telepon}
                            </div>
                          )}
                          {item.alamat && (
                            <div className="flex items-start">
                              <MapPin size={14} className="mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-500 line-clamp-2">
                                {item.alamat}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/guru/${item.nik_guru}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat Detail"
                            >
                              <Eye size={16} />
                            </Link>
                            {userPermissions.edit && (
                              <Link
                                href={`/admin/guru/${item.nik_guru}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                            )}
                            {userPermissions.delete && (
                              <button
                                onClick={() => handleDelete(item.nik_guru)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {search ? 'Tidak ada data yang ditemukan' : 'Belum ada data guru'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((currentPage - 1) * perPage) + 1} sampai {Math.min(currentPage * perPage, totalData)} dari {totalData} data
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {renderPagination()}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Modal */}
      {userPermissions.create && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchGuru(currentPage, search);
          }}
          title="Import Data Guru"
          endpoint="/v1/guru/import"
          templateEndpoint="/v1/guru/template"
        />
      )}
    </div>
  );
}