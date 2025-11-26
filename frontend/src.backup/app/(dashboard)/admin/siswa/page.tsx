'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  QrCode
} from 'lucide-react';
import { api } from '@/lib/api';
import ImportModal from '@/components/forms/ImportModal';
import { useAuth } from '@/hooks/useAuth';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

interface Siswa {
  nis: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  nama_kelas?: string;
  nama_jurusan?: string;
  status: 'Aktif' | 'Non-aktif' | 'Lulus';
  nama_ayah?: string;
  nama_ibu?: string;
  no_hp?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: Siswa[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function DataSiswaPage() {
  // Route protection - redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'manajemen_data.data_siswa',
    redirectTo: '/dashboard'
  });

  const { user } = useAuth();
  
  // Get permissions from centralized system
  const { canCreate, canEdit, canDelete } = usePermission('manajemen_data.data_siswa');

  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [perPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [kelasOptions, setKelasOptions] = useState([]);
  const [jurusanOptions, setJurusanOptions] = useState([]);
  
  // Multiple select states
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bulkBarcodeLoading, setBulkBarcodeLoading] = useState(false);

  // Fetch data siswa
  const fetchSiswa = async (page = 1, searchTerm = '', kelasId = '', jurusanId = '') => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>('/v1/siswa', {
        params: {
          page,
          per_page: perPage,
          search: searchTerm,
          kelas: kelasId || undefined,
          jurusan: jurusanId || undefined
        }
      });

      if (response.data.success) {
        setSiswa(response.data.data.data);
        setCurrentPage(response.data.data.current_page);
        setTotalPages(response.data.data.last_page);
        setTotalData(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dropdown options
  const fetchDropdownOptions = async () => {
    try {
      const kelasResponse = await api.get('/v1/kelas?per_page=100');
      if (kelasResponse.data.success) {
        setKelasOptions(kelasResponse.data.data);
      }

      const jurusanResponse = await api.get('/v1/jurusan');
      if (jurusanResponse.data.success) {
        setJurusanOptions(jurusanResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  useEffect(() => {
    fetchSiswa(currentPage, search, kelasFilter, jurusanFilter);
    fetchDropdownOptions();
  }, [currentPage, kelasFilter, jurusanFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSiswa(1, search, kelasFilter, jurusanFilter);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Handle single delete
  const handleDelete = async (nis: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

    try {
      const response = await api.delete(`/v1/siswa/${nis}`);
      if (response.data.success) {
        alert('Data siswa berhasil dihapus');
        fetchSiswa(currentPage, search, kelasFilter, jurusanFilter);
        setSelectedStudents(prev => prev.filter(id => id !== nis));
      }
    } catch (error) {
      alert('Error menghapus data siswa');
      console.error('Error deleting siswa:', error);
    }
  };

  // Handle multiple delete
  const handleMultipleDelete = async () => {
    if (selectedStudents.length === 0) {
      alert('Pilih siswa yang ingin dihapus terlebih dahulu');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedStudents.length} data siswa yang dipilih?`)) return;

    try {
      const response = await api.post('/v1/siswa/bulk-delete', {
        nis_list: selectedStudents
      });
      
      if (response.data.success) {
        alert(`${selectedStudents.length} data siswa berhasil dihapus`);
        setSelectedStudents([]);
        setSelectAll(false);
        setShowDeleteModal(false);
        fetchSiswa(currentPage, search, kelasFilter, jurusanFilter);
      }
    } catch (error) {
      alert('Error menghapus data siswa');
      console.error('Error bulk deleting siswa:', error);
    }
  };

  // Handle bulk generate barcode
  const handleBulkGenerateBarcode = async () => {
    if (!confirm('Generate barcode untuk semua siswa aktif yang belum memiliki barcode?')) return;

    setBulkBarcodeLoading(true);
    try {
      const response = await api.post('/v1/siswa/bulk-generate-barcodes');
      if (response.data.success) {
        alert(`Berhasil generate ${response.data.generated_count} barcode untuk siswa`);
        fetchSiswa(currentPage, search, kelasFilter, jurusanFilter);
      }
    } catch (error) {
      alert('Error generating barcodes');
      console.error('Error bulk generating barcodes:', error);
    } finally {
      setBulkBarcodeLoading(false);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedStudents(siswa.map(item => item.nis));
    } else {
      setSelectedStudents([]);
    }
  };

  // Handle individual select
  const handleSelectStudent = (nis: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, nis]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== nis));
      setSelectAll(false);
    }
  };

  useEffect(() => {
    if (selectedStudents.length === siswa.length && siswa.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, siswa]);

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } border border-gray-300`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  // Show loading while checking permission
  if (permLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authorized, return null (will redirect)
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-black p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
            <p className="text-gray-600 mt-1">
              Kelola data siswa SMA Islam Al-Azhar 7 Sukoharjo
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            {canCreate && (
              <>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Upload size={20} className="mr-2" />
                  Import Excel
                </button>
                <Link 
                  href="/admin/siswa/tambah"
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} className="mr-2" />
                  Tambah Siswa
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-black p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau NIS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={kelasFilter}
                onChange={(e) => {
                  setKelasFilter(e.target.value);
                  handleFilterChange();
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions && kelasOptions.map((kelas: any) => (
                  <option key={kelas.id_kelas} value={kelas.id_kelas}>
                    {kelas.nama_kelas}
                  </option>
                ))}
              </select>
              <select
                value={jurusanFilter}
                onChange={(e) => {
                  setJurusanFilter(e.target.value);
                  handleFilterChange();
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Semua Jurusan</option>
                {jurusanOptions && jurusanOptions.map((jurusan: any) => (
                  <option key={jurusan.id_jurusan} value={jurusan.id_jurusan}>
                    {jurusan.nama_jurusan}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search size={20} className="sm:mr-2" />
                <span className="ml-2 sm:inline">Cari</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setKelasFilter('');
                  setJurusanFilter('');
                  setCurrentPage(1);
                  fetchSiswa(1, '', '', '');
                }}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download size={20} className="sm:mr-2" />
                <span className="ml-2 sm:inline">Export</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-black overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Siswa ({totalData} data)
            </h2>
            {selectedStudents.length > 0 && canDelete && (
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkGenerateBarcode}
                  disabled={bulkBarcodeLoading}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <QrCode size={16} className="mr-2" />
                  {bulkBarcodeLoading ? 'Generating...' : 'Generate Barcode'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 size={16} className="mr-2" />
                  Hapus ({selectedStudents.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {canDelete && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jurusan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JK
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
                  {siswa.length > 0 ? (
                    siswa.map((item) => (
                      <tr key={item.nis} className="hover:bg-gray-50">
                        {canDelete && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(item.nis)}
                              onChange={(e) => handleSelectStudent(item.nis, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.nis}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.nama_lengkap}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.nama_ayah && `Ayah: ${item.nama_ayah}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nama_kelas || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nama_jurusan || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'Aktif' 
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'Lulus'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/siswa/${item.nis}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Lihat Detail"
                            >
                              <Eye size={16} />
                            </Link>
                            {canEdit && (
                              <Link
                                href={`/admin/siswa/${item.nis}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Link>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(item.nis)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canDelete ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                        {search ? 'Tidak ada data yang ditemukan' : 'Belum ada data siswa'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan {((currentPage - 1) * perPage) + 1} sampai {Math.min(currentPage * perPage, totalData)} dari {totalData} data
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {renderPagination()}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Multiple Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Hapus Data Siswa</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus {selectedStudents.length} data siswa yang dipilih? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleMultipleDelete}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Ya, Hapus Semua
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 px-4 py-2 bg-white text-gray-500 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {canCreate && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchSiswa(currentPage, search);
          }}
          title="Import Data Siswa"
          endpoint="/v1/siswa/import"
          templateEndpoint="/v1/siswa/template"
        />
      )}
    </div>
  );
}