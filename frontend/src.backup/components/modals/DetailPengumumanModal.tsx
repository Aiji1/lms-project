'use client';

import { useState, useEffect } from 'react';
import { X, Download, Pin, Trash2, Edit2, Calendar, User, Tag } from 'lucide-react';
import { pengumumanApi, type Pengumuman } from '@/lib/api-pengumuman';

interface DetailPengumumanModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengumumanId: number | null;
  onDelete?: () => void;
  onEdit?: (pengumuman: Pengumuman) => void;
}

export default function DetailPengumumanModal({
  isOpen,
  onClose,
  pengumumanId,
  onDelete,
  onEdit,
}: DetailPengumumanModalProps) {
  const [pengumuman, setPengumuman] = useState<Pengumuman | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (isOpen && pengumumanId) {
      fetchDetail();
    }
  }, [isOpen, pengumumanId]);

  const fetchDetail = async () => {
    if (!pengumumanId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await pengumumanApi.getById(pengumumanId);
      
      if (response.success) {
        setPengumuman(response.data);

        // Mark as read
        if (user) {
          const userIdentifier = user.username || user.nis || user.reference_id || user.user_id;
          await pengumumanApi.markAsRead(pengumumanId, userIdentifier, user.user_type);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat detail pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async () => {
    if (!pengumuman) return;

    try {
      setPinning(true);
      await pengumumanApi.togglePin(pengumuman.id_pengumuman);
      
      // Refresh detail
      await fetchDetail();
      
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengubah status pin');
    } finally {
      setPinning(false);
    }
  };

  const handleDelete = async () => {
    if (!pengumuman) return;

    try {
      setDeleting(true);
      await pengumumanApi.delete(pengumuman.id_pengumuman);
      
      if (onDelete) {
        onDelete();
      }
      
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menghapus pengumuman');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = () => {
    if (!pengumuman?.file_lampiran) return;
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4);
    }
    const fileUrl = `${baseUrl}/storage/${pengumuman.file_lampiran}`;
    window.open(fileUrl, '_blank');
  };

  const getPriorityColor = (prioritas: string) => {
    switch (prioritas) {
      case 'Sangat Penting':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Penting':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getKategoriColor = (kategori: string) => {
    switch (kategori) {
      case 'Akademik':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Kegiatan':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Keuangan':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Keagamaan':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = user && pengumuman && (
    user.user_type === 'Admin' || 
    String(pengumuman.dibuat_oleh) === String(user.user_id || user.username || user.reference_id)
  );

  const canDelete = user && pengumuman && (
    user.user_type === 'Admin' || 
    String(pengumuman.dibuat_oleh) === String(user.user_id || user.username || user.reference_id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Detail Pengumuman</h2>
            {pengumuman?.is_pinned && (
              <span className="text-2xl">📌</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Memuat detail...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!loading && pengumuman && (
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getKategoriColor(pengumuman.kategori)}`}>
                  {pengumuman.kategori}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(pengumuman.prioritas)}`}>
                  {pengumuman.prioritas}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(pengumuman.status)}`}>
                  {pengumuman.status}
                </span>
              </div>

              {/* Judul */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {pengumuman.judul}
                </h3>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User size={16} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">Dibuat oleh:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {pengumuman.dibuat_oleh_nama}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">
                      ({pengumuman.dibuat_oleh_role})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(pengumuman.tanggal_mulai).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {pengumuman.tanggal_selesai && (
                      <>
                        <span className="mx-2">-</span>
                        <span className="font-medium text-gray-900">
                          {new Date(pengumuman.tanggal_selesai).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Tag size={16} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">Target:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {pengumuman.target_type === 'all' && 'Semua Pengguna'}
                      {pengumuman.target_type === 'roles' && `Role: ${pengumuman.target_roles?.join(', ')}`}
                      {pengumuman.target_type === 'tingkat' && `Tingkat: ${pengumuman.target_tingkat?.join(', ')}`}
                      {pengumuman.target_type === 'kelas' && `Kelas tertentu`}
                      {pengumuman.target_type === 'siswa_spesifik' && `Siswa spesifik`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <div>
                    <span className="text-gray-500">Dibuat:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(pengumuman.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Konten */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Isi Pengumuman:</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {pengumuman.konten}
                  </p>
                </div>
              </div>

              {/* File Lampiran */}
              {pengumuman.file_lampiran && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Download size={16} />
                    File Lampiran
                  </h4>
                  <button
                    onClick={handleDownload}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                  >
                    <span>{pengumuman.file_original_name || 'Download File'}</span>
                    <Download size={14} />
                  </button>
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-3">
                    Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && pengumuman && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              {canEdit && (
                <>
                  <button
                    onClick={handleTogglePin}
                    disabled={pinning}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      pengumuman.is_pinned
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Pin size={16} />
                    {pinning ? 'Loading...' : (pengumuman.is_pinned ? 'Unpin' : 'Pin')}
                  </button>

                  {onEdit && (
                    <button
                      onClick={() => onEdit(pengumuman)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  )}
                </>
              )}

              {canDelete && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
