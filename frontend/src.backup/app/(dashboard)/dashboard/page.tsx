'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Clock,
  Award,
  CreditCard,
  Bell,
  FileText,
  Target,
  DollarSign,
  QrCode
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  totalMapel: number;
  totalTahunAjaran?: number;
  totalJurusan?: number;
  totalUsers?: number;
  // Role-specific stats
  activeUsers?: number;
  inactiveUsers?: number;
  totalPrestasi?: number;
  totalLaporan?: number;
  kelasDiampu?: number;
  totalSiswaGuru?: number;
  tugasAktif?: number;
  penilaian?: number;
  rataRataNilai?: number;
  persentaseKehadiran?: number;
  tugasDiselesaikan?: number;
  tugasPending?: number;
  totalTagihan?: number;
  pembayaranBulanIni?: number;
  tunggakan?: number;
  totalPendapatan?: number;
  jumlahAnak?: number;
  rataRataNilaiAnak?: number;
  kehadiranAnak?: number;
  tagihan?: number;
}

interface UserData {
  user_id: string;
  username: string;
  user_type: string;
  nama_lengkap: string;
  reference_id: string;
}

interface RecentActivity {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description: string;
  time: string;
}

interface DashboardData {
  stats: DashboardStats;
  user: UserData;
  recentActivities: RecentActivity[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalGuru: 0,
    totalKelas: 0,
    totalMapel: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await api.get('/v1/dashboard/stats');
      
      if (response.data.success) {
        setStats(response.data.data.stats);
        setUser(response.data.data.user);
        setRecentActivities(response.data.data.recentActivities);
      } else {
        console.error('Failed to fetch dashboard data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user data from localStorage as fallback
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('Dashboard User:', parsedUser); // Debug log
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Fetch real data from API
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      'Admin': 'Administrator',
      'Kepala_Sekolah': 'Kepala Sekolah',
      'Guru': 'Guru',
      'Petugas_Keuangan': 'Petugas Keuangan',
      'Siswa': 'Siswa',
      'Orang_Tua': 'Orang Tua'
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  // Role-specific dashboard content
  const getDashboardContent = () => {
    if (!user) return null;

    switch (user.user_type) {
      case 'Admin':
        return {
          title: 'Dashboard Administrator',
          subtitle: 'Kelola semua aspek sistem sekolah',
          stats: [
            { title: 'Total Siswa', value: stats.totalSiswa, icon: <GraduationCap size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { title: 'Total Guru', value: stats.totalGuru, icon: <Users size={24} />, color: 'bg-green-500', textColor: 'text-green-600' },
            { title: 'Total Kelas', value: stats.totalKelas, icon: <BookOpen size={24} />, color: 'bg-purple-500', textColor: 'text-purple-600' },
            { title: 'Mata Pelajaran', value: stats.totalMapel, icon: <Calendar size={24} />, color: 'bg-orange-500', textColor: 'text-orange-600' }
          ],
          quickActions: [
            { title: 'Data Siswa', subtitle: 'Kelola data siswa', icon: <Users size={24} />, color: 'text-blue-600', href: '/admin/siswa' },
            { title: 'Data Guru', subtitle: 'Kelola data guru', icon: <GraduationCap size={24} />, color: 'text-green-600', href: '/admin/guru' },
            { title: 'Data User', subtitle: 'Kelola akun user', icon: <Users size={24} />, color: 'text-purple-600', href: '/admin/users' },
            { title: 'Pengaturan', subtitle: 'Konfigurasi sistem', icon: <FileText size={24} />, color: 'text-orange-600', href: '/settings' }
          ]
        };

      case 'Kepala_Sekolah':
        return {
          title: 'Dashboard Kepala Sekolah',
          subtitle: 'Monitoring dan evaluasi sekolah',
          stats: [
            { title: 'Total Siswa', value: stats.totalSiswa, icon: <GraduationCap size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { title: 'Total Guru', value: stats.totalGuru, icon: <Users size={24} />, color: 'bg-green-500', textColor: 'text-green-600' },
            { title: 'Prestasi', value: 24, icon: <Award size={24} />, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
            { title: 'Laporan', value: 12, icon: <FileText size={24} />, color: 'bg-red-500', textColor: 'text-red-600' }
          ],
          quickActions: [
            { title: 'Laporan', subtitle: 'Lihat laporan sekolah', icon: <FileText size={24} />, color: 'text-blue-600', href: '/laporan' },
            { title: 'Data Siswa', subtitle: 'Monitoring siswa', icon: <Users size={24} />, color: 'text-green-600', href: '/admin/siswa' },
            { title: 'Data Guru', subtitle: 'Monitoring guru', icon: <GraduationCap size={24} />, color: 'text-purple-600', href: '/admin/guru' },
            { title: 'Statistik', subtitle: 'Analisis data', icon: <TrendingUp size={24} />, color: 'text-orange-600', href: '/laporan/statistik' }
          ]
        };

      case 'Guru':
        return {
          title: 'Dashboard Guru',
          subtitle: 'Portal pembelajaran dan penilaian',
          stats: [
            { title: 'Kelas Diampu', value: 5, icon: <BookOpen size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { title: 'Total Siswa', value: 180, icon: <Users size={24} />, color: 'bg-green-500', textColor: 'text-green-600' },
            { title: 'Tugas Aktif', value: 8, icon: <FileText size={24} />, color: 'bg-purple-500', textColor: 'text-purple-600' },
            { title: 'Penilaian', value: 15, icon: <Award size={24} />, color: 'bg-orange-500', textColor: 'text-orange-600' }
          ],
          quickActions: [
            { title: 'Jadwal Mengajar', subtitle: 'Lihat jadwal hari ini', icon: <Calendar size={24} />, color: 'text-blue-600', href: '/jadwal' },
            { title: 'Input Nilai', subtitle: 'Input nilai siswa', icon: <Award size={24} />, color: 'text-green-600', href: '/nilai' },
            { title: 'Jurnal Mengajar', subtitle: 'Catat kegiatan mengajar', icon: <BookOpen size={24} />, color: 'text-purple-600', href: '/guru/jurnal' },
            { title: 'Presensi', subtitle: 'Presensi siswa', icon: <Users size={24} />, color: 'text-orange-600', href: '/presensi' }
          ]
        };

      case 'Siswa':
        return {
          title: 'Dashboard Siswa',
          subtitle: 'Portal pembelajaran dan informasi',
          stats: [
            { title: 'Rata-rata Nilai', value: 87.5, icon: <Award size={24} />, color: 'bg-green-500', textColor: 'text-green-600' },
            { title: 'Kehadiran', value: 95.2, icon: <Calendar size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { title: 'Tugas Selesai', value: 24, icon: <FileText size={24} />, color: 'bg-purple-500', textColor: 'text-purple-600' },
            { title: 'Peringkat', value: 3, icon: <TrendingUp size={24} />, color: 'bg-yellow-500', textColor: 'text-yellow-600' }
          ],
          quickActions: [
            { title: 'QR Code Presensi', subtitle: 'Tampilkan QR code untuk presensi', icon: <QrCode size={24} />, color: 'text-blue-600', href: '/siswa/barcode' },
            { title: 'Nilai Saya', subtitle: 'Lihat nilai rapor', icon: <Award size={24} />, color: 'text-green-600', href: '/pembelajaran/nilai-siswa' },
            { title: 'Jadwal Pelajaran', subtitle: 'Jadwal hari ini', icon: <Calendar size={24} />, color: 'text-purple-600', href: '/jadwal' },
            { title: 'Tugas', subtitle: 'Tugas yang harus dikerjakan', icon: <FileText size={24} />, color: 'text-orange-600', href: '/tugas' }
          ]
        };

      case 'Orang_Tua':
        return {
          title: 'Dashboard Orang Tua',
          subtitle: 'Monitoring perkembangan putra/putri',
          stats: [
            { title: 'Rata-rata Nilai', value: 87.5, icon: <Award size={24} />, color: 'bg-green-500', textColor: 'text-green-600' },
            { title: 'Kehadiran', value: 95.2, icon: <Calendar size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' },
            { title: 'Peringkat Kelas', value: 3, icon: <TrendingUp size={24} />, color: 'bg-purple-500', textColor: 'text-purple-600' },
            { title: 'Status SPP', value: 'Lunas', icon: <CreditCard size={24} />, color: 'bg-yellow-500', textColor: 'text-yellow-600', isText: true }
          ],
          quickActions: [
            { title: 'Nilai Anak', subtitle: 'Lihat rapor putra/putri', icon: <Award size={24} />, color: 'text-blue-600', href: '/nilai' },
            { title: 'Jadwal Pelajaran', subtitle: 'Jadwal harian anak', icon: <Calendar size={24} />, color: 'text-green-600', href: '/jadwal' },
            { title: 'Presensi Anak', subtitle: 'Monitor kehadiran', icon: <Users size={24} />, color: 'text-purple-600', href: '/presensi' },
            { title: 'Tagihan SPP', subtitle: 'Status pembayaran', icon: <CreditCard size={24} />, color: 'text-orange-600', href: '/keuangan/tagihan' }
          ]
        };

      case 'Petugas_Keuangan':
        return {
          title: 'Dashboard Keuangan',
          subtitle: 'Manajemen keuangan sekolah',
          stats: [
            { title: 'Total Tagihan', value: 'Rp 125M', icon: <DollarSign size={24} />, color: 'bg-red-500', textColor: 'text-red-600', isText: true },
            { title: 'Sudah Bayar', value: 'Rp 98M', icon: <CreditCard size={24} />, color: 'bg-green-500', textColor: 'text-green-600', isText: true },
            { title: 'Tunggakan', value: 'Rp 27M', icon: <Clock size={24} />, color: 'bg-yellow-500', textColor: 'text-yellow-600', isText: true },
            { title: 'Siswa Lunas', value: 398, icon: <Users size={24} />, color: 'bg-blue-500', textColor: 'text-blue-600' }
          ],
          quickActions: [
            { title: 'Tagihan Siswa', subtitle: 'Kelola tagihan SPP', icon: <FileText size={24} />, color: 'text-blue-600', href: '/keuangan/tagihan' },
            { title: 'Pembayaran', subtitle: 'Input pembayaran', icon: <CreditCard size={24} />, color: 'text-green-600', href: '/keuangan/pembayaran' },
            { title: 'Laporan Keuangan', subtitle: 'Laporan dan statistik', icon: <TrendingUp size={24} />, color: 'text-purple-600', href: '/keuangan/laporan' },
            { title: 'Jenis Pembayaran', subtitle: 'Kelola jenis tagihan', icon: <DollarSign size={24} />, color: 'text-orange-600', href: '/keuangan/jenis-pembayaran' }
          ]
        };

      default:
        return {
          title: 'Dashboard',
          subtitle: 'Sistem Learning Management',
          stats: [],
          quickActions: []
        };
    }
  };

  const content = getDashboardContent();
  if (!content || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}!
            </h1>
            <p className="text-gray-600 mt-1">{content.subtitle}</p>
            <p className="text-sm text-gray-500 mt-1">
              Selamat datang, <span className="font-medium">{user.nama_lengkap}</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900">{getUserTypeLabel(user.user_type)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {content.stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.stats.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {card.isText ? card.value : card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.color} text-white p-3 rounded-lg`}>
                  {card.icon}
                </div>
              </div>
              {!card.isText && (
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600 font-medium">
                    +5.2%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    dari bulan lalu
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Aktivitas Terbaru
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <Clock size={12} className="text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Menu Cepat
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {content.quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`${action.color} mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <p className="text-sm font-medium text-gray-900 text-center">{action.title}</p>
                <p className="text-xs text-gray-600 text-center mt-1">{action.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}