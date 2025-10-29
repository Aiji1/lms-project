'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, BookOpen, Users, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';

interface DetailJadwalPelajaranPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface JadwalPelajaran {
  id_jadwal: number;
  id_tahun_ajaran: number;
  id_mata_pelajaran: number;
  nik_guru: string;
  id_kelas: number;
  hari: string;
  jam_ke: number;
  tahun_ajaran: string;
  semester: string;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  nama_guru: string;
  nama_kelas: string;
  tingkat: string;
  ruangan: string;
  created_at: string;
  updated_at: string;
}

export default function DetailJadwalPelajaranPage({ params }: DetailJadwalPelajaranPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { userRole } = useAuth();
  
  const [data, setData] = useState<JadwalPelajaran | null>(null);
  const [loading, setLoading] = useState(true);

  // Permission configuration for Jadwal Pelajaran Detail
  const jadwalDetailPermissions = {
    'Admin': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Guru': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS
  };

  const userPermissions = getUserPermission(userRole || 'Siswa', jadwalDetailPermissions);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/jadwal-pelajaran/${id}`);
      
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/jadwal-pelajaran');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal pelajaran ini?')) {
      return;
    }

    try {
      const response = await api.delete(`/v1/jadwal-pelajaran/${id}`);
      if (response.data.success) {
        alert('Jadwal pelajaran berhasil dihapus');
        router.push('/admin/jadwal-pelajaran');
      }
    } catch (error: any) {
      alert('Gagal menghapus: ' + (error.response?.data?.message || error.message));
    }
  };

  const getHariColor = (hari: string) => {
    const colors = {
      'Senin': 'bg-blue-100 text-blue-800',
      'Selasa': 'bg-green-100 text-green-800',
      'Rabu': 'bg-yellow-100 text-yellow-800',
      'Kamis': 'bg-purple-100 text-purple-800',
      'Jumat': 'bg-red-100 text-red-800'
    };
    return colors[hari as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Data tidak ditemukan</p>
          <Link
            href="/admin/jadwal-pelajaran"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Daftar Jadwal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/jadwal-pelajaran"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Detail Jadwal Pelajaran
            </h1>
            <p className="text-gray-600">Informasi lengkap jadwal pelajaran</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <PermissionGuard
            userRole={userRole || 'Siswa'}
            permissions={jadwalDetailPermissions}
            action="edit"
          >
            <Link
              href={`/admin/jadwal-pelajaran/${id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </PermissionGuard>
          <PermissionGuard
            userRole={userRole || 'Siswa'}
            permissions={jadwalDetailPermissions}
            action="delete"
          >
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Info Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Informasi Jadwal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hari
                </label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHariColor(data.hari)}`}>
                  {data.hari}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jam Ke
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 font-medium">Jam ke-{data.jam_ke}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Ajaran & Semester
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{data.tahun_ajaran} - {data.semester}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">ID Jadwal</p>
                <p className="text-xl font-bold">{data.id_jadwal}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Informasi Terakhir Diperbarui</h3>
            <p className="text-xs text-gray-500">
              {new Date(data.updated_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Subject, Teacher, and Class Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subject Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Mata Pelajaran
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Mata Pelajaran
              </label>
              <p className="text-sm text-gray-900 font-medium">{data.nama_mata_pelajaran}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode Mata Pelajaran
              </label>
              <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                {data.kode_mata_pelajaran}
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Guru Pengajar
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Guru
              </label>
              <p className="text-sm text-gray-900 font-medium">{data.nama_guru}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIK Guru
              </label>
              <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                {data.nik_guru}
              </div>
            </div>
          </div>
        </div>

        {/* Class Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Kelas
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kelas
              </label>
              <p className="text-sm text-gray-900 font-medium">{data.nama_kelas}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tingkat
              </label>
              <div className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                Kelas {data.tingkat}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruangan
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-900">{data.ruangan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Metadata
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dibuat Pada
            </label>
            <p className="text-sm text-gray-900">
              {new Date(data.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terakhir Diperbarui
            </label>
            <p className="text-sm text-gray-900">
              {new Date(data.updated_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}