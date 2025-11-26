'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Calendar, 
  Phone, 
  MapPin,
  BookOpen,
  Briefcase,
  Mail,
  Clock,
  Award,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, DEFAULT_PERMISSIONS, UserRole } from '@/types/permissions';

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: string;
}

interface GuruData {
  nik_guru: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat?: string;
  no_telepon?: string;
  status_kepegawaian: string;
  jabatan: string;
  status: string;
  mata_pelajaran: MataPelajaran[];
  wali_kelas_nama?: string;
}

export default function DetailGuruPage() {
  const params = useParams();
  const nik_guru = params.nik_guru as string;
  const { user } = useAuth();
  
  // Permission configuration for Detail Guru
  const detailGuruPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Guru': READ_ONLY_PERMISSIONS,
    'Siswa': DEFAULT_PERMISSIONS,
    'Petugas_Keuangan': DEFAULT_PERMISSIONS,
    'Orang_Tua': DEFAULT_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as UserRole || 'Siswa', detailGuruPermissions);
  
  const [loading, setLoading] = useState(true);
  const [guruData, setGuruData] = useState<GuruData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchGuruData = async () => {
      try {
        const response = await api.get(`/v1/guru/${nik_guru}`);
        if (response.data.success) {
          setGuruData(response.data.data);
        } else {
          setError('Data guru tidak ditemukan');
        }
      } catch (error: any) {
        console.error('Error fetching guru data:', error);
        setError(error.response?.data?.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    if (nik_guru) {
      fetchGuruData();
    }
  }, [nik_guru]);

  // Calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800 border-green-200';
      case 'Non-aktif': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusKepegawaianBadgeColor = (status: string) => {
    switch (status) {
      case 'PTY': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PTYK': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Capeg': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Honorer': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pengganti': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group mata pelajaran by category
  const groupedMataPelajaran = guruData?.mata_pelajaran.reduce((groups, mapel) => {
    const category = mapel.kategori;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(mapel);
    return groups;
  }, {} as Record<string, MataPelajaran[]>) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading data guru...</p>
        </div>
      </div>
    );
  }

  if (error || !guruData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">{error || 'Data guru tidak ditemukan'}</p>
          <Link 
            href="/admin/guru"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Daftar Guru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/guru"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{guruData.nama_lengkap}</h1>
              <p className="text-gray-600">NIK: {guruData.nik_guru}</p>
              {guruData.wali_kelas_nama && (
                <p className="text-blue-600 font-medium">
                  Wali Kelas: {guruData.wali_kelas_nama}
                </p>
              )}
            </div>
          </div>
          {userPermissions.edit && (
            <div className="mt-4 md:mt-0">
              <Link
                href={`/admin/guru/${nik_guru}/edit`}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit size={20} className="mr-2" />
                Edit Data
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pribadi */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Data Pribadi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
                <p className="text-gray-900 font-medium">{guruData.nama_lengkap}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">NIK</label>
                <p className="text-gray-900 font-mono">{guruData.nik_guru}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tanggal Lahir</label>
                <div className="flex items-center text-gray-900">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span>{formatDate(guruData.tanggal_lahir)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Umur: {calculateAge(guruData.tanggal_lahir)} tahun
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Jenis Kelamin</label>
                <p className="text-gray-900">
                  {guruData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>

              {guruData.no_telepon && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">No. Telepon</label>
                  <div className="flex items-center text-gray-900">
                    <Phone size={16} className="mr-2 text-gray-400" />
                    <a href={`tel:${guruData.no_telepon}`} className="hover:text-blue-600">
                      {guruData.no_telepon}
                    </a>
                  </div>
                </div>
              )}

              {guruData.alamat && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Alamat</label>
                  <div className="flex items-start text-gray-900">
                    <MapPin size={16} className="mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{guruData.alamat}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mata Pelajaran */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen size={20} className="mr-2" />
              Mata Pelajaran ({guruData.mata_pelajaran.length})
            </h2>
            
            {guruData.mata_pelajaran.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedMataPelajaran).map(([category, mapels]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 bg-gray-50 px-3 py-1 rounded">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mapels.map(mapel => (
                        <div 
                          key={mapel.id_mata_pelajaran}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{mapel.nama_mata_pelajaran}</p>
                            <p className="text-sm text-gray-500">{mapel.kode_mata_pelajaran}</p>
                          </div>
                          <CheckCircle size={16} className="text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Belum ada mata pelajaran yang diajarkan</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Briefcase size={20} className="mr-2" />
              Status Kepegawaian
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Status Kepegawaian</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusKepegawaianBadgeColor(guruData.status_kepegawaian)}`}>
                  {guruData.status_kepegawaian}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Jabatan</label>
                <p className="text-gray-900 font-medium">
                  {guruData.jabatan.replace('_', ' dan ')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Status Aktif</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(guruData.status)}`}>
                  {guruData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award size={20} className="mr-2" />
              Statistik
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen size={16} className="mr-2 text-blue-500" />
                  <span className="text-gray-600">Mata Pelajaran</span>
                </div>
                <span className="font-bold text-blue-600">{guruData.mata_pelajaran.length}</span>
              </div>

              {guruData.wali_kelas_nama && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users size={16} className="mr-2 text-green-500" />
                    <span className="text-gray-600">Wali Kelas</span>
                  </div>
                  <span className="font-bold text-green-600">Ya</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2 text-purple-500" />
                  <span className="text-gray-600">Umur</span>
                </div>
                <span className="font-bold text-purple-600">
                  {calculateAge(guruData.tanggal_lahir)} tahun
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-3">
              {userPermissions.edit && (
                <Link
                  href={`/admin/guru/${nik_guru}/edit`}
                  className="flex items-center w-full px-4 py-2 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Data Guru
                </Link>
              )}
              
              <Link
                href={`/guru/jadwal?guru=${nik_guru}`}
                className="flex items-center w-full px-4 py-2 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar size={16} className="mr-2" />
                Lihat Jadwal Mengajar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}