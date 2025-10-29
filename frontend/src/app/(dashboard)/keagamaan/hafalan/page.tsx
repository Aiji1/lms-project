'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BarChart3
} from 'lucide-react';

interface Hafalan {
  id_hafalan: number;
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  surah_mulai: string;
  ayat_mulai: number;
  surah_selesai: string;
  ayat_selesai: number;
  total_baris: number;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_hafalan: 'Proses' | 'Selesai' | 'Tertunda';
  catatan?: string;
  id_tahun_ajaran: number;
  tahun_ajaran?: string;
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

export default function HafalanPage() {
  const [hafalan, setHafalan] = useState<Hafalan[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHafalan, setSelectedHafalan] = useState<Hafalan | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hafalanResponse, formDataResponse] = await Promise.all([
        api.get('/hafalan'),
        api.get('/hafalan-form-data')
      ]);

      if (hafalanResponse.data.success) {
        setHafalan(hafalanResponse.data.data.data || []);
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
    if (!selectedHafalan) return;

    try {
      const response = await api.delete(`/hafalan/${selectedHafalan.id_hafalan}`);
      if (response.data.success) {
        await fetchData();
        setShowDeleteModal(false);
        setSelectedHafalan(null);
      }
    } catch (error) {
      console.error('Error deleting hafalan:', error);
    }
  };

  const filteredHafalan = hafalan.filter(item => {
    const matchesSearch = 
      item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.surah_mulai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.surah_selesai.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status_hafalan === statusFilter;
    const matchesTahunAjaran = !tahunAjaranFilter || item.id_tahun_ajaran.toString() === tahunAjaranFilter;
    
    return matchesSearch && matchesStatus && matchesTahunAjaran;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Proses': { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      'Selesai': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Tertunda': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Proses'];
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-3 text-blue-600" />
              Manajemen Hafalan
            </h1>
            <p className="text-gray-600 mt-2">
              Kelola data hafalan Al-Qur'an siswa
            </p>
          </div>
          <Link
            href="/keagamaan/hafalan/tambah"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Hafalan
          </Link>
        </div>
      </div>

      {/* Sub Menu Navigation */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Hafalan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/keagamaan/hafalan"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-blue-900">Data Hafalan</h3>
                <p className="text-sm text-blue-700">Kelola progress hafalan siswa</p>
              </div>
            </Link>
            
            <Link
              href="/keagamaan/hafalan/target"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Target className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-green-900">Target Hafalan</h3>
                <p className="text-sm text-green-700">Atur target hafalan siswa</p>
              </div>
            </Link>
            
            <Link
              href="/keagamaan/hafalan/evaluasi"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <BarChart3 className="w-6 h-6 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-purple-900">Evaluasi Hafalan</h3>
                <p className="text-sm text-purple-700">Evaluasi dan penilaian hafalan</p>
              </div>
            </Link>
          </div>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Tertunda">Tertunda</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  Hafalan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periode
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
              {filteredHafalan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Tidak ada data hafalan</p>
                    <p className="text-sm">Mulai dengan menambahkan data hafalan baru</p>
                  </td>
                </tr>
              ) : (
                filteredHafalan.map((item) => (
                  <tr key={item.id_hafalan} className="hover:bg-gray-50">
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
                        <div className="text-sm font-medium text-gray-900">
                          {item.surah_mulai}:{item.ayat_mulai} - {item.surah_selesai}:{item.ayat_selesai}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.total_baris} baris
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(item.tanggal_mulai).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-500">
                        s/d {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status_hafalan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tahun_ajaran || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/keagamaan/hafalan/${item.id_hafalan}`}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/keagamaan/hafalan/${item.id_hafalan}/edit`}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedHafalan(item);
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
      {showDeleteModal && selectedHafalan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus data hafalan untuk siswa{' '}
              <span className="font-medium">{selectedHafalan.nama_siswa}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedHafalan(null);
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