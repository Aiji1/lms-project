'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { createPermissionForRoles, getUserPermission, mergePermissions } from '@/lib/permissions';
import { fetchMergedOverrides, mergeItemPermissions } from '@/lib/permissionOverrides';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';
import { useAuth } from '@/hooks/useAuth';

// Base permission configuration (before overrides)
const baseTugasPermissions = mergePermissions(
  createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
  createPermissionForRoles(['Siswa', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS),
  createPermissionForRoles(['Petugas_Keuangan', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
);

interface Tugas {
  id_tugas: number;
  id_mata_pelajaran: number;
  nama_mata_pelajaran?: string; // Keep for backward compatibility
  id_kelas: number;
  nama_kelas?: string; // Keep for backward compatibility
  judul_tugas: string;
  deskripsi_tugas: string;
  tanggal_pemberian: string;
  tanggal_deadline: string;
  tipe_tugas: 'Semua_Siswa' | 'Siswa_Terpilih';
  status: 'Aktif' | 'Non-aktif';
  file_tugas?: string;
  bobot_nilai?: number;
  keterangan?: string;
  total_siswa?: number;
  sudah_mengumpulkan?: number;
  belum_mengumpulkan?: number;
  // API response structure
  mata_pelajaran?: {
    id_mata_pelajaran: number;
    nama_mata_pelajaran: string;
    kode_mata_pelajaran: string;
    kategori: string;
    status: string;
  };
  kelas?: {
    id_kelas: number;
    ruangan: string;
    nama_kelas: string;
    tingkat: string;
    id_jurusan: number;
    id_tahun_ajaran: number;
    kapasitas_maksimal: number;
    wali_kelas: string;
  };
  guru?: {
    nik_guru: string;
    nama_lengkap: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    alamat?: string;
    no_telepon: string;
    status_kepegawaian: string;
    jabatan: string;
    status: string;
  };
  // Relation for siswa progress (constrained to current siswa in backend)
  tugasSiswa?: Array<{ status_pengumpulan: 'Belum' | 'Sudah' | 'Terlambat' }>;
}

interface FormData {
  id_kelas: string;
  status: string;
  tipe_tugas: string;
}

interface TahunAjaran {
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  semester: string;
  status: string;
}

export default function TugasPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ user_type?: string; role?: string; nik?: string } | null>(null);
  const [userPermissions, setUserPermissions] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false
  });
  const [effectivePermissions, setEffectivePermissions] = useState(baseTugasPermissions);
  const searchParams = useSearchParams();
  const { isStudent, userRole } = useAuth();

  // Data state
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [filteredTugas, setFilteredTugas] = useState<Tugas[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);

  // Filter options
  const [kelasOptions, setKelasOptions] = useState<Array<{id_kelas: number, nama_kelas: string}>>([]);
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaran[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState<FormData>({
    id_kelas: '',
    status: '',
    tipe_tugas: ''
  });
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Fetch overrides and set effective permissions
  useEffect(() => {
    const initPermissions = async () => {
      if (!userRole) return;
      try {
        const userData = localStorage.getItem('user');
        let userId: string | undefined = undefined;
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            userId = parsed?.id || parsed?.user_id || undefined;
          } catch {}
        }
        const overrides = await fetchMergedOverrides({ role: userRole, user_id: userId });
        const merged = mergeItemPermissions(baseTugasPermissions, overrides, 'pembelajaran.tugas');
        setEffectivePermissions(merged);
        const permissions = getUserPermission(userRole as any, merged);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });
      } catch (e) {
        console.error('Error loading overrides for Tugas:', e);
        const permissions = getUserPermission(userRole as any, baseTugasPermissions);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });
      }
    };
    initPermissions();
  }, [userRole]);

  // Sync query param ?search to local searchTerm for deep links
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    if (userRole && userPermissions.view) {
      fetchTugas();
      fetchFormData();
      fetchTahunAjaran();
    }
  }, [userRole, userPermissions]);

  useEffect(() => {
    filterTugas();
  }, [tugas, searchTerm, filters]);

  useEffect(() => {
    // refetch tugas ketika filter tahun ajaran berubah
    if (userPermissions.view) {
      fetchTugas();
    }
  }, [tahunAjaranFilter]);

  const fetchTugas = async () => {
    try {
      setLoading(true);
      const mp = searchParams.get('mata_pelajaran');
      const response = await api.get('/tugas', {
        params: {
          mata_pelajaran: mp || undefined,
          id_tahun_ajaran: tahunAjaranFilter || undefined,
        }
      });
      // Extract array from Laravel paginator structure
      const list = Array.isArray(response?.data?.data?.data)
        ? response.data.data.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
      setTugas(list);
    } catch (error) {
      console.error('Error fetching tugas:', error);
      setTugas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const response = await api.get('/tugas-form-data');
      setKelasOptions(response.data.data.kelas || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const fetchTahunAjaran = async () => {
    try {
      const response = await api.get('/tahun-ajaran');
      if (response.data.success) {
        const list: TahunAjaran[] = response.data.data || [];
        setTahunAjaranOptions(list);
        // jika ada yang aktif, jadikan default filter kosong (lihat semua untuk Admin),
        // pengguna non-admin sudah difilter di backend.
      }
    } catch (error) {
      console.error('Error fetching tahun ajaran:', error);
    }
  };

  const filterTugas = () => {
    if (!Array.isArray(tugas)) {
      setFilteredTugas([]);
      return;
    }
    
    let filtered = tugas.filter(item => {
      const matchesSearch = 
        item.judul_tugas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mata_pelajaran?.nama_mata_pelajaran?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kelas?.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesKelas = !filters.id_kelas || item.id_kelas?.toString() === filters.id_kelas;
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesTipe = !filters.tipe_tugas || item.tipe_tugas === filters.tipe_tugas;

      return matchesSearch && matchesKelas && matchesStatus && matchesTipe;
    });

    setFilteredTugas(filtered);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedTugas) return;

    try {
      await api.delete(`/v1/tugas/${selectedTugas.id_tugas}`);
      await fetchTugas();
      setShowDeleteModal(false);
      setSelectedTugas(null);
    } catch (error) {
      console.error('Error deleting tugas:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aktif': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Non-aktif': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getTipeBadge = (tipe: string) => {
    const tipeConfig = {
      'Semua_Siswa': { color: 'bg-blue-100 text-blue-800', text: 'Semua Siswa' },
      'Siswa_Terpilih': { color: 'bg-purple-100 text-purple-800', text: 'Siswa Terpilih' }
    };

    const config = tipeConfig[tipe as keyof typeof tipeConfig];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Users className="h-3 w-3 mr-1" />
        {config?.text || tipe}
      </span>
    );
  };

  // Group tugas per mata pelajaran for siswa cards
  const isSiswa = isStudent();
  const subjectCards = useMemo(() => {
    if (!isSiswa || !Array.isArray(tugas)) return [] as Array<{
      id_mata_pelajaran: number;
      nama_mata_pelajaran: string;
      guru_nama: string;
      total_tugas: number;
      tugas_baru: number;
    }>;

    const map = new Map<number, { id: number; nama: string; gurus: Set<string>; total: number; baru: number }>();
    tugas.forEach((t) => {
      const id = t.mata_pelajaran?.id_mata_pelajaran || t.id_mata_pelajaran;
      const nama = t.mata_pelajaran?.nama_mata_pelajaran || t.nama_mata_pelajaran || 'Tidak diketahui';
      if (!id) return;
      const guruNama = t.guru?.nama_lengkap || '-';
      const isAktif = t.status === 'Aktif';
      const belum = (t.tugasSiswa && t.tugasSiswa[0]?.status_pengumpulan === 'Belum');

      if (!map.has(id)) {
        map.set(id, { id, nama, gurus: new Set(guruNama !== '-' ? [guruNama] : []), total: 1, baru: isAktif && belum ? 1 : 0 });
      } else {
        const cur = map.get(id)!;
        cur.total += 1;
        if (isAktif && belum) cur.baru += 1;
        if (guruNama !== '-') cur.gurus.add(guruNama);
        map.set(id, cur);
      }
    });

    return Array.from(map.values()).map((v) => ({
      id_mata_pelajaran: v.id,
      nama_mata_pelajaran: v.nama,
      guru_nama: v.gurus.size === 0 ? '-' : v.gurus.size === 1 ? Array.from(v.gurus)[0] : `${Array.from(v.gurus)[0]} dan lainnya`,
      total_tugas: v.total,
      tugas_baru: v.baru,
    }));
  }, [isSiswa, tugas]);

  // Selected subject for student view
  const selectedMapel = searchParams.get('mata_pelajaran');

  // Pagination logic
  const totalPages = Math.ceil(filteredTugas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTugas = filteredTugas.slice(startIndex, endIndex);

  if (!userPermissions.view) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-blue-600" />
            {isSiswa ? 'Menu Tugas' : 'Manajemen Tugas'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isSiswa ? 'Akses tugas per mata pelajaran' : 'Kelola tugas dan pekerjaan rumah siswa'}
          </p>
        </div>
        {userPermissions.create && (
          <Link
            href="/pembelajaran/tugas/tambah"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Tugas
          </Link>
        )}
      </div>

      {/* Student cards vs teacher/admin filters */}
      {isSiswa ? (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : subjectCards.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada tugas</h3>
              <p className="text-gray-600">Belum ada tugas yang ditugaskan kepada Anda.</p>
            </div>
          ) : !selectedMapel ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectCards.map((card) => (
                <Link
                  key={card.id_mata_pelajaran}
                  href={`/pembelajaran/tugas?mata_pelajaran=${card.id_mata_pelajaran}`}
                  className="relative block bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                >
                  {card.tugas_baru > 0 && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-bold text-white bg-red-600 rounded-full border border-white shadow">
                      {card.tugas_baru}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{card.nama_mata_pelajaran}</h3>
                      <div className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Guru: {card.guru_nama}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Total tugas: {card.total_tugas}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Daftar Tugas</h2>
                <Link href="/pembelajaran/tugas" className="text-blue-600 hover:underline">Kembali ke semua mata pelajaran</Link>
              </div>
              {tugas.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada tugas</h3>
                  <p className="text-gray-600">Belum ada tugas untuk mata pelajaran ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tugas.map((item) => (
                    <div key={item.id_tugas} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-base font-medium text-gray-900">{item.judul_tugas}</div>
                          <div className="text-sm text-gray-600 mt-1">{item.deskripsi_tugas}</div>
                          <div className="mt-2 text-sm text-gray-700 flex items-center gap-4">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gray-400" /> Diberikan: {formatDate(item.tanggal_pemberian)}</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-red-400" /> Deadline: {formatDate(item.tanggal_deadline)}</span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="inline-block">{getStatusBadge(item.status)}</div>
                          <Link href={`/pembelajaran/tugas/${item.id_tugas}`} className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm">
                            Buka Tugas
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Cari tugas, mata pelajaran, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tahun Ajaran (Admin dapat melihat semua, filter opsional) */}
            <select
              value={tahunAjaranFilter}
              onChange={(e) => setTahunAjaranFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Tahun Ajaran</option>
              {tahunAjaranOptions.map(t => (
                <option key={t.id_tahun_ajaran} value={t.id_tahun_ajaran}>
                  {t.tahun_ajaran} - {t.semester}
                </option>
              ))}
            </select>

            {/* Filter Kelas */}
            <select
              value={filters.id_kelas}
              onChange={(e) => setFilters(prev => ({ ...prev, id_kelas: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map(kelas => (
                <option key={kelas.id_kelas} value={kelas.id_kelas}>
                  {kelas.nama_kelas}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Non-aktif">Non-aktif</option>
            </select>

            {/* Filter Tipe */}
            <select
              value={filters.tipe_tugas}
              onChange={(e) => setFilters(prev => ({ ...prev, tipe_tugas: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Tipe</option>
              <option value="Semua_Siswa">Semua Siswa</option>
              <option value="Siswa_Terpilih">Siswa Terpilih</option>
            </select>
          </div>
        </div>
      )}

      {/* Table (only for non-student) */}
      {!isSiswa && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Memuat data...</span>
          </div>
        ) : currentTugas.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada tugas</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Tidak ada tugas yang sesuai dengan filter yang dipilih.' 
                : 'Belum ada tugas yang dibuat.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tugas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTugas.map((item) => (
                    <tr key={item.id_tugas} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.judul_tugas}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.deskripsi_tugas}
                          </div>
                          {item.bobot_nilai && (
                            <div className="text-xs text-blue-600 mt-1">
                              Bobot: {item.bobot_nilai}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                        {item.mata_pelajaran?.nama_mata_pelajaran || item.nama_mata_pelajaran || 'N/A'}
                      </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                        {item.kelas?.nama_kelas || item.nama_kelas || 'N/A'}
                      </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span>Diberikan: {formatDate(item.tanggal_pemberian)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-red-400 mr-2" />
                            <span>Deadline: {formatDate(item.tanggal_deadline)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {getStatusBadge(item.status)}
                          {getTipeBadge(item.tipe_tugas)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            Total: {item.total_siswa || 0} siswa
                          </div>
                          <div className="text-green-600">
                            Selesai: {item.sudah_mengumpulkan || 0}
                          </div>
                          <div className="text-red-600">
                            Belum: {item.belum_mengumpulkan || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/pembelajaran/tugas/${item.id_tugas}`}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {userPermissions.edit && (
                            <Link
                              href={`/pembelajaran/tugas/${item.id_tugas}/edit`}
                              className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          )}
                          {userPermissions.delete && (
                            <button
                              onClick={() => {
                                setSelectedTugas(item);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                      <span className="font-medium">{Math.min(endIndex, filteredTugas.length)}</span> of{' '}
                      <span className="font-medium">{filteredTugas.length}</span> results
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
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
          </>
        )}
      </div>
      )}

      {/* Delete Modal */}
      {!isSiswa && showDeleteModal && selectedTugas && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Hapus Tugas</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus tugas "{selectedTugas.judul_tugas}"? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTugas(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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