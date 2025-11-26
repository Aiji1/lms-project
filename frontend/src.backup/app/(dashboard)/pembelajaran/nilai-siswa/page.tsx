'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  GraduationCap,
  BookOpen,
  Users,
  Calendar,
  Award,
  TrendingUp,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';
import ImportModal from '@/components/forms/ImportModal';

interface NilaiSiswa {
  id_nilai: number;
  nis: string;
  nama_siswa: string;
  kelas: string;
  mata_pelajaran: string;
  jenis_penilaian: 'PH1' | 'PH2' | 'PH3' | 'ASTS1' | 'ASAS' | 'ASTS2' | 'ASAT' | 'Tugas' | 'Praktek';
  nilai: number;
  status: 'Draft' | 'Final';
  tanggal_input: string;
  nama_guru: string;
  keterangan?: string;
  tahun_ajaran: string;
  semester: string;
}

interface FilterOptions {
  mata_pelajaran: Array<{ id: number; nama: string }>;
  kelas: Array<{ id: number; nama: string }>;
  tahun_ajaran: Array<{ id: number; nama: string }>;
}

interface NilaiStats {
  total_nilai: number;
  nilai_draft: number;
  nilai_final: number;
  rata_rata_nilai: number;
}

export default function NilaiSiswaPage() {
  const { user } = useAuth();

  // Permission configuration
  const nilaiSiswaPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Guru': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Siswa': READ_ONLY_PERMISSIONS,
    'Petugas_Keuangan': READ_ONLY_PERMISSIONS,
    'Orang_Tua': READ_ONLY_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as any || 'Siswa', nilaiSiswaPermissions);

  const [nilaiSiswa, setNilaiSiswa] = useState<NilaiSiswa[]>([]);
  const [filteredNilai, setFilteredNilai] = useState<NilaiSiswa[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    mata_pelajaran: [],
    kelas: [],
    tahun_ajaran: []
  });
  const [stats, setStats] = useState<NilaiStats>({
    total_nilai: 0,
    nilai_draft: 0,
    nilai_final: 0,
    rata_rata_nilai: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedJenisPenilaian, setSelectedJenisPenilaian] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<NilaiSiswa | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterNilai();
  }, [nilaiSiswa, searchTerm, selectedMataPelajaran, selectedKelas, selectedJenisPenilaian, selectedStatus]);

  const fetchData = async () => {
    try {
      const [nilaiResponse, filterResponse] = await Promise.all([
        api.get('/v1/nilai'),
        api.get('/v1/nilai-siswa/filter-options')
      ]);

      if (nilaiResponse.data.success) {
        // Ensure data is always an array
        const nilaiData = Array.isArray(nilaiResponse.data.data.data) ? nilaiResponse.data.data.data : [];
        setNilaiSiswa(nilaiData);
        calculateStats(nilaiData);
      }

      if (filterResponse.data.success) {
        // Ensure filterOptions has proper structure with arrays
        const filterData = filterResponse.data.data || {};
        setFilterOptions({
          mata_pelajaran: Array.isArray(filterData.mata_pelajaran) ? filterData.mata_pelajaran : [],
          kelas: Array.isArray(filterData.kelas) ? filterData.kelas : [],
          tahun_ajaran: Array.isArray(filterData.tahun_ajaran) ? filterData.tahun_ajaran : []
        });
      }
    } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error
        setNilaiSiswa([]);
        setFilteredNilai([]);
        setFilterOptions({
          mata_pelajaran: [],
          kelas: [],
          tahun_ajaran: []
        });
      } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: NilaiSiswa[]) => {
    // Ensure data is an array
    const validData = Array.isArray(data) ? data : [];
    
    const totalNilai = validData.length;
    const nilaiDraft = validData.filter(n => n.status === 'Draft').length;
    const nilaiFinal = validData.filter(n => n.status === 'Final').length;
    const rataRataNilai = validData.length > 0 ? 
      validData.reduce((sum, n) => sum + n.nilai, 0) / validData.length : 0;

    setStats({
      total_nilai: totalNilai,
      nilai_draft: nilaiDraft,
      nilai_final: nilaiFinal,
      rata_rata_nilai: Math.round(rataRataNilai * 100) / 100
    });
  };

  const filterNilai = () => {
    // Ensure nilaiSiswa is always an array
    let filtered = Array.isArray(nilaiSiswa) ? nilaiSiswa : [];

    if (searchTerm) {
      filtered = filtered.filter(nilai =>
        nilai.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nilai.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nilai.mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMataPelajaran) {
      filtered = filtered.filter(nilai => nilai.mata_pelajaran === selectedMataPelajaran);
    }

    if (selectedKelas) {
      filtered = filtered.filter(nilai => nilai.kelas === selectedKelas);
    }

    if (selectedJenisPenilaian) {
      filtered = filtered.filter(nilai => nilai.jenis_penilaian === selectedJenisPenilaian);
    }

    if (selectedStatus) {
      filtered = filtered.filter(nilai => nilai.status === selectedStatus);
    }

    setFilteredNilai(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedNilai) return;

    try {
      const response = await api.delete(`/v1/nilai/${selectedNilai.id_nilai}`);
      if (response.data.success) {
        setNilaiSiswa(prev => prev.filter(n => n.id_nilai !== selectedNilai.id_nilai));
        setShowDeleteModal(false);
        setSelectedNilai(null);
      } else {
        alert('Gagal menghapus data nilai');
      }
    } catch (error) {
      console.error('Error deleting nilai:', error);
      alert('Terjadi kesalahan saat menghapus data nilai');
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        status === 'Final' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {status}
      </span>
    );
  };

  const getJenisPenilaianBadge = (jenis: string) => {
    const jenisConfig = {
      'PH1': 'bg-blue-100 text-blue-800',
      'PH2': 'bg-blue-100 text-blue-800',
      'PH3': 'bg-blue-100 text-blue-800',
      'ASTS1': 'bg-purple-100 text-purple-800',
      'ASAS': 'bg-purple-100 text-purple-800',
      'ASTS2': 'bg-purple-100 text-purple-800',
      'ASAT': 'bg-purple-100 text-purple-800',
      'Tugas': 'bg-orange-100 text-orange-800',
      'Praktek': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
        jenisConfig[jenis as keyof typeof jenisConfig] || 'bg-gray-100 text-gray-800'
      }`}>
        {jenis}
      </span>
    );
  };

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'text-green-600 font-semibold';
    if (nilai >= 70) return 'text-blue-600 font-semibold';
    if (nilai >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Pagination
  const safeFilteredNilai = Array.isArray(filteredNilai) ? filteredNilai : [];
  const totalPages = Math.ceil(safeFilteredNilai.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNilai = safeFilteredNilai.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Nilai Siswa
          </h1>
          <p className="text-gray-600">Kelola dan pantau nilai siswa</p>
        </div>
        <div className="flex gap-3">
          {userPermissions.create && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              <Link
                href="/pembelajaran/nilai-siswa/tambah"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Nilai
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Nilai</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_nilai}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nilai Draft</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.nilai_draft}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nilai Final</p>
              <p className="text-2xl font-bold text-green-600">{stats.nilai_final}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata</p>
              <p className="text-2xl font-bold text-purple-600">{stats.rata_rata_nilai}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari siswa, NIS, atau mata pelajaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={selectedMataPelajaran}
            onChange={(e) => setSelectedMataPelajaran(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Mata Pelajaran</option>
            {(filterOptions.mata_pelajaran || []).map((mp) => (
              <option key={mp.id} value={mp.nama}>{mp.nama}</option>
            ))}
          </select>

          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kelas</option>
            {(filterOptions.kelas || []).map((kelas) => (
              <option key={kelas.id} value={kelas.nama}>{kelas.nama}</option>
            ))}
          </select>

          <select
            value={selectedJenisPenilaian}
            onChange={(e) => setSelectedJenisPenilaian(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Jenis</option>
            <option value="PH1">PH1</option>
            <option value="PH2">PH2</option>
            <option value="PH3">PH3</option>
            <option value="ASTS1">ASTS1</option>
            <option value="ASAS">ASAS</option>
            <option value="ASTS2">ASTS2</option>
            <option value="ASAT">ASAT</option>
            <option value="Tugas">Tugas</option>
            <option value="Praktek">Praktek</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Final">Final</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Penilaian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Input
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentNilai.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data nilai</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || selectedMataPelajaran || selectedKelas || selectedJenisPenilaian || selectedStatus
                        ? 'Tidak ada nilai yang sesuai dengan filter yang dipilih.'
                        : 'Belum ada data nilai siswa yang tersedia.'}
                    </p>
                  </td>
                </tr>
              ) : (
                currentNilai.map((nilai) => (
                  <tr key={nilai.id_nilai} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{nilai.nama_siswa}</div>
                        <div className="text-sm text-gray-500">{nilai.nis} - {nilai.kelas}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{nilai.mata_pelajaran}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getJenisPenilaianBadge(nilai.jenis_penilaian)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${getNilaiColor(nilai.nilai)}`}>
                        {nilai.nilai}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(nilai.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(nilai.tanggal_input)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {userPermissions.view && (
                          <Link
                            href={`/pembelajaran/nilai-siswa/${nilai.id_nilai}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                        {userPermissions.edit && (
                          <Link
                            href={`/pembelajaran/nilai-siswa/${nilai.id_nilai}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        {userPermissions.delete && (
                          <button
                            onClick={() => {
                              setSelectedNilai(nilai);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredNilai.length)}</span> of{' '}
                  <span className="font-medium">{filteredNilai.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedNilai && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Hapus Data Nilai</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus nilai {selectedNilai.jenis_penilaian} 
                  untuk {selectedNilai.nama_siswa} pada mata pelajaran {selectedNilai.mata_pelajaran}?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Hapus
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedNilai(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {userPermissions.create && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchData();
          }}
          title="Import Data Nilai Siswa"
          endpoint="/v1/nilai/import"
          templateEndpoint="/v1/nilai/template"
        />
      )}
    </div>
  );
}