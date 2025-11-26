'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, Pin, Calendar, User, Download, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { pengumumanApi, type Pengumuman } from '@/lib/api-pengumuman';
import CreatePengumumanModal from '@/components/modals/CreatePengumumanModal';
import { usePermission } from '@/hooks/usePermission';
import { useRouteProtection } from '@/hooks/useRouteProtection';

export default function PengumumanPage() {
  // Route protection - redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'pengumuman',
    redirectTo: '/dashboard'
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    kategori: '',
    prioritas: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchPengumuman();
    }
  }, [user, filters, currentPage]);

  const fetchPengumuman = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const userIdentifier = user.username || user.nis || user.reference_id || user.user_id;
      let userKelas = undefined;
      let userTingkat = undefined;

      if (user.user_type === 'Siswa' && user.id_kelas) {
        userKelas = user.id_kelas;
        const kelasName = user.nama_kelas || '';
        if (kelasName.startsWith('X')) userTingkat = '10';
        else if (kelasName.startsWith('XI')) userTingkat = '11';
        else if (kelasName.startsWith('XII')) userTingkat = '12';
      }

      const response = await pengumumanApi.getAll({
        for_user: userIdentifier,
        user_type: user.user_type,
        user_kelas: userKelas,
        user_tingkat: userTingkat,
        search: filters.search || undefined,
        kategori: filters.kategori || undefined,
        prioritas: filters.prioritas || undefined,
        status: filters.status || undefined,
        per_page: 10,
        page: currentPage,
      });

      if (response.success) {
        setPengumumanList(response.data || []);
        setTotalPages(response.pagination?.last_page || 1);
        setTotalItems(response.pagination?.total || 0);
        setCurrentPage(response.pagination?.current_page || 1);
      }

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPengumuman();
  };

  const handleTogglePin = async (id: number) => {
    try {
      setPinning(true);
      await pengumumanApi.togglePin(id);
      await fetchPengumuman();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengubah status pin');
    } finally {
      setPinning(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleting(true);
      await pengumumanApi.delete(id);
      await fetchPengumuman();
      setExpandedId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menghapus pengumuman');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (pengumuman: Pengumuman) => {
    if (!pengumuman.file_lampiran) return;
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    const fileUrl = `${baseUrl}/storage/${pengumuman.file_lampiran}`;
    window.open(fileUrl, '_blank');
  };

  const handleMarkAsRead = async (id: number) => {
    if (!user) return;
    try {
      const userIdentifier = user.username || user.nis || user.reference_id || user.user_id;
      await pengumumanApi.markAsRead(id, userIdentifier, user.user_type);
      await fetchPengumuman();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      handleMarkAsRead(id);
    }
  };

  const getPriorityBadge = (prioritas: string) => {
    switch (prioritas) {
      case 'Sangat Penting':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Penting':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'Akademik':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Kegiatan':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Keuangan':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Keagamaan':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  // Use centralized permission system
  const { canCreate, canEdit, canDelete } = usePermission('pengumuman');
  const canCreatePengumuman = canCreate;
  const canEditPengumuman = canEdit;
  
  const pinnedPengumuman = pengumumanList.filter((p) => p.is_pinned);
  const regularPengumuman = pengumumanList.filter((p) => !p.is_pinned);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola dan lihat pengumuman sekolah</p>
        </div>

        {canCreatePengumuman && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            Buat Pengumuman
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase">Total Pengumuman</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Search className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase">Dipinned</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{pinnedPengumuman.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <Pin className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase">Belum Dibaca</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {pengumumanList.filter((p) => !p.is_read).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <Eye className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium ${
                showFilters ? 'bg-gray-50' : ''
              }`}
            >
              <Filter size={18} />
              Filter
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
            >
              Cari
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-200">
              <select
                value={filters.kategori}
                onChange={(e) => handleFilterChange('kategori', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Semua Kategori</option>
                <option value="Umum">Umum</option>
                <option value="Akademik">Akademik</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Keagamaan">Keagamaan</option>
              </select>

              <select
                value={filters.prioritas}
                onChange={(e) => handleFilterChange('prioritas', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Semua Prioritas</option>
                <option value="Normal">Normal</option>
                <option value="Penting">Penting</option>
                <option value="Sangat Penting">Sangat Penting</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          )}
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Memuat pengumuman...</p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Pinned Section */}
          {pinnedPengumuman.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pin className="text-amber-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">Pengumuman Penting</h2>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {pinnedPengumuman.map((pengumuman, index) => (
                  <PengumumanRow
                    key={pengumuman.id_pengumuman}
                    pengumuman={pengumuman}
                    isLast={index === pinnedPengumuman.length - 1}
                    isExpanded={expandedId === pengumuman.id_pengumuman}
                    onToggleExpand={() => toggleExpand(pengumuman.id_pengumuman)}
                    onTogglePin={() => handleTogglePin(pengumuman.id_pengumuman)}
                    onDelete={() => handleDelete(pengumuman.id_pengumuman)}
                    onDownload={() => handleDownload(pengumuman)}
                    getPriorityBadge={getPriorityBadge}
                    getKategoriBadge={getKategoriBadge}
                    canEdit={canEditPengumuman}
                    pinning={pinning}
                    deleting={deleting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Section */}
          {regularPengumuman.length > 0 && (
            <div>
              {pinnedPengumuman.length > 0 && (
                <h2 className="text-lg font-bold text-gray-900 mb-3">Pengumuman Lainnya</h2>
              )}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {regularPengumuman.map((pengumuman, index) => (
                  <PengumumanRow
                    key={pengumuman.id_pengumuman}
                    pengumuman={pengumuman}
                    isLast={index === regularPengumuman.length - 1}
                    isExpanded={expandedId === pengumuman.id_pengumuman}
                    onToggleExpand={() => toggleExpand(pengumuman.id_pengumuman)}
                    onTogglePin={() => handleTogglePin(pengumuman.id_pengumuman)}
                    onDelete={() => handleDelete(pengumuman.id_pengumuman)}
                    onDownload={() => handleDownload(pengumuman)}
                    getPriorityBadge={getPriorityBadge}
                    getKategoriBadge={getKategoriBadge}
                    canEdit={canEditPengumuman}
                    pinning={pinning}
                    deleting={deleting}
                  />
                ))}
              </div>
            </div>
          )}

          {pengumumanList.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pengumuman</h3>
              <p className="text-gray-600 mb-6 text-sm">
                {canCreatePengumuman
                  ? 'Mulai dengan membuat pengumuman pertama Anda.'
                  : 'Belum ada pengumuman untuk Anda saat ini.'}
              </p>
              {canCreatePengumuman && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Plus size={20} />
                  Buat Pengumuman
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-600 font-medium">
            Halaman {currentPage} dari {totalPages} • Total {totalItems} pengumuman
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-md"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreatePengumumanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchPengumuman()}
      />
    </div>
  );
}

// Row Component
interface PengumumanRowProps {
  pengumuman: Pengumuman;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onDownload: () => void;
  getPriorityBadge: (p: string) => string;
  getKategoriBadge: (k: string) => string;
  canEdit: boolean;
  pinning: boolean;
  deleting: boolean;
}

function PengumumanRow({
  pengumuman,
  isLast,
  isExpanded,
  onToggleExpand,
  onTogglePin,
  onDelete,
  onDownload,
  getPriorityBadge,
  getKategoriBadge,
  canEdit,
  pinning,
  deleting,
}: PengumumanRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`${!isLast ? 'border-b border-gray-200' : ''}`}>
      {/* Main Row */}
      <div
        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
          !pengumuman.is_read ? 'bg-blue-50/50' : ''
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4">
          {/* Expand Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {pengumuman.is_pinned && (
              <Pin size={16} className="text-amber-600" />
            )}
            {!pengumuman.is_read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {pengumuman.judul}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getKategoriBadge(pengumuman.kategori)}`}>
              {pengumuman.kategori}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityBadge(pengumuman.prioritas)}`}>
              {pengumuman.prioritas}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
            <span className="flex items-center gap-1">
              <User size={14} />
              {pengumuman.dibuat_oleh_nama}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(pengumuman.tanggal_mulai).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content - Full Horizontal */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
          <div className="pt-4 space-y-4">
            {/* Content Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Isi Pengumuman</h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {pengumuman.konten}
              </p>
            </div>

            {/* Horizontal Info Grid */}
            <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-200">
              {/* File Lampiran */}
              {pengumuman.file_lampiran ? (
                <div className="col-span-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">File Lampiran</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Download size={14} className="text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-900 truncate">
                        {pengumuman.file_original_name}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm cursor-pointer"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="col-span-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">File Lampiran</p>
                  <p className="text-sm text-gray-400 italic">Tidak ada lampiran</p>
                </div>
              )}

              {/* Dibuat Oleh */}
              <div className="col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dibuat Oleh</p>
                <p className="text-sm font-semibold text-gray-900">{pengumuman.dibuat_oleh_nama}</p>
                <p className="text-xs text-gray-600">{pengumuman.dibuat_oleh_role}</p>
              </div>

              {/* Periode */}
              <div className="col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Periode</p>
                <p className="text-sm text-gray-900">
                  {new Date(pengumuman.tanggal_mulai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                {pengumuman.tanggal_selesai && (
                  <p className="text-xs text-gray-600">
                    s/d {new Date(pengumuman.tanggal_selesai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="col-span-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded ${
                  pengumuman.status === 'Published' 
                    ? 'bg-green-100 text-green-700' 
                    : pengumuman.status === 'Draft'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {pengumuman.status}
                </span>
              </div>
            </div>

            {/* Actions - Horizontal */}
            {canEdit && (
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin();
                  }}
                  disabled={pinning}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                    pengumuman.is_pinned
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pin size={16} />
                  {pinning ? 'Loading...' : (pengumuman.is_pinned ? 'Unpin Pengumuman' : 'Pin Pengumuman')}
                </button>

                {!confirmDelete ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(true);
                    }}
                    className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Hapus Pengumuman
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setConfirmDelete(false);
                      }}
                      disabled={deleting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      {deleting ? 'Menghapus...' : '✓ Ya, Hapus'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(false);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Batal
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}