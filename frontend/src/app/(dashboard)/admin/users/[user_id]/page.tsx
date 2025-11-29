'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Shield, 
  Clock, 
  CheckCircle,
  XCircle,
  Key,
  Calendar,
  UserCheck,
  Activity
} from 'lucide-react';
import { api } from '@/lib/api';

interface UserData {
  user_id: string;
  username: string;
  user_type: string;
  status: string;
  reference_id: string;
  nama_lengkap: string;
  created_date: string;
  updated_date?: string;
  last_login?: string;
}

export default function DetailUserPage() {
  const params = useParams();
  const user_id = params.user_id as string;
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/users/${user_id}`);
        if (response.data.success) {
          setUserData(response.data.data);
        } else {
          setError('Data user tidak ditemukan');
        }
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        setError(error.response?.data?.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };

    if (user_id) {
      fetchUserData();
    }
  }, [user_id]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date simple
  const formatDateSimple = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  // Get user type display name
  const getUserTypeDisplayName = (userType: string) => {
    return {
      'Admin': 'Administrator',
      'Kepala_Sekolah': 'Kepala Sekolah',
      'Guru': 'Guru',
      'Petugas_Keuangan': 'Petugas Keuangan',
      'Siswa': 'Siswa',
      'Orang_Tua': 'Orang Tua'
    }[userType] || userType;
  };

  // Get user type icon
  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'Admin': return <Shield size={20} className="text-red-600" />;
      case 'Kepala_Sekolah': return <UserCheck size={20} className="text-purple-600" />;
      case 'Guru': return <User size={20} className="text-blue-600" />;
      case 'Petugas_Keuangan': return <Activity size={20} className="text-green-600" />;
      case 'Siswa': return <User size={20} className="text-yellow-600" />;
      case 'Orang_Tua': return <User size={20} className="text-indigo-600" />;
      default: return <User size={20} className="text-gray-600" />;
    }
  };

  // Calculate account age
  const calculateAccountAge = (createdDate: string) => {
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} hari`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} bulan`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} tahun`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading data user...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">{error || 'Data user tidak ditemukan'}</p>
          <Link 
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Daftar Users
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
              href="/admin/users"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userData.username}</h1>
              <p className="text-gray-600">User ID: {userData.user_id}</p>
              <div className="flex items-center mt-1">
                {getUserTypeIcon(userData.user_type)}
                <span className="ml-2 text-blue-600 font-medium">
                  {getUserTypeDisplayName(userData.user_type)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href={`/admin/users/${user_id}/edit`}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={20} className="mr-2" />
              Edit User
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Informasi Akun
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-lg">{userData.user_id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                <p className="text-gray-900 font-medium text-lg">{userData.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipe User</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getUserTypeBadgeColor(userData.user_type)}`}>
                  {getUserTypeDisplayName(userData.user_type)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusBadgeColor(userData.status)}`}>
                  {userData.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Reference ID</label>
                <p className="text-gray-900 font-mono">{userData.reference_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
                <p className="text-gray-900 font-medium">{userData.nama_lengkap || '-'}</p>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity size={20} className="mr-2" />
              Aktivitas Login
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Login Terakhir</label>
                <div className="flex items-center text-gray-900">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <span>{userData.last_login ? formatDate(userData.last_login) : 'Belum pernah login'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status Login</label>
                <div className="flex items-center">
                  {userData.last_login ? (
                    <>
                      <CheckCircle size={16} className="mr-2 text-green-500" />
                      <span className="text-green-700 font-medium">Pernah Login</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="mr-2 text-orange-500" />
                      <span className="text-orange-700 font-medium">Belum Pernah Login</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar size={20} className="mr-2" />
              Informasi Akun
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Dibuat Tanggal</label>
                <div className="flex items-center text-gray-900">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <span>{formatDateSimple(userData.created_date)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Umur Akun</label>
                <div className="flex items-center text-gray-900">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <span>{calculateAccountAge(userData.created_date)}</span>
                </div>
              </div>

              {userData.updated_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Terakhir Diupdate</label>
                  <div className="flex items-center text-gray-900">
                    <Edit size={16} className="mr-2 text-gray-400" />
                    <span>{formatDateSimple(userData.updated_date)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-3">
              <Link
                href={`/admin/users/${user_id}/edit`}
                className="flex items-center w-full px-4 py-2 text-left bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Edit Data User
              </Link>
              
              <button
                onClick={() => {
                  const newPassword = prompt('Reset password untuk ' + userData.username + '?\nMasukkan password baru:');
                  if (newPassword && newPassword.length >= 6) {
                    const confirmPassword = prompt('Konfirmasi password baru:');
                    if (newPassword === confirmPassword) {
                      // Call reset password API
                      api.post(`/v1/users/${user_id}/reset-password`, {
                        new_password: newPassword,
                        new_password_confirmation: confirmPassword
                      }).then(() => {
                        alert('Password berhasil direset');
                      }).catch(() => {
                        alert('Gagal reset password');
                      });
                    } else {
                      alert('Password tidak cocok!');
                    }
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-left bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Key size={16} className="mr-2" />
                Reset Password
              </button>

              {userData.user_type === 'Siswa' && (
                <Link
                  href={`/admin/siswa/${userData.reference_id}`}
                  className="flex items-center w-full px-4 py-2 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <User size={16} className="mr-2" />
                  Lihat Data Siswa
                </Link>
              )}

              {userData.user_type === 'Guru' && (
                <Link
                  href={`/admin/guru/${userData.reference_id}`}
                  className="flex items-center w-full px-4 py-2 text-left bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <User size={16} className="mr-2" />
                  Lihat Data Guru
                </Link>
              )}
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield size={20} className="mr-2" />
              Keamanan
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Password</span>
                <span className="text-green-600 font-medium">Terenkripsi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status Akun</span>
                <span className={userData.status === 'Aktif' ? 'text-green-600' : 'text-red-600'}>
                  {userData.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}