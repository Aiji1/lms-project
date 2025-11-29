'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  BookOpen, 
  Calendar, 
  User, 
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

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
  tahun_ajaran: string;
  semester: string;
}

export default function DetailJurnalMengajarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 🔒 ROUTE PROTECTION - Redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'pembelajaran.jurnal_mengajar',
    redirectTo: '/dashboard'
  });

  // 🔒 GET PERMISSIONS - Get user's CRUD permissions
  const { canEdit, canDelete } = usePermission('pembelajaran.jurnal_mengajar');

  const [jurnalMengajar, setJurnalMengajar] = useState<JurnalMengajar | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id && isAuthorized) {
      fetchJurnalMengajar();
    }
  }, [id, isAuthorized]);

  const fetchJurnalMengajar = async () => {
    try {
      const response = await api.get(`/jurnal-mengajar/${id}`);
      if (response.data.success) {
        setJurnalMengajar(response.data.data);
      } else {
        router.push('/pembelajaran/jurnal-mengajar');
      }
    } catch (error) {
      console.error('Error fetching jurnal mengajar:', error);
      router.push('/pembelajaran/jurnal-mengajar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/jurnal-mengajar/${id}`);
      if (response.data.success) {
        router.push('/pembelajaran/jurnal-mengajar');
      } else {
        alert('Gagal menghapus jurnal mengajar');
      }
    } catch (error) {
      console.error('Error deleting jurnal mengajar:', error);
      alert('Terjadi kesalahan saat menghapus jurnal mengajar');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Hadir':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Tidak_Hadir':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'Diganti':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Hadir': 'bg-green-100 text-green-800 border-green-200',
      'Tidak_Hadir': 'bg-red-100 text-red-800 border-red-200',
      'Diganti': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {getStatusIcon(status)}
        <span className="ml-2">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!jurnalMengajar) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Jurnal Mengajar Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Jurnal mengajar yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Link
            href="/pembelajaran/jurnal-mengajar"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Jurnal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/pembelajaran/jurnal-mengajar"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Detail Jurnal Mengajar
            </h1>
            <p className="text-gray-600">Informasi lengkap jurnal mengajar</p>
          </div>
        </div>

        {/* 🔒 CONDITIONAL ACTION BUTTONS based on permission */}
        {(canEdit || canDelete) && (
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Link
                href={`/pembelajaran/jurnal-mengajar/${id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Jurnal
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Informasi Jurnal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mengajar</label>
                <p className="text-gray-900 text-lg font-medium flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  {formatDate(jurnalMengajar.tanggal)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Mengajar</label>
                <div className="mt-1">
                  {getStatusBadge(jurnalMengajar.status_mengajar)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pengajar</label>
                <p className="text-gray-900 flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  {jurnalMengajar.nama_guru}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Input</label>
                <p className="text-gray-600 text-sm flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  {formatDate(jurnalMengajar.jam_input)} {formatTime(jurnalMengajar.jam_input)}
                </p>
              </div>
            </div>
          </div>

          {/* Materi */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Materi yang Diajarkan</h2>
            <div className="prose max-w-none">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {jurnalMengajar.materi_diajarkan}
              </p>
            </div>
          </div>

          {/* Keterangan */}
          {jurnalMengajar.keterangan && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keterangan</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {jurnalMengajar.keterangan}
                </p>
              </div>
            </div>
          )}

          {/* Keterangan Tambahan */}
          {jurnalMengajar.keterangan_tambahan && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keterangan Tambahan</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {jurnalMengajar.keterangan_tambahan}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Jadwal Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Jadwal</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <p className="text-gray-900 font-medium">{jurnalMengajar.mata_pelajaran}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <p className="text-gray-900">{jurnalMengajar.kelas}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                <p className="text-gray-900">{jurnalMengajar.hari}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jam Ke</label>
                <p className="text-gray-900">Jam ke-{jurnalMengajar.jam_ke}</p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akademik</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                <p className="text-gray-900">{jurnalMengajar.tahun_ajaran}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <p className="text-gray-900">{jurnalMengajar.semester}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              {canEdit && (
                <Link
                  href={`/pembelajaran/jurnal-mengajar/${id}/edit`}
                  className="w-full flex items-center px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Jurnal Mengajar
                </Link>
              )}
              <Link
                href="/pembelajaran/jurnal-mengajar/tambah"
                className="w-full flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Tambah Jurnal Baru
              </Link>
              <Link
                href="/pembelajaran/jurnal-mengajar"
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Hapus Jurnal Mengajar</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus jurnal mengajar tanggal {formatDate(jurnalMengajar.tanggal)} untuk mata pelajaran {jurnalMengajar.mata_pelajaran}?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}