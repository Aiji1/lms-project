'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  FileDown,
  Zap,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

interface JenisPembayaran {
  id_jenis_pembayaran: number;
  kode: string;
  nama_pembayaran: string;
  nominal: string | number;
  deskripsi?: string;
  tipe_periode: 'bulanan' | 'custom' | 'sekali';
  tipe_siswa: 'semua' | 'kelas' | 'individu';
  tahun_ajaran?: string | null;
  is_active: boolean | number;
  periode_display?: string;
  target_display?: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export default function JenisPembayaranPage() {
  // 🔒 ROUTE PROTECTION - Redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'keuangan.jenis_pembayaran',
    redirectTo: '/dashboard'
  });

  // 🔒 GET PERMISSIONS - Get user's CRUD permissions
  const { canCreate, canEdit, canDelete } = usePermission('keuangan.jenis_pembayaran');

  const [jenisPembayaran, setJenisPembayaran] = useState<JenisPembayaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch data dengan useCallback untuk prevent infinite loop
  const fetchJenisPembayaran = useCallback(async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(search && { search })
      });

      const response = await fetch(
        `http://localhost:8000/api/v1/jenis-pembayaran?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      
      if (data.success) {
        const items = Array.isArray(data.data) ? data.data : (data.data.data || []);
        const normalized = items.map((it: any) => ({
          ...it,
          id_jenis_pembayaran: it.id_jenis_pembayaran ?? it.id ?? it.kode,
        }));
        setJenisPembayaran(normalized);
        
        if (data.meta) {
          setPagination(data.meta);
        } else if (data.data.current_page) {
          setPagination({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: data.data.from,
            to: data.data.to
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJenisPembayaran(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchJenisPembayaran]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJenisPembayaran(1, searchTerm);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/jenis-pembayaran/${deleteId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Berhasil dihapus');
        setShowDeleteModal(false);
        setDeleteId(null);
        fetchJenisPembayaran(currentPage, searchTerm);
      } else {
        throw new Error(data.message);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || 'Gagal menghapus');
      } else {
        alert('Gagal menghapus');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        'http://localhost:8000/api/v1/jenis-pembayaran/export',
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jenis-pembayaran-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export');
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // 🔒 SHOW LOADING WHILE CHECKING AUTH
  if (permLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // 🔒 IF NOT AUTHORIZED, RETURN NULL (will redirect)
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
          <span className="text-gray-900 font-medium">Jenis Pembayaran</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jenis Pembayaran</h1>
            <p className="text-gray-600 mt-1">Kelola jenis pembayaran sekolah</p>
          </div>
          
          {/* 🔒 CONDITIONAL RENDERING - Show buttons only if has permission */}
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </button>
            {canCreate && (
              <Link
                href="/keuangan/jenis-pembayaran/tambah"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Jenis Pembayaran
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari jenis pembayaran..."
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
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : jenisPembayaran.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Tidak ada data jenis pembayaran</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Pembayaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe Periode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun Ajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    {/* 🔒 Only show Actions column if user has any action permission */}
                    {(canEdit || canDelete) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jenisPembayaran.map((item, idx) => (
                    <tr key={`${item.id_jenis_pembayaran}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{(() => {
                          const raw = String(item.kode || '').replace(/_/g, '').trim().toUpperCase();
                          if (raw.length >= 2) return raw;
                          const nama = String(item.nama_pembayaran || '').toUpperCase();
                          const letters = nama.replace(/[^A-Z]/g, '');
                          const consonants = letters.replace(/[AEIOU]/g, '');
                          const alt = (consonants || letters).slice(0, 3);
                          return alt || raw || '-';
                        })()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.nama_pembayaran}</div>
                        {item.deskripsi && (
                          <div className="text-sm text-gray-500">{item.deskripsi}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.nominal)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.periode_display || item.tipe_periode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.target_display || item.tipe_siswa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.tahun_ajaran || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      {/* 🔒 CONDITIONAL ACTION BUTTONS based on permission */}
                      {(canEdit || canDelete) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {/* View detail - selalu ada untuk yang punya akses view */}
                            <Link
                              href={`/keuangan/jenis-pembayaran/${String(item.id_jenis_pembayaran)}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            {/* 🔒 Generate - hanya jika canCreate */}
                            {canCreate && (
                              <Link
                                href={`/keuangan/jenis-pembayaran/${String(item.id_jenis_pembayaran)}/generate`}
                                className="text-green-600 hover:text-green-900"
                                title="Generate Tagihan"
                              >
                                <Zap className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {/* 🔒 Edit - hanya jika canEdit */}
                            {canEdit && (
                              <Link
                                href={`/keuangan/jenis-pembayaran/${String(item.id_jenis_pembayaran)}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            )}
                            
                            {/* 🔒 Delete - hanya jika canDelete */}
                            {canDelete && (
                              <button
                                onClick={() => {
                                  setDeleteId(item.id_jenis_pembayaran);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Menampilkan <span className="font-medium">{pagination.from}</span> sampai{' '}
                  <span className="font-medium">{pagination.to}</span> dari{' '}
                  <span className="font-medium">{pagination.total}</span> data
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
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
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                    disabled={currentPage === pagination.last_page}
                    className="px-3 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Yakin ingin menghapus jenis pembayaran ini? Tindakan tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}