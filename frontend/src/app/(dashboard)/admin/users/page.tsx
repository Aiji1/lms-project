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
  Clock,
  Key
} from 'lucide-react';
import { api } from '@/lib/api';
import ImportModal from '@/components/forms/ImportModal';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

interface UserData {
  user_id: string;
  username: string;
  user_type: 'Siswa' | 'Guru' | 'Admin' | 'Kepala_Sekolah' | 'Petugas_Keuangan' | 'Orang_Tua';
  status: 'Aktif' | 'Non-aktif';
  reference_id: string;
  nama_lengkap: string;
  last_login?: string;
  created_date: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: UserData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function DataUsersPage() {
  // Route protection - redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'manajemen_data.data_user',
    redirectTo: '/dashboard'
  });

  // Get permissions from centralized system
  const { canCreate, canEdit, canDelete } = usePermission('manajemen_data.data_user');

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [perPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Filter states
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch data users
  const fetchUsers = async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>('/users', {
        params: {
          page,
          per_page: perPage,
          search: searchTerm,
          user_type: userTypeFilter || undefined,
          status: statusFilter || undefined
        }
      });

      if (response.data.success) {
        setUsers(response.data.data.data);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.last_page);
        setTotalData(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, search);
  }, [currentPage, userTypeFilter, statusFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, search);
  };

  // Handle delete
  const handleDelete = async (user_id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    try {
      const response = await api.delete(`/users/${user_id}`);
      if (response.data.success) {
        alert('User berhasil dihapus');
        fetchUsers(currentPage, search);
      }
    } catch (error: any) {
      alert('Error menghapus user: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
      console.error('Error deleting user:', error);
    }
  };

  // Handle reset password
  const handleResetPassword = async (user_id: string, username: string) => {
    const newPassword = prompt(`Reset password untuk ${username}?\nMasukkan password baru:`);
    if (!newPassword) return;

    const confirmPassword = prompt('Konfirmasi password baru:');
    if (newPassword !== confirmPassword) {
      alert('Password tidak cocok!');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }

    try {
      const response = await api.post(`/users/${user_id}/reset-password`, {
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });

      if (response.data.success) {
        alert('Password berhasil direset');
      }
    } catch (error: any) {
      alert('Error reset password: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setUserTypeFilter('');
    setStatusFilter('');
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

  // Get user type badge color
  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'Admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'Kepala_Sekolah': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Guru': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Petugas_Keuangan': return 'bg-green-100 text-green-800 border-green-200';
      case 'Siswa': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Orang_Tua': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Non-aktif': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format user type display
  const formatUserType = (userType: string) => {
    return userType.replace('_', ' ');
  };

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-black p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Users</h1>
            <p className="text-gray-600 mt-1">
              Kelola akun pengguna sistem LMS
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            {canCreate && (
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Upload size={20} className="mr-2" />
                Import Excel
              </button>
            )}
            {canCreate && (
              <Link 
                href="/admin/users/tambah"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} className="mr-2" />
                Tambah User
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
                  placeholder="Cari berdasarkan username, user ID, atau nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Tipe User</option>
                <option value="Admin">Admin</option>
                <option value="Kepala_Sekolah">Kepala Sekolah</option>
                <option value="Guru">Guru</option>
                <option value="Petugas_Keuangan">Petugas Keuangan</option>
                <option value="Siswa">Siswa</option>
                <option value="Orang_Tua">Orang Tua</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
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
              Daftar Users ({totalData} akun)
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
                      User Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User size={20} className="text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.user_id}
                              </div>
                              <div className="text-xs text-gray-400">
                                Ref: {user.reference_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getUserTypeBadgeColor(user.user_type)}`}>
                            {formatUserType(user.user_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={user.nama_lengkap}>
                            {user.nama_lengkap || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            {formatDate(user.last_login)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/users/${user.user_id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat Detail"
                            >
                              <Eye size={16} />
                            </Link>
                            {canEdit && (
                              <Link
                                href={`/admin/users/${user.user_id}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => handleResetPassword(user.user_id, user.username)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Reset Password"
                              >
                                <Key size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(user.user_id)}
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
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        {search ? 'Tidak ada data yang ditemukan' : 'Belum ada user terdaftar'}
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
      {canCreate && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchUsers(currentPage, search);
          }}
          title="Import Data Users"
          endpoint="/users/import"
          templateEndpoint="/users/template"
        />
      )}
    </div>
  );
}