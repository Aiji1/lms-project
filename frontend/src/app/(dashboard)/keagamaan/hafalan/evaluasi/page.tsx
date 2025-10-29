'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  Award
} from 'lucide-react';

interface EvaluasiHafalan {
  id_evaluasi: number;
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  periode_evaluasi: 'Bulanan' | '3_Bulanan' | 'Semesteran';
  bulan_periode?: string;
  total_baris_target: number;
  target_surah_mulai?: string;
  target_ayat_mulai?: number;
  target_surah_selesai?: string;
  target_ayat_selesai?: number;
  total_baris_tercapai: number;
  tercapai_surah_mulai?: string;
  tercapai_ayat_mulai?: number;
  tercapai_surah_selesai?: string;
  tercapai_ayat_selesai?: number;
  status_ketuntasan: 'Tuntas' | 'Belum_Tuntas';
  id_tahun_ajaran: number;
  tahun_ajaran?: string;
  persentase_ketercapaian?: number;
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

interface Statistik {
  total_evaluasi: number;
  tuntas: number;
  belum_tuntas: number;
  rata_rata_baris_tercapai: number;
  total_target_keseluruhan: number;
  total_tercapai_keseluruhan: number;
  persentase_keseluruhan: number;
}

export default function EvaluasiHafalanPage() {
  const [evaluasiHafalan, setEvaluasiHafalan] = useState<EvaluasiHafalan[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [statistik, setStatistik] = useState<Statistik | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodeFilter, setPeriodeFilter] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvaluasi, setSelectedEvaluasi] = useState<EvaluasiHafalan | null>(null);

  useEffect(() => {
    fetchData();
  }, [tahunAjaranFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evaluasiResponse, formDataResponse, statistikResponse] = await Promise.all([
        api.get('/evaluasi-hafalan'),
        api.get('/evaluasi-hafalan-form-data'),
        api.get('/evaluasi-hafalan/statistik', {
          params: tahunAjaranFilter ? { id_tahun_ajaran: tahunAjaranFilter } : {}
        })
      ]);

      if (evaluasiResponse.data.success) {
        const evaluasiData = evaluasiResponse.data.data.data || [];
        // Calculate percentage for each item
        const evaluasiWithPercentage = evaluasiData.map((item: EvaluasiHafalan) => ({
          ...item,
          persentase_ketercapaian: item.total_baris_target > 0 
            ? Math.round((item.total_baris_tercapai / item.total_baris_target) * 100)
            : 0
        }));
        setEvaluasiHafalan(evaluasiWithPercentage);
      }

      if (formDataResponse.data.success) {
        setTahunAjaran(formDataResponse.data.data.tahun_ajaran || []);
      }

      if (statistikResponse.data.success) {
        setStatistik(statistikResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvaluasi) return;

    try {
      const response = await api.delete(`/evaluasi-hafalan/${selectedEvaluasi.id_evaluasi}`);
      if (response.data.success) {
        await fetchData();
        setShowDeleteModal(false);
        setSelectedEvaluasi(null);
      }
    } catch (error) {
      console.error('Error deleting evaluasi hafalan:', error);
    }
  };

  const filteredEvaluasiHafalan = evaluasiHafalan.filter(item => {
    const matchesSearch = 
      item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bulan_periode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status_ketuntasan === statusFilter;
    const matchesPeriode = !periodeFilter || item.periode_evaluasi === periodeFilter;
    const matchesTahunAjaran = !tahunAjaranFilter || item.id_tahun_ajaran.toString() === tahunAjaranFilter;
    
    return matchesSearch && matchesStatus && matchesPeriode && matchesTahunAjaran;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Tuntas': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Belum_Tuntas': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Belum_Tuntas'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPeriodeBadge = (periode: string) => {
    const periodeConfig = {
      'Bulanan': { color: 'bg-blue-100 text-blue-800' },
      '3_Bulanan': { color: 'bg-purple-100 text-purple-800' },
      'Semesteran': { color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = periodeConfig[periode as keyof typeof periodeConfig] || periodeConfig['Bulanan'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {periode.replace('_', ' ')}
      </span>
    );
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Link
                href="/keagamaan/hafalan"
                className="text-gray-500 hover:text-gray-700 mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="mr-3 text-purple-600" />
                Evaluasi Hafalan
              </h1>
            </div>
            <p className="text-gray-600">
              Evaluasi dan penilaian progress hafalan siswa
            </p>
          </div>
          <Link
            href="/keagamaan/hafalan/evaluasi/tambah"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Evaluasi
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistik && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Evaluasi</p>
                <p className="text-2xl font-bold text-gray-900">{statistik.total_evaluasi}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tuntas</p>
                <p className="text-2xl font-bold text-green-600">{statistik.tuntas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Belum Tuntas</p>
                <p className="text-2xl font-bold text-red-600">{statistik.belum_tuntas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                <p className="text-2xl font-bold text-purple-600">{statistik.persentase_keseluruhan}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari siswa, NIS, atau periode..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Tuntas">Tuntas</option>
            <option value="Belum_Tuntas">Belum Tuntas</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={periodeFilter}
            onChange={(e) => setPeriodeFilter(e.target.value)}
          >
            <option value="">Semua Periode</option>
            <option value="Bulanan">Bulanan</option>
            <option value="3_Bulanan">3 Bulanan</option>
            <option value="Semesteran">Semesteran</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={tahunAjaranFilter}
            onChange={(e) => setTahunAjaranFilter(e.target.value)}
          >
            <option value="">Semua Tahun Ajaran</option>
            {tahunAjaran.map((ta) => (
              <option key={ta.id_tahun_ajaran} value={ta.id_tahun_ajaran}>
                {ta.tahun_ajaran}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setPeriodeFilter('');
              setTahunAjaranFilter('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target vs Tercapai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persentase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun Ajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvaluasiHafalan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Tidak ada data evaluasi hafalan</p>
                    <p className="text-sm">Mulai dengan menambahkan evaluasi hafalan baru</p>
                  </td>
                </tr>
              ) : (
                filteredEvaluasiHafalan.map((item) => (
                  <tr key={item.id_evaluasi} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.nama_siswa || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          NIS: {item.nis} • {item.nama_kelas || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {getPeriodeBadge(item.periode_evaluasi)}
                        {item.bulan_periode && (
                          <div className="text-sm text-gray-500 mt-1">
                            {item.bulan_periode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.total_baris_tercapai} / {item.total_baris_target} baris
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${item.persentase_ketercapaian}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPercentageColor(item.persentase_ketercapaian || 0)}`}>
                        {item.persentase_ketercapaian}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status_ketuntasan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tahun_ajaran || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/keagamaan/hafalan/evaluasi/${item.id_evaluasi}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/keagamaan/hafalan/evaluasi/${item.id_evaluasi}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedEvaluasi(item);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedEvaluasi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus evaluasi hafalan untuk siswa{' '}
              <span className="font-medium">{selectedEvaluasi.nama_siswa}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEvaluasi(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}