'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface JurusanDetailProps {
  params: Promise<{
    id: string;
  }>;
}

interface Jurusan {
  id_jurusan: number;
  nama_jurusan: string;
  status: 'Aktif' | 'Non-aktif';
}

interface Statistics {
  total_siswa: number;
  total_kelas: number;
}

export default function DetailJurusanPage({ params }: JurusanDetailProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Jurusan | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_siswa: 0,
    total_kelas: 0
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/jurusan/${id}`);
      
      if (response.data.success) {
        setData(response.data.data.jurusan);
        setStatistics(response.data.data.statistics);
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/jurusan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'Aktif' ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-4 h-4 mr-2" />
        Aktif
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <XCircle className="w-4 h-4 mr-2" />
        Non-aktif
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/jurusan"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Jurusan</h1>
            <p className="text-gray-600">Informasi lengkap jurusan {data.nama_jurusan}</p>
          </div>
        </div>
        <Link
          href={`/admin/jurusan/${id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Jurusan</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                ID Jurusan
              </label>
              <p className="text-lg font-semibold text-gray-900">{data.id_jurusan}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nama Jurusan
              </label>
              <div className="flex items-center">
                <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-lg font-semibold text-gray-900">{data.nama_jurusan}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              <div className="mt-1">
                {getStatusBadge(data.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_siswa}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_kelas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <GraduationCap className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Informasi Jurusan</h3>
            <p className="text-sm text-blue-700 mt-1">
              Jurusan {data.nama_jurusan} {data.status === 'Aktif' ? 'sedang aktif' : 'tidak aktif'}.
              {statistics.total_kelas > 0 && (
                <span> Jurusan ini memiliki {statistics.total_kelas} kelas dengan total {statistics.total_siswa} siswa.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}