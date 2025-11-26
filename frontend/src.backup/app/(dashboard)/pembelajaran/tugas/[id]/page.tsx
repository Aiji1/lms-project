'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Upload,
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission, mergePermissions } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

// Permission configuration
const tugasPermissions = mergePermissions(
  createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
  createPermissionForRoles(['Siswa', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS),
  createPermissionForRoles(['Petugas_Keuangan', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
);

interface Tugas {
  id_tugas: number;
  nik_guru: string;
  nama_guru: string;
  id_kelas: number;
  nama_kelas: string;
  id_tahun_ajaran: number;
  tahun_ajaran: string;
  judul_tugas: string;
  deskripsi_tugas: string;
  tanggal_pemberian: string;
  tanggal_deadline: string;
  tipe_tugas: 'Semua_Siswa' | 'Siswa_Terpilih';
  status: 'Aktif' | 'Non-aktif';
  file_tugas?: string;
  bobot_nilai?: number;
  keterangan?: string;
  created_at: string;
  updated_at: string;
  // Relations from backend
  tahunAjaran?: {
    id_tahun_ajaran: number;
    tahun_ajaran: string;
    semester: string;
    status: string;
  };
  mataPelajaran?: {
    id_mata_pelajaran: number;
    nama_mata_pelajaran: string;
  };
  guru?: {
    nik_guru: string;
    nama_lengkap: string;
  };
  kelas?: {
    id_kelas: number;
    nama_kelas: string;
  };
}

interface PengumpulanTugas {
  id_pengumpulan: number;
  nis: string;
  nama_siswa: string;
  tanggal_pengumpulan?: string;
  file_pengumpulan?: string;
  keterangan_siswa?: string;
  nilai?: number;
  status_pengumpulan: 'Belum_Mengumpulkan' | 'Sudah_Mengumpulkan' | 'Terlambat';
  feedback_guru?: string;
}

export default function DetailTugasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [tugas, setTugas] = useState<Tugas | null>(null);
  const [pengumpulan, setPengumpulan] = useState<PengumpulanTugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [user, setUser] = useState<{ role?: string } | null>(null);
  const { user: authUser, userRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keteranganSiswa, setKeteranganSiswa] = useState('');
  const [fileJawaban, setFileJawaban] = useState<File | null>(null);
  const [userPermissions, setUserPermissions] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewState, setPreviewState] = useState<{
    originalUrl: string;
    viewerUrl: string;
    type: 'pdf' | 'image' | 'text' | 'office' | 'unknown';
    fileName: string;
  } | null>(null);
  const docxContainerRef = useRef<HTMLDivElement | null>(null);
  const [docxError, setDocxError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        const permissions = getUserPermission(parsedUser.user_type as any, tugasPermissions);
        setUserPermissions({
          view: permissions.view,
          create: permissions.create,
          edit: permissions.edit,
          delete: permissions.delete
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid user data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    if (user && userPermissions.view) {
      fetchTugas();
      fetchPengumpulan();
    }
  }, [id, user, userPermissions]);

  const fetchTugas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/tugas/${id}`);
      setTugas(response.data.data);
    } catch (error) {
      console.error('Error fetching tugas:', error);
      router.push('/pembelajaran/tugas');
    } finally {
      setLoading(false);
    }
  };

  const fetchPengumpulan = async () => {
    try {
      const response = await api.get(`/v1/tugas/${id}/pengumpulan`);
      const data: PengumpulanTugas[] = response.data.data || [];
      setPengumpulan(data);
    } catch (error) {
      console.error('Error fetching pengumpulan:', error);
    }
  };

  const handleSubmitJawaban = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      if (fileJawaban) formData.append('file_jawaban', fileJawaban);
      if (keteranganSiswa) formData.append('keterangan_siswa', keteranganSiswa);

      await api.post(`/v1/tugas/${id}/pengumpulan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Refresh data pengumpulan
      await fetchPengumpulan();

      // Reset form
      setKeteranganSiswa('');
      setFileJawaban(null);
    } catch (error) {
      console.error('Error submit jawaban:', error);
      alert('Gagal mengumpulkan tugas. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/v1/tugas/${id}`);
      router.push('/pembelajaran/tugas');
    } catch (error) {
      console.error('Error deleting tugas:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileExtension = (url: string) => {
    try {
      const cleanUrl = url.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('.');
      return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
    } catch {
      return '';
    }
  };

  const getFileName = (url: string) => {
    try {
      const cleanUrl = url.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('/');
      return parts[parts.length - 1] || 'file';
    } catch {
      return 'file';
    }
  };

  const openPreviewModal = (fileUrl?: string) => {
    if (!fileUrl) return;
    const ext = getFileExtension(fileUrl);
    let type: 'pdf' | 'image' | 'text' | 'office' | 'unknown' = 'unknown';
    if (['pdf'].includes(ext)) type = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'image';
    else if (['txt'].includes(ext)) type = 'text';
    else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) type = 'office';

    let viewerUrl = fileUrl;
    if (type === 'office') {
      viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
    }

    // gunakan proxy untuk DOCX agar fetch blob aman dari CORS
    const originalUrl = type === 'office' && ext === 'docx'
      ? `/api/proxy?url=${encodeURIComponent(fileUrl)}`
      : fileUrl;

    setPreviewState({
      originalUrl,
      viewerUrl,
      type,
      fileName: getFileName(fileUrl)
    });
    setShowPreviewModal(true);
  };

  // Render DOCX secara lokal jika type office dan ekstensi docx
  useEffect(() => {
    const isDocx = previewState?.type === 'office' && previewState?.originalUrl?.toLowerCase().endsWith('.docx');
    if (!showPreviewModal || !isDocx || !docxContainerRef.current) return;

    setDocxError(null);
    const controller = new AbortController();
    (async () => {
      try {
        // fetch file sebagai blob untuk dirender oleh docx-preview
        const res = await fetch(previewState!.originalUrl, { signal: controller.signal });
        if (!res.ok) throw new Error(`Gagal mengambil file (${res.status})`);
        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const { renderAsync } = await import('docx-preview');
        // bersihkan container
        docxContainerRef.current!.innerHTML = '';
        await renderAsync(arrayBuffer, docxContainerRef.current!, undefined, {
          inWrapper: true,
          ignoreLastRenderedPageBreak: true
        });
      } catch (err: any) {
        console.error('DOCX preview error:', err);
        setDocxError(err?.message || 'Gagal menampilkan preview DOCX');
      }
    })();

    return () => controller.abort();
  }, [showPreviewModal, previewState]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Aktif': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Non-aktif': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status}
      </span>
    );
  };

  const getTipeTugasBadge = (tipe: string) => {
    const tipeConfig = {
      'Semua_Siswa': { color: 'bg-blue-100 text-blue-800', text: 'Semua Siswa' },
      'Siswa_Terpilih': { color: 'bg-purple-100 text-purple-800', text: 'Siswa Terpilih' }
    };
    
    const config = tipeConfig[tipe as keyof typeof tipeConfig];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Users className="w-4 h-4 mr-1" />
        {config?.text || tipe}
      </span>
    );
  };

  const getDeadlineStatus = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: 'text-red-600', text: 'Terlambat', icon: XCircle, bgColor: 'bg-red-50' };
    } else if (diffDays === 0) {
      return { color: 'text-orange-600', text: 'Hari ini', icon: AlertCircle, bgColor: 'bg-orange-50' };
    } else if (diffDays <= 3) {
      return { color: 'text-yellow-600', text: `${diffDays} hari lagi`, icon: AlertCircle, bgColor: 'bg-yellow-50' };
    } else {
      return { color: 'text-green-600', text: `${diffDays} hari lagi`, icon: CheckCircle, bgColor: 'bg-green-50' };
    }
  };

  const getPengumpulanStatusBadge = (status: string) => {
    const statusConfig = {
      'Belum_Mengumpulkan': { color: 'bg-gray-100 text-gray-800', text: 'Belum Mengumpulkan' },
      'Sudah_Mengumpulkan': { color: 'bg-green-100 text-green-800', text: 'Sudah Mengumpulkan' },
      'Terlambat': { color: 'bg-red-100 text-red-800', text: 'Terlambat' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.text || status}
      </span>
    );
  };

  if (!userPermissions.view) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Akses Ditolak</h3>
          <p className="mt-1 text-sm text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tugas tidak ditemukan</h3>
          <p className="mt-1 text-sm text-gray-500">Tugas yang Anda cari tidak ada atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus(tugas.tanggal_deadline);
  const DeadlineIcon = deadlineStatus.icon;
  
  const sudahMengumpulkan = pengumpulan.filter(p => p.status_pengumpulan === 'Sudah_Mengumpulkan').length;
  const totalSiswa = pengumpulan.length;
  const persentasePengumpulan = totalSiswa > 0 ? (sudahMengumpulkan / totalSiswa) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link
                href="/pembelajaran/tugas"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Kembali ke Daftar Tugas
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="mr-3 text-blue-600" />
              {tugas.judul_tugas}
            </h1>
            <p className="text-gray-600 mt-2">
              Detail tugas dan status pengumpulan siswa
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {userPermissions.edit && (
              <Link
                href={`/pembelajaran/tugas/${id}/edit`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            )}
            {userPermissions.delete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Tugas</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Deskripsi</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{tugas.deskripsi_tugas}</p>
              </div>

              {tugas.keterangan && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Keterangan</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{tugas.keterangan}</p>
                </div>
              )}

              {tugas.file_tugas && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">File Tugas</h3>
                  <a
                    href={tugas.file_tugas}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Submission List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Daftar Pengumpulan</h2>
              <div className="text-sm text-gray-600">
                {sudahMengumpulkan} dari {totalSiswa} siswa telah mengumpulkan
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Pengumpulan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keterangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pengumpulan.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data pengumpulan</h3>
                        <p className="mt-1 text-sm text-gray-500">Data pengumpulan akan muncul setelah siswa mengumpulkan tugas.</p>
                      </td>
                    </tr>
                  ) : (
                    pengumpulan.map((item) => (
                      <tr key={item.id_pengumpulan} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.nama_siswa}</div>
                            <div className="text-sm text-gray-500">{item.nis}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPengumpulanStatusBadge(item.status_pengumpulan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.tanggal_pengumpulan ? formatDateTime(item.tanggal_pengumpulan) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.keterangan_siswa ? item.keterangan_siswa : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.nilai !== null && item.nilai !== undefined ? (
                            <span className="text-sm font-medium text-gray-900">{item.nilai}</span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {item.file_pengumpulan && (
                              // Hanya pemilik jawaban (atau guru) yang dapat melihat tombol preview
                              (userRole !== 'Siswa' || String(authUser?.reference_id) === String(item.nis)) && (
                                <button
                                  onClick={() => openPreviewModal(item.file_pengumpulan)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                  title="Lihat File"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )
                            )}
                            {userPermissions.edit && (
                              <Link
                                href={`/pembelajaran/tugas/${id}/penilaian/${item.id_pengumpulan}`}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Beri Nilai"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kerjakan Tugas - hanya untuk siswa (dipindahkan ke bawah daftar pengumpulan) */}
          {userRole === 'Siswa' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="h-5 w-5 text-blue-600 mr-2" />
                Kerjakan / Upload Jawaban
              </h3>
              <form onSubmit={handleSubmitJawaban} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea
                    value={keteranganSiswa}
                    onChange={(e) => setKeteranganSiswa(e.target.value)}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Tuliskan jawaban atau catatan singkat"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Jawaban (opsional)</label>
                  <input
                    type="file"
                    onChange={(e) => setFileJawaban(e.target.files?.[0] || null)}
                    className="w-full"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maks 10MB</p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Mengirim...' : 'Kumpulkan Tugas'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Guru</p>
                  <p className="font-medium text-gray-900">
                    {tugas.guru?.nama_lengkap || tugas.nama_guru || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Kelas</p>
                  <p className="font-medium text-gray-900">
                    {tugas.kelas?.nama_kelas || tugas.nama_kelas || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Tahun Ajaran</p>
                  <p className="font-medium text-gray-900">
                    {tugas.tahunAjaran?.tahun_ajaran ?? (
                      typeof tugas.tahun_ajaran === 'string'
                        ? tugas.tahun_ajaran
                        : (tugas as any)?.tahun_ajaran?.tahun_ajaran
                    ) ?? '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                {getStatusBadge(tugas.status)}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Tipe Tugas</p>
                {getTipeTugasBadge(tugas.tipe_tugas)}
              </div>

              {tugas.bobot_nilai && (
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Bobot Nilai</p>
                    <p className="font-medium text-gray-900">{tugas.bobot_nilai}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Tanggal Pemberian</p>
                  <p className="text-sm text-gray-600">{formatDate(tugas.tanggal_pemberian)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deadlineStatus.bgColor}`}>
                    <DeadlineIcon className={`h-4 w-4 ${deadlineStatus.color}`} />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Deadline</p>
                  <p className="text-sm text-gray-600">{formatDateTime(tugas.tanggal_deadline)}</p>
                  <p className={`text-xs font-medium ${deadlineStatus.color}`}>{deadlineStatus.text}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Pengumpulan</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sudah Mengumpulkan</span>
                  <span>{sudahMengumpulkan}/{totalSiswa}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${persentasePengumpulan}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{persentasePengumpulan.toFixed(1)}% selesai</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{sudahMengumpulkan}</p>
                  <p className="text-xs text-green-600">Sudah</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-gray-600">{totalSiswa - sudahMengumpulkan}</p>
                  <p className="text-xs text-gray-600">Belum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Hapus Tugas</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus tugas "{tugas.judul_tugas}"? 
                  Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data pengumpulan terkait.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewState && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto w-full max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Preview File</h3>
                <p className="text-sm text-gray-500">{previewState.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewState.originalUrl}
                  download
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
                <a
                  href={previewState.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="ml-2 px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Tutup
                </button>
              </div>
            </div>
            <div className="p-4">
              {previewState.type === 'image' && (
                <div className="w-full flex items-center justify-center">
                  <img src={previewState.originalUrl} alt={previewState.fileName} className="max-h-[75vh] object-contain" />
                </div>
              )}
              {previewState.type === 'pdf' && (
                <iframe src={previewState.originalUrl} className="w-full h-[75vh]" />
              )}
              {previewState.type === 'text' && (
                <iframe src={previewState.originalUrl} className="w-full h-[75vh]" />
              )}
              {previewState.type === 'office' && (
                <div className="w-full h-[75vh]">
                  {previewState.originalUrl.toLowerCase().endsWith('.docx') ? (
                    <div className="w-full h-full overflow-auto border rounded">
                      {docxError ? (
                        <div className="p-6 text-center text-sm text-red-600">
                          Terjadi kesalahan saat render DOCX: {docxError}. Menggunakan viewer online sebagai cadangan.
                          <div className="mt-3">
                            <iframe src={previewState.viewerUrl} className="w-full h-[60vh]" />
                          </div>
                        </div>
                      ) : (
                        <div ref={docxContainerRef} className="p-4 docx-preview-container" />
                      )}
                    </div>
                  ) : (
                    <iframe src={previewState.viewerUrl} className="w-full h-[75vh]" />
                  )}
                </div>
              )}
              {previewState.type === 'unknown' && (
                <div className="text-center text-sm text-gray-600">
                  Tidak dapat menampilkan preview untuk jenis file ini. Gunakan tombol "Buka di Tab Baru" atau "Download".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
