'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Target, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  BookOpen,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Eye
} from 'lucide-react';

interface TugasAdab {
  id_tugas_adab: number;
  nama_tugas: string;
  deskripsi_tugas: string;
  id_tahun_ajaran: number;
  tahun_ajaran?: string;
  semester?: string;
  status: 'Aktif' | 'Non-aktif';
  created_at?: string;
  updated_at?: string;
}

interface MonitoringStats {
  total_siswa: number;
  siswa_melaksanakan: number;
  siswa_tidak_melaksanakan: number;
  persentase_kepatuhan: number;
}

export default function DetailTugasAdabPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [tugasAdab, setTugasAdab] = useState<TugasAdab | null>(null);
  const [monitoringStats, setMonitoringStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTugasAdab();
      fetchMonitoringStats();
    }
  }, [id]);

  const fetchTugasAdab = async () => {
    try {
      const response = await api.get(`/v1/tugas-adab/${id}`);
      if (response.data.success) {
        setTugasAdab(response.data.data);
      } else {
        router.push('/keagamaan/tugas-adab');
      }
    } catch (error) {
      console.error('Error fetching tugas adab:', error);
    }
  };

  const fetchMonitoringStats = async () => {
    try {
      const response = await api.get(`/v1/tugas-adab/${id}/monitoring-stats`);
      if (response.data.success) {
        setMonitoringStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/v1/tugas-adab/${id}`);

      if (response.data.success) {
        router.push('/keagamaan/tugas-adab');
      } else {
        alert('Gagal menghapus tugas adab');
      }
    } catch (error) {
      console.error('Error deleting tugas adab:', error);
      alert('Terjadi kesalahan saat menghapus tugas adab');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Aktif') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          Non-aktif
        </span>
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tugasAdab) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Tugas Adab Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-4">Tugas adab yang Anda cari tidak ditemukan atau telah dihapus.</p>
        <Link
          href="/keagamaan/tugas-adab"
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/keagamaan/tugas-adab"
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Detail Tugas Adab
              </h1>
            </div>
            <p className="text-gray-600">Informasi lengkap tugas adab dan monitoring</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/keagamaan/tugas-adab/${id}/edit`}
              className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Informasi Tugas
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tugas</label>
                <p className="text-gray-900 text-lg font-medium">{tugasAdab.nama_tugas}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <p className="text-gray-900 leading-relaxed">{tugasAdab.deskripsi_tugas}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
                  <p className="text-gray-900">
                    {tugasAdab.tahun_ajaran} - {tugasAdab.semester}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(tugasAdab.status)}
                </div>
              </div>
              {tugasAdab.created_at && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dibuat</label>
                    <p className="text-gray-600 text-sm">{formatDate(tugasAdab.created_at)}</p>
                  </div>
                  {tugasAdab.updated_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terakhir Diubah</label>
                      <p className="text-gray-600 text-sm">{formatDate(tugasAdab.updated_at)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Monitoring Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-600" />
              Aksi Monitoring
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/keagamaan/monitoring-adab?tugas_adab=${id}`}
                className="flex items-center justify-center px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Lihat Monitoring Siswa
              </Link>
              <Link
                href={`/keagamaan/monitoring-adab/input?tugas_adab=${id}`}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Input Monitoring
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Monitoring Statistics */}
          {monitoringStats && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Statistik Monitoring
              </h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {monitoringStats.persentase_kepatuhan.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Tingkat Kepatuhan</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Siswa</span>
                    <span className="font-medium">{monitoringStats.total_siswa}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600">Melaksanakan</span>
                    <span className="font-medium text-green-600">{monitoringStats.siswa_melaksanakan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-600">Tidak Melaksanakan</span>
                    <span className="font-medium text-red-600">{monitoringStats.siswa_tidak_melaksanakan}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${monitoringStats.persentase_kepatuhan}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-3">
              <Link
                href={`/keagamaan/tugas-adab/${id}/edit`}
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4 mr-3 text-yellow-600" />
                Edit Tugas Adab
              </Link>
              <Link
                href="/keagamaan/tugas-adab/tambah"
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Target className="h-4 w-4 mr-3 text-blue-600" />
                Tambah Tugas Baru
              </Link>
              <Link
                href="/keagamaan/tugas-adab"
                className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-3 text-gray-600" />
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
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Konfirmasi Hapus</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus tugas adab "{tugasAdab.nama_tugas}"? 
                  Semua data monitoring yang terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}