'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, BookOpen, CheckCircle, XCircle, Tag } from 'lucide-react';
import { api } from '@/lib/api';

interface MataPelajaranDetailProps {
  params: Promise<{
    id: string;
  }>;
}

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  kategori: 'Wajib' | 'Umum' | 'Peminatan' | 'TL' | 'Agama' | 'Mulok';
  status: 'Aktif' | 'Non-aktif';
}

interface Statistics {
  total_guru: number;
  total_kelas: number;
}

export default function DetailMataPelajaranPage({ params }: MataPelajaranDetailProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MataPelajaran | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_guru: 0,
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
      const response = await api.get(`/v1/mata-pelajaran/${id}`);
      
      if (response.data.success) {
        setData(response.data.data);
        setStatistics(response.data.data.statistics || { total_guru: 0, total_kelas: 0 });
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/mata-pelajaran');
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

  const getKategoriBadge = (kategori: string) => {
    const colors = {
      'Wajib': 'bg-blue-100 text-blue-800',
      'Umum': 'bg-gray-100 text-gray-800',
      'Peminatan': 'bg-purple-100 text-purple-800',
      'TL': 'bg-orange-100 text-orange-800',
      'Agama': 'bg-green-100 text-green-800',
      'Mulok': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[kategori as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        <Tag className="w-4 h-4 mr-2" />
        {kategori}
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
            href="/admin/mata-pelajaran"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Mata Pelajaran</h1>
            <p className="text-gray-600">Informasi lengkap mata pelajaran</p>
          </div>
        </div>
        <Link
          href={`/admin/mata-pelajaran/${id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Mata Pelajaran</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Nama Mata Pelajaran
                  </label>
                  <p className="text-gray-900 font-medium">{data.nama_mata_pelajaran}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Kode Mata Pelajaran
                  </label>
                  <p className="text-gray-900 font-medium">{data.kode_mata_pelajaran}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Kategori
                  </label>
                  <div className="mt-1">
                    {getKategoriBadge(data.kategori)}
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
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Total Guru</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{statistics.total_guru}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-700">Total Kelas</span>
                </div>
                <span className="text-lg font-bold text-green-600">{statistics.total_kelas}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Tambahan</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>ID Mata Pelajaran:</span>
                <span className="font-medium text-gray-900">{data.id_mata_pelajaran}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Kategori:</span>
                <span className="font-medium text-gray-900">{data.kategori}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium text-gray-900">{data.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}