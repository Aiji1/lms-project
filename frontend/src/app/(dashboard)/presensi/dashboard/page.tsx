'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface TodayStats {
  tanggal: string;
  total_siswa: number;
  summary: {
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
    sudah_presensi: number;
    belum_presensi: number;
  };
  percentage: {
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
    kehadiran: number;
  };
  latest_scans: Array<{
    id_log: number;
    nis: string;
    tipe: string;
    metode: string;
    waktu_scan: string;
    nama_lengkap: string;
    nama_kelas: string;
  }>;
  siswa_terlambat: Array<{
    nis: string;
    nama_lengkap: string;
    nama_kelas: string;
    jam_masuk: string;
    selisih_waktu: string;
  }>;
}

export default function PresensiDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // ✅ Navigation guard to prevent multiple redirects
  const hasRedirected = useRef(false);
  const isNavigating = useRef(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (!hasRedirected.current && !isNavigating.current) {
          hasRedirected.current = true;
          isNavigating.current = true;
          router.push('/login');
        }
        return;
      }
      
      // ✅ FIXED: Use parentheses, not backticks!
      const response = await axios.get(`${API_URL}/presensi-harian/today-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      
      // Handle authentication error
      if (err.response?.status === 401 || err.response?.data?.message === 'Unauthenticated.') {
        localStorage.removeItem('token');
        if (!hasRedirected.current && !isNavigating.current) {
          hasRedirected.current = true;
          isNavigating.current = true;
          router.push('/login');
        }
        return;
      }
      
      setError(err.response?.data?.message || 'Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Memuat statistik...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Presensi</h1>
            <p className="text-gray-600">
              {format(new Date(stats.tanggal), 'EEEE, d MMMM yyyy', { locale: id })}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Update: {format(lastUpdate, 'HH:mm:ss')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Siswa */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Siswa</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.total_siswa}</h3>
            <p className="text-sm text-gray-500 mt-1">Siswa aktif</p>
          </div>

          {/* Hadir */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Hadir</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.summary.hadir}</h3>
            <p className="text-sm text-green-600 mt-1">
              {stats.percentage.hadir.toFixed(1)}% dari total
            </p>
          </div>

          {/* Terlambat */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Terlambat</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.summary.terlambat}</h3>
            <p className="text-sm text-orange-600 mt-1">
              {stats.percentage.terlambat.toFixed(1)}% dari total
            </p>
          </div>

          {/* Belum Presensi */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Belum Presensi</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.summary.belum_presensi}</h3>
            <p className="text-sm text-red-600 mt-1">
              {((stats.summary.belum_presensi / stats.total_siswa) * 100).toFixed(1)}% dari total
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Izin</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.summary.izin}</p>
            <p className="text-sm text-gray-500">{stats.percentage.izin.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Sakit</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.summary.sakit}</p>
            <p className="text-sm text-gray-500">{stats.percentage.sakit.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded">
                <UserX className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Alpha</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.summary.alpha}</p>
            <p className="text-sm text-gray-500">{stats.percentage.alpha.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Scans */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Scan Terbaru</h2>
              <p className="text-sm text-gray-500">10 presensi terakhir</p>
            </div>
            <div className="p-6">
              {stats.latest_scans.length > 0 ? (
                <div className="space-y-4">
                  {stats.latest_scans.map((scan) => (
                    <div
                      key={scan.id_log}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{scan.nama_lengkap}</p>
                        <p className="text-sm text-gray-500">{scan.nama_kelas} • {scan.nis}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          scan.tipe === 'masuk' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {scan.tipe === 'masuk' ? 'Masuk' : 'Pulang'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(scan.waktu_scan), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Belum ada presensi hari ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Siswa Terlambat */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Siswa Terlambat</h2>
              <p className="text-sm text-gray-500">Daftar siswa yang datang terlambat</p>
            </div>
            <div className="p-6">
              {stats.siswa_terlambat.length > 0 ? (
                <div className="space-y-4">
                  {stats.siswa_terlambat.map((siswa) => (
                    <div
                      key={siswa.nis}
                      className="flex items-center justify-between p-4 bg-orange-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{siswa.nama_lengkap}</p>
                        <p className="text-sm text-gray-500">{siswa.nama_kelas} • {siswa.nis}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">{siswa.selisih_waktu}</p>
                        <p className="text-xs text-gray-500">{siswa.jam_masuk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Tidak ada siswa terlambat</p>
                  <p className="text-sm">Semua siswa datang tepat waktu! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (!isNavigating.current) {
                isNavigating.current = true;
                router.push('/presensi/scanner');
                setTimeout(() => { isNavigating.current = false; }, 1000);
              }
            }}
            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Buka Scanner</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (!isNavigating.current) {
                isNavigating.current = true;
                router.push('/presensi/harian');
                setTimeout(() => { isNavigating.current = false; }, 1000);
              }
            }}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Lihat Semua Presensi</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (!isNavigating.current) {
                isNavigating.current = true;
                router.push('/laporan/presensi');
                setTimeout(() => { isNavigating.current = false; }, 1000);
              }
            }}
            className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-between"
          >
            <span className="font-medium">Laporan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}