'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Target, 
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
  ArrowLeft
} from 'lucide-react';

interface TargetHafalanSiswa {
  id_target_hafalan: number;
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  target_baris_perpertemuan: string;
  status: 'Aktif' | 'Non-aktif';
  id_tahun_ajaran: number;
  tahun_ajaran?: string;
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

export default function TargetHafalanPage() {
  const [targetHafalan, setTargetHafalan] = useState<TargetHafalanSiswa[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetHafalanSiswa | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [targetResponse, formDataResponse] = await Promise.all([
        api.get('/target-hafalan-siswa'),
        api.get('/target-hafalan-siswa-form-data')
      ]);

      if (targetResponse.data.success) {
        setTargetHafalan(targetResponse.data.data.data || []);
      }

      if (formDataResponse.data.success) {
        setTahunAjaran(formDataResponse.data.data.tahun_ajaran || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTarget) return;

    try {
      const response = await api.delete(`/target-hafalan-siswa/${selectedTarget.id_target_hafalan}`);
      if (response.data.success) {
        await fetchData();
        setShowDeleteModal(false);
        setSelectedTarget(null);
      }
    } catch (error) {
      console.error('Error deleting target hafalan:', error);
    }
  };

  const filteredTargetHafalan = targetHafalan.filter(item => {
    const matchesSearch = 
      item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesTahunAjaran = !tahunAjaranFilter || item.id_tahun_ajaran.toString() === tahunAjaranFilter;
    
    return matchesSearch && matchesStatus && matchesTahunAjaran;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aktif': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Non-aktif': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Aktif'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
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
                <Target className="mr-3 text-green-600" />
                Target Hafalan Siswa
              </h1>
            </div>
            <p className="text-gray-600">
              Kelola target hafalan untuk setiap siswa
            </p>
          </div>
          <Link
            href="/keagamaan/hafalan/target/tambah"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Target
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari siswa, NIS, atau surah..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
            <option value="Tertunda">Tertunda</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  Target Baris Per Pertemuan
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
              {filteredTargetHafalan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Tidak ada data target hafalan</p>
                    <p className="text-sm">Mulai dengan menambahkan target hafalan baru</p>
                  </td>
                </tr>
              ) : (
                filteredTargetHafalan.map((item) => (
                  <tr key={item.id_target_hafalan} className="hover:bg-gray-50">
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
                      <div className="text-sm font-medium text-gray-900">
                        {item.target_baris_perpertemuan} baris per pertemuan
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tahun_ajaran || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/keagamaan/hafalan/target/${item.id_target_hafalan}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/keagamaan/hafalan/target/${item.id_target_hafalan}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedTarget(item);
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
      {showDeleteModal && selectedTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus target hafalan untuk siswa{' '}
              <span className="font-medium">{selectedTarget.nama_siswa}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTarget(null);
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