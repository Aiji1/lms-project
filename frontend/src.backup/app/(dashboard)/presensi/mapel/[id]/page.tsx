'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

interface PresensiMapelDetailProps {
  params: Promise<{
    id: string;
  }>;
}

interface PresensiMapelDetail {
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
  created_at: string;
  updated_at: string;
}

export default function PresensiMapelDetailPage({ params }: PresensiMapelDetailProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [presensi, setPresensi] = useState<PresensiMapelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (resolvedParams.id) {
      fetchPresensiDetail();
    }
  }, [resolvedParams.id]);

  const fetchPresensiDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/presensi-mapel/${resolvedParams.id}`);
      
      if (response.data.success) {
        setPresensi(response.data.data);
      } else {
        alert('Data presensi mapel tidak ditemukan');
        router.push('/presensi/mapel');
      }
    } catch (error: any) {
      console.error('Error fetching presensi detail:', error);
      alert('Terjadi kesalahan saat mengambil data');
      router.push('/presensi/mapel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!presensi) return;
    
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus data presensi ${presensi.nama_siswa} untuk mata pelajaran ${presensi.mata_pelajaran}?`
    );
    
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await api.delete(`/presensi-mapel/${presensi.id_presensi_mapel}`);
      
      if (response.data.success) {
        router.push('/presensi/mapel');
      } else {
        alert('Gagal menghapus data presensi mapel');
      }
    } catch (error: any) {
      console.error('Error deleting presensi:', error);
      alert('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sakit':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'Izin':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'Alpa':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sakit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Izin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Alpa':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!presensi) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Data presensi mapel yang Anda cari tidak ditemukan.</p>
        <Link
          href="/presensi/mapel"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/presensi/mapel"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Presensi Mapel</h1>
              <p className="text-gray-600 mt-1">Informasi lengkap data ketidakhadiran siswa</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/presensi/mapel/${presensi.id_presensi_mapel}/edit`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center px-6 py-3 rounded-full border-2 ${getStatusColor(presensi.status_ketidakhadiran)}`}>
          {getStatusIcon(presensi.status_ketidakhadiran)}
          <span className="ml-2 font-semibold text-lg">{presensi.status_ketidakhadiran}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Siswa</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">NIS</label>
              <p className="text-lg font-semibold text-gray-900">{presensi.nis}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
              <p className="text-lg font-semibold text-gray-900">{presensi.nama_siswa}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Kelas</label>
              <p className="text-lg text-gray-700">{presensi.nama_kelas}</p>
            </div>
          </div>
        </div>

        {/* Subject Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Mata Pelajaran</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Mata Pelajaran</label>
              <p className="text-lg font-semibold text-gray-900">{presensi.mata_pelajaran}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Guru Pengajar</label>
              <p className="text-lg text-gray-700">{presensi.guru_pengajar}</p>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Jadwal</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tanggal</label>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(presensi.tanggal).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Jam Pelajaran</label>
              <p className="text-lg text-gray-700">{presensi.jam_pelajaran}</p>
            </div>
          </div>
        </div>

        {/* Absence Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Clock className="h-5 w-5 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Informasi Ketidakhadiran</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(presensi.status_ketidakhadiran)}`}>
                {getStatusIcon(presensi.status_ketidakhadiran)}
                <span className="ml-2">{presensi.status_ketidakhadiran}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Keterangan</label>
              <p className="text-gray-700">
                {presensi.keterangan || 'Tidak ada keterangan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Sistem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <label className="block font-medium text-gray-500 mb-1">ID Presensi</label>
            <p>{presensi.id_presensi_mapel}</p>
          </div>
          <div>
            <label className="block font-medium text-gray-500 mb-1">ID Jurnal</label>
            <p>{presensi.id_jurnal}</p>
          </div>
          <div>
            <label className="block font-medium text-gray-500 mb-1">Dibuat Pada</label>
            <p>{new Date(presensi.created_at).toLocaleString('id-ID')}</p>
          </div>
          <div>
            <label className="block font-medium text-gray-500 mb-1">Terakhir Diupdate</label>
            <p>{new Date(presensi.updated_at).toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}