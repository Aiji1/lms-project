'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Building, Users, BookOpen, Calendar, User } from 'lucide-react';
import { api } from '@/lib/api';

interface Kelas {
  id_kelas: number;
  ruangan: string;
  nama_kelas: string;
  tingkat: string;
  kapasitas_maksimal: number;
  wali_kelas: string | null;
  nama_jurusan: string;
  tahun_ajaran: string;
  semester: string;
  nama_wali_kelas: string | null;
}

interface Statistics {
  total_siswa: number;
  total_jadwal: number;
  total_tugas: number;
}

export default function DetailKelasPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Kelas | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_siswa: 0,
    total_jadwal: 0,
    total_tugas: 0
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/kelas/${id}`);
      
      if (response.data.success) {
        setData(response.data.data.kelas);
        setStatistics(response.data.data.statistics);
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/kelas');
    } finally {
      setLoading(false);
    }
  };

  const getCapacityStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) {
      return { color: 'bg-red-500', text: 'Penuh', textColor: 'text-red-600' };
    } else if (percentage >= 70) {
      return { color: 'bg-yellow-500', text: 'Hampir Penuh', textColor: 'text-yellow-600' };
    } else {
      return { color: 'bg-green-500', text: 'Tersedia', textColor: 'text-green-600' };
    }
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
        </div>
      </div>
    );
  }

  const capacityStatus = getCapacityStatus(statistics.total_siswa, data.kapasitas_maksimal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/kelas"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Kelas</h1>
            <p className="text-gray-600">Informasi lengkap kelas {data.nama_kelas}</p>
          </div>
        </div>
        <Link
          href={`/admin/kelas/${id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Kelas
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{data.nama_kelas}</h2>
              <p className="text-gray-600">Kelas {data.tingkat} - {data.nama_jurusan}</p>
              <p className="text-sm text-gray-500">{data.tahun_ajaran} - {data.semester}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${capacityStatus.textColor}`}>
              {capacityStatus.text}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {statistics.total_siswa}/{data.kapasitas_maksimal}
            </div>
            <div className="text-sm text-gray-500">Siswa</div>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Kapasitas Kelas</span>
            <span>{Math.round((statistics.total_siswa / data.kapasitas_maksimal) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${capacityStatus.color}`}
              style={{ width: `${Math.min((statistics.total_siswa / data.kapasitas_maksimal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruangan</label>
            <div className="flex items-center text-gray-900">
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              Ruangan {data.ruangan}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat</label>
            <div className="text-gray-900">Kelas {data.tingkat}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
            <div className="text-gray-900">{data.nama_jurusan}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran</label>
            <div className="flex items-center text-gray-900">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              {data.tahun_ajaran} - {data.semester}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
            <div className="flex items-center text-gray-900">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              {data.nama_wali_kelas || 'Belum ditentukan'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas Maksimal</label>
            <div className="flex items-center text-gray-900">
              <Users className="w-4 h-4 mr-2 text-gray-400" />
              {data.kapasitas_maksimal} siswa
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_siswa}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span>Dari {data.kapasitas_maksimal} kapasitas</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jadwal Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_jadwal}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span>Mata pelajaran terjadwal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tugas Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_tugas}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span>Tugas yang sedang berlangsung</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Tambahan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status Kapasitas</h4>
            <p className="text-sm text-gray-600">
              Kelas ini saat ini memiliki {statistics.total_siswa} siswa dari kapasitas maksimal {data.kapasitas_maksimal} siswa.
              {statistics.total_siswa < data.kapasitas_maksimal && (
                <span className="text-green-600"> Masih tersedia {data.kapasitas_maksimal - statistics.total_siswa} tempat.</span>
              )}
              {statistics.total_siswa >= data.kapasitas_maksimal && (
                <span className="text-red-600"> Kelas sudah penuh.</span>
              )}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Aktivitas Pembelajaran</h4>
            <p className="text-sm text-gray-600">
              Terdapat {statistics.total_jadwal} mata pelajaran yang terjadwal dan {statistics.total_tugas} tugas aktif 
              yang sedang berlangsung di kelas ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}