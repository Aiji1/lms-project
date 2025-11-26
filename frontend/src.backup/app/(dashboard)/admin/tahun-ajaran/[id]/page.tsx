'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Calendar, CheckCircle, XCircle, Users, BookOpen, School } from 'lucide-react';
import { api } from '@/lib/api';

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: 'Ganjil' | 'Genap';
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'Aktif' | 'Non-aktif';
}

interface Statistics {
  total_kelas: number;
  total_siswa: number;
  total_kurikulum: number;
}

export default function DetailTahunAjaranPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TahunAjaran | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    total_kelas: 0,
    total_siswa: 0,
    total_kurikulum: 0
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/tahun-ajaran/${id}`);
      
      if (response.data.success) {
        setData(response.data.data.tahun_ajaran);
        setStatistics(response.data.data.statistics);
      }
    } catch (error: any) {
      alert('Gagal mengambil data: ' + (error.response?.data?.message || error.message));
      router.push('/admin/tahun-ajaran');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
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
            href="/admin/tahun-ajaran"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Tahun Ajaran</h1>
            <p className="text-gray-600">Informasi lengkap tahun ajaran {data.tahun_ajaran}</p>
          </div>
        </div>
        <Link
          href={`/admin/tahun-ajaran/${id}/edit`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Link>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Tahun Ajaran</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tahun Ajaran
              </label>
              <p className="text-lg font-semibold text-gray-900">{data.tahun_ajaran}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Semester
              </label>
              <p className="text-lg font-semibold text-gray-900">{data.semester}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tanggal Mulai
              </label>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-lg text-gray-900">{formatDate(data.tanggal_mulai)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tanggal Selesai
              </label>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-lg text-gray-900">{formatDate(data.tanggal_selesai)}</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Durasi
              </label>
              <p className="text-lg text-gray-900">
                {Math.ceil((new Date(data.tanggal_selesai).getTime() - new Date(data.tanggal_mulai).getTime()) / (1000 * 60 * 60 * 24))} hari
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-black p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_kelas}</p>
            </div>
          </div>
        </div>

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
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kurikulum</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_kurikulum}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Informasi Periode</h3>
            <p className="text-sm text-blue-700 mt-1">
              Tahun ajaran {data.tahun_ajaran} semester {data.semester} 
              {data.status === 'Aktif' ? ' sedang berlangsung' : ' sudah berakhir'}.
              {statistics.total_kelas > 0 && (
                <span> Tahun ajaran ini memiliki {statistics.total_kelas} kelas dengan total {statistics.total_siswa} siswa.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}