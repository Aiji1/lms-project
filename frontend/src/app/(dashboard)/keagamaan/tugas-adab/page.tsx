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
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface TugasAdab {
  id_tugas_adab: number;
  nama_tugas: string;
  deskripsi_tugas: string;
  id_tahun_ajaran: number;
  tahun_ajaran?: string;
  status: 'Aktif' | 'Non-aktif';
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

export default function TugasAdabPage() {
  const [tugasAdab, setTugasAdab] = useState<TugasAdab[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<TugasAdab | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tugas adab
      const tugasResponse = await api.get('/v1/tugas-adab');
      if (tugasResponse.data.success) {
        setTugasAdab(tugasResponse.data.data || []);
      }

      // Fetch tahun ajaran
      const tahunResponse = await api.get('/v1/tahun-ajaran');
      if (tahunResponse.data.success) {
        setTahunAjaran(tahunResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic will be implemented with API
  };

  const handleDelete = (tugas: TugasAdab) => {
    setSelectedTugas(tugas);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTugas) return;

    try {
      const response = await api.delete(`/v1/tugas-adab/${selectedTugas.id_tugas_adab}`);

      if (response.data.success) {
        setTugasAdab(tugasAdab.filter(item => item.id_tugas_adab !== selectedTugas.id_tugas_adab));
        setShowDeleteModal(false);
        setSelectedTugas(null);
      } else {
        alert('Gagal menghapus tugas adab');
      }
    } catch (error) {
      console.error('Error deleting tugas adab:', error);
      alert('Terjadi kesalahan saat menghapus tugas adab');
    }
  };

  const filteredTugasAdab = tugasAdab.filter(item => {
    const matchesSearch = item.nama_tugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deskripsi_tugas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesTahunAjaran = !tahunAjaranFilter || item.id_tahun_ajaran.toString() === tahunAjaranFilter;
    
    return matchesSearch && matchesStatus && matchesTahunAjaran;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Aktif') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aktif
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Non-aktif
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-600" />
              Tugas Adab
            </h1>
            <p className="text-gray-600 mt-1">Kelola tugas adab harian siswa</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/keagamaan/tugas-adab/tambah"
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Tambah Tugas Adab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama tugas atau deskripsi..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-aktif">Non-aktif</option>
              </select>
              <select
                value={tahunAjaranFilter}
                onChange={(e) => setTahunAjaranFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Tahun Ajaran</option>
                {tahunAjaran.map((tahun) => (
                  <option key={tahun.id_tahun_ajaran} value={tahun.id_tahun_ajaran}>
                    {tahun.tahun_ajaran} - {tahun.semester}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Tugas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tahun Ajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTugasAdab.length > 0 ? (
                filteredTugasAdab.map((item, index) => (
                  <tr key={item.id_tugas_adab} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{item.nama_tugas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.deskripsi_tugas}>
                        {item.deskripsi_tugas}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.tahun_ajaran || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/keagamaan/tugas-adab/${item.id_tugas_adab}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/keagamaan/tugas-adab/${item.id_tugas_adab}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || tahunAjaranFilter ? 'Tidak ada data yang ditemukan' : 'Belum ada data tugas adab'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedTugas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Konfirmasi Hapus</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus tugas adab "{selectedTugas.nama_tugas}"? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}