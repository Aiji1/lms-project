'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, GraduationCap, User, BookOpen, Calendar, Award, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

interface NilaiSiswa {
  id_nilai: number;
  nis: string;
  nama_siswa: string;
  kelas: string;
  mata_pelajaran: string;
  jenis_penilaian: 'PH1' | 'PH2' | 'PH3' | 'ASTS1' | 'ASAS' | 'ASTS2' | 'ASAT' | 'Tugas' | 'Praktek';
  nilai: number;
  status: 'Draft' | 'Final';
  tanggal_input: string;
  nama_guru: string;
  keterangan?: string;
  tahun_ajaran: string;
  semester: string;
}

export default function DetailNilaiSiswaPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  // Permission configuration
  const nilaiSiswaPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.role as any || 'Siswa', nilaiSiswaPermissions);

  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiSiswa | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNilaiSiswa();
    }
  }, [id]);

  const fetchNilaiSiswa = async () => {
    try {
      const response = await api.get(`/v1/nilai/${id}`);
      if (response.data.success) {
        setNilaiSiswa(response.data.data);
      } else {
        router.push('/pembelajaran/nilai-siswa');
      }
    } catch (error) {
      console.error('Error fetching nilai siswa:', error);
      router.push('/pembelajaran/nilai-siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!nilaiSiswa) return;

    try {
      const response = await api.delete(`/v1/nilai/${nilaiSiswa.id_nilai}`);
      if (response.data.success) {
        router.push('/pembelajaran/nilai-siswa');
      } else {
        alert('Gagal menghapus data nilai');
      }
    } catch (error) {
      console.error('Error deleting nilai:', error);
      alert('Terjadi kesalahan saat menghapus data nilai');
    }
  };

  const getJenisPenilaianLabel = (jenis: string) => {
    const labels: Record<string, string> = {
      'PH1': 'Penilaian Harian 1',
      'PH2': 'Penilaian Harian 2',
      'PH3': 'Penilaian Harian 3',
      'ASTS1': 'Asesmen Sumatif Tengah Semester 1',
      'ASAS': 'Asesmen Sumatif Akhir Semester',
      'ASTS2': 'Asesmen Sumatif Tengah Semester 2',
      'ASAT': 'Asesmen Sumatif Akhir Tahun',
      'Tugas': 'Tugas',
      'Praktek': 'Praktek'
    };
    return labels[jenis] || jenis;
  };

  const getJenisPenilaianBadge = (jenis: string) => {
    const colors: Record<string, string> = {
      'PH1': 'bg-blue-100 text-blue-800',
      'PH2': 'bg-blue-100 text-blue-800',
      'PH3': 'bg-blue-100 text-blue-800',
      'ASTS1': 'bg-purple-100 text-purple-800',
      'ASAS': 'bg-red-100 text-red-800',
      'ASTS2': 'bg-purple-100 text-purple-800',
      'ASAT': 'bg-red-100 text-red-800',
      'Tugas': 'bg-green-100 text-green-800',
      'Praktek': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[jenis] || 'bg-gray-100 text-gray-800'}`}>
        {getJenisPenilaianLabel(jenis)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        status === 'Final' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {status}
      </span>
    );
  };

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600';
    if (nilai >= 70) return 'text-blue-600';
    if (nilai >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (!nilaiSiswa) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nilai Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Data nilai yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Link
            href="/pembelajaran/nilai-siswa"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Nilai
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
            href="/pembelajaran/nilai-siswa"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              Detail Nilai Siswa
            </h1>
            <p className="text-gray-600">Informasi lengkap nilai siswa</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {userPermissions.edit && (
            <Link
              href={`/pembelajaran/nilai-siswa/${id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
          {userPermissions.delete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nilai Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-2 ${getNilaiColor(nilaiSiswa.nilai)}`}>
                {nilaiSiswa.nilai}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {getJenisPenilaianBadge(nilaiSiswa.jenis_penilaian)}
                {getStatusBadge(nilaiSiswa.status)}
              </div>
              <p className="text-gray-600">
                {nilaiSiswa.mata_pelajaran} - {nilaiSiswa.tahun_ajaran}
              </p>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Informasi Siswa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
                <p className="text-gray-900 font-medium">{nilaiSiswa.nama_siswa}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                <p className="text-gray-900">{nilaiSiswa.nis}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <p className="text-gray-900">{nilaiSiswa.kelas}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <p className="text-gray-900">{nilaiSiswa.semester}</p>
              </div>
            </div>
          </div>

          {/* Assessment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Detail Penilaian
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  {nilaiSiswa.mata_pelajaran}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Penilaian</label>
                <div>{getJenisPenilaianBadge(nilaiSiswa.jenis_penilaian)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nilai</label>
                <p className={`text-2xl font-bold ${getNilaiColor(nilaiSiswa.nilai)}`}>
                  {nilaiSiswa.nilai}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div>{getStatusBadge(nilaiSiswa.status)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guru Penginput</label>
                <p className="text-gray-900">{nilaiSiswa.nama_guru}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Input</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(nilaiSiswa.tanggal_input)}
                </p>
              </div>
            </div>
          </div>

          {/* Keterangan */}
          {nilaiSiswa.keterangan && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Keterangan</h2>
              <div className="prose max-w-none">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {nilaiSiswa.keterangan}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-3">
              {userPermissions.edit && (
                <Link
                  href={`/pembelajaran/nilai-siswa/${id}/edit`}
                  className="w-full flex items-center px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Nilai
                </Link>
              )}
              <Link
                href="/pembelajaran/nilai-siswa/tambah"
                className="w-full flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Tambah Nilai Baru
              </Link>
              <Link
                href="/pembelajaran/nilai-siswa"
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar
              </Link>
            </div>
          </div>

          {/* Grade Scale */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skala Nilai</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">85-100</span>
                <span className="text-sm font-medium text-green-600">Sangat Baik</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">70-84</span>
                <span className="text-sm font-medium text-blue-600">Baik</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">60-69</span>
                <span className="text-sm font-medium text-yellow-600">Cukup</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">0-59</span>
                <span className="text-sm font-medium text-red-600">Kurang</span>
              </div>
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
              <h3 className="text-lg font-medium text-gray-900 mt-2">Hapus Data Nilai</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus nilai {nilaiSiswa.jenis_penilaian} 
                  untuk {nilaiSiswa.nama_siswa} pada mata pelajaran {nilaiSiswa.mata_pelajaran}?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
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