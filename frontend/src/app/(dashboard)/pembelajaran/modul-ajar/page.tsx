'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission, mergePermissions } from '@/lib/permissions';
import { fetchMergedOverrides, mergeItemPermissions } from '@/lib/permissionOverrides';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Trash2,
  Users,
  BookOpen,
  ThumbsUp,
  Share2
} from 'lucide-react';

// Base permissions for Modul Ajar
const baseModulPermissions = mergePermissions(
  createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
  createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
);

// Types
interface ModulItem {
  id: number;
  judul_modul: string;
  nik_guru: string | null;
  id_mata_pelajaran: number | null;
  id_kelas: number | null;
  tipe_file: string; // PDF/DOCX/PPTX, etc
  ukuran_bytes: number;
  file_path: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  downloads_count: number;
  tanggal_upload: string;
}

interface PaginatedResponse {
  success: boolean;
  data: {
    data: ModulItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface StatsData {
  total: number;
  guru_aktif: number;
  menunggu: number;
  download_bulan_ini: number;
}

export default function ModulAjarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userRole } = useAuth();

  const [overrideMap, setOverrideMap] = useState<any>({});
  const effectivePermissions = useMemo(() => {
    return mergeItemPermissions(baseModulPermissions, overrideMap, 'pembelajaran.modul_ajar');
  }, [overrideMap]);

  const userPermissions = useMemo(() => {
    return getUserPermission(userRole || 'Siswa', effectivePermissions);
  }, [userRole, effectivePermissions]);

  const isAdmin = userRole === 'Admin' || userRole === 'Kepala_Sekolah';
  const isGuru = userRole === 'Guru';

  // Data state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [items, setItems] = useState<ModulItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  // tambahan filter
  const [guruFilter, setGuruFilter] = useState<string>('');
  const [mapelFilter, setMapelFilter] = useState<number | ''>('');
  const [kelasFilter, setKelasFilter] = useState<number | ''>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');

  const [guruOptions, setGuruOptions] = useState<{value: string, label: string}[]>([]);
  const [mapelOptions, setMapelOptions] = useState<{value: number, label: string}[]>([]);
  const [kelasOptions, setKelasOptions] = useState<{value: number, label: string}[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Upload form (Guru)
  const [judulModul, setJudulModul] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // Tambahan: pilihan mapel & kelas untuk upload oleh Guru
  const [uploadMapelId, setUploadMapelId] = useState<number | ''>('');
  const [uploadKelasId, setUploadKelasId] = useState<number | ''>('');

  useEffect(() => {
    // Permission overrides (if any)
    if (user) {
      fetchMergedOverrides({ role: userRole || 'Siswa', user_id: (user as any)?.user_id })
        .then(setOverrideMap)
        .catch(() => {});
    }
  }, [user, userRole]);

  useEffect(() => {
    if (userPermissions.view) {
      fetchStats();
      fetchItems();
    }
  }, [userPermissions.view, currentPage, statusFilter, guruFilter, mapelFilter, kelasFilter, fileTypeFilter]);

  // fetch options untuk dropdown
  useEffect(() => {
    async function fetchOptions() {
      // Guru options (hanya bila bukan Guru), jangan block jika gagal
      try {
        if (!isGuru) {
          const res = await api.get('/v1/guru', { params: { per_page: 100, status: 'Aktif' } });
          const list = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
          const guruData = list.map((g: any) => ({ value: g.nik_guru, label: g.nama_lengkap || g.nik_guru }));
          setGuruOptions(guruData);
        }
      } catch (e) {
        // abaikan error, dropdown guru tidak menghalangi mapel/kelas
      }

      // Mapel options
      try {
        const res = await api.get('/v1/mata-pelajaran', { params: { per_page: 100, status: 'Aktif' } });
        const list = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
        const mapelData = list.map((m: any) => ({ value: m.id_mata_pelajaran, label: m.nama_mata_pelajaran }));
        setMapelOptions(mapelData);
      } catch (e) {
        // abaikan error
      }

      // Kelas options
      try {
        const res = await api.get('/v1/kelas', { params: { per_page: 100 } });
        const list = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.data || []);
        const kelasData = list.map((k: any) => ({ value: k.id_kelas, label: k.nama_kelas }));
        setKelasOptions(kelasData);
      } catch (e) {
        // abaikan error
      }
    }
    fetchOptions();
  }, [userPermissions.view, isGuru]);

  async function fetchStats() {
    try {
      setStatsLoading(true);
      const res = await api.get('/v1/modul-ajar/stats');
      if (res.data?.success) {
        setStats(res.data.data as StatsData);
      }
    } catch (err) {
      console.error('Error fetching stats', err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchItems() {
    try {
      setLoading(true);
      const res = await api.get<PaginatedResponse>('/v1/modul-ajar', {
        params: {
          page: currentPage,
          per_page: 10,
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          nik_guru: (isGuru ? (user as any)?.reference_id : guruFilter) || undefined,
          id_mata_pelajaran: mapelFilter || undefined,
          id_kelas: kelasFilter || undefined,
        },
      });
      if (res.data?.success) {
        const data = res.data.data;
        const raw = (data?.data || []) as any[];
        const normalized = raw.map((d: any) => ({ ...d, id: d.id ?? d.id_modul }));
        // filter tipe file di sisi klien jika dipilih
        const filtered = fileTypeFilter
          ? normalized.filter((d) => d.tipe_file?.toLowerCase() === fileTypeFilter.toLowerCase())
          : normalized;
        setItems(filtered);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || filtered.length);
      }
    } catch (err) {
      console.error('Error fetching modul ajar', err);
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes: number) {
    if (!bytes && bytes !== 0) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  async function handleDownload(id: number) {
    try {
      const res = await api.get(`/v1/modul-ajar/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // Try to parse filename from headers if provided
      const cd = res.headers['content-disposition'];
      let filename = 'modul-ajar';
      if (cd) {
        const match = /filename="?([^";]+)"?/i.exec(cd);
        if (match?.[1]) filename = match[1];
      }
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file', err);
      alert('Gagal mengunduh file');
    }
  }

  // Tambahan: handler untuk dropzone dan aksi kartu guru (dalam komponen)
  function openFilePicker() {
    fileInputRef.current?.click();
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setSelectedFile(f); handleUpload(f); }
  }
  function viewFile(item: ModulItem) {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    let fileUrl = '';
    try {
      const origin = new URL(base).origin;
      fileUrl = `${origin}/storage/${item.file_path}`;
    } catch (err) {
      fileUrl = base.replace(/\/api$/, '') + `/storage/${item.file_path}`;
    }
    // Buka di tab baru menggunakan Google Viewer untuk dokumen Office
    const extFromType = (item.tipe_file || '').toLowerCase();
    const extFromPath = (item.file_path?.split('.').pop() || '').toLowerCase();
    const ext = extFromType || extFromPath;
    const officeExt = ['doc','docx','ppt','pptx','xls','xlsx'];
    if (officeExt.includes(ext)) {
      const officeViewer = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
      window.open(officeViewer, '_blank', 'noopener,noreferrer');
      return;
    }
    // PDF dan lainnya: buka langsung
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
  async function handleEdit(id: number, currentTitle: string) {
    const next = prompt('Judul modul baru', currentTitle);
    if (!next || next === currentTitle) return;
    try {
      await api.put(`/v1/modul-ajar/${id}`, { judul_modul: next });
      fetchItems();
    } catch (err) {
      console.error('edit error', err);
    }
  }

  async function handleApprove(id: number) {
    try {
      await api.put(`/v1/modul-ajar/${id}`, { status: 'Disetujui' });
      fetchItems();
    } catch (err) {
      console.error('approve error', err);
    }
  }
  async function handleReject(id: number) {
    try {
      await api.put(`/v1/modul-ajar/${id}`, { status: 'Ditolak' });
      fetchItems();
    } catch (err) {
      console.error('reject error', err);
    }
  }
  async function handleDelete(id: number) {
    if (!confirm('Hapus modul ini?')) return;
    try {
      await api.delete(`/v1/modul-ajar/${id}`);
      fetchItems();
    } catch (err) {
      console.error('delete error', err);
    }
  }

  async function handleUpload(fileParam?: File) {
    if (!userPermissions.create) return;
    const file = fileParam || selectedFile;
    if (!file) {
      setFeedback('Pilih file terlebih dahulu');
      return;
    }
    // Validasi mapel & kelas untuk akun Guru
    if (isGuru && (!uploadMapelId || !uploadKelasId)) {
      setFeedback('Pilih mata pelajaran dan kelas terlebih dahulu');
      return;
    }
    const inferredTitle = judulModul && judulModul.trim() ? judulModul.trim() : (file.name.split('.').slice(0, -1).join('.') || file.name);
    setFeedback(null);
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('judul_modul', inferredTitle);
      if ((user as any)?.reference_id) fd.append('nik_guru', (user as any).reference_id);
      // Sertakan mapel & kelas jika diisi
      if (uploadMapelId) fd.append('id_mata_pelajaran', String(uploadMapelId));
      if (uploadKelasId) fd.append('id_kelas', String(uploadKelasId));
      fd.append('file', file);

      const res = await api.post('/v1/modul-ajar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        setJudulModul('');
        setSelectedFile(null);
        setUploadMapelId('');
        setUploadKelasId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchItems();
        fetchStats();
      }
    } catch (err: any) {
      console.error('upload error', err);
      alert(err?.response?.data?.message || 'Gagal upload modul');
    } finally {
      setUploading(false);
    }
  }

  // Derived: admin-style stats
  const adminStats = useMemo(() => {
    if (!stats) return [] as any[];
    return [
      { key: 'total', title: 'Total Modul', value: stats.total, color: 'bg-blue-100', text: 'text-blue-600', icon: FileText },
      { key: 'guru_aktif', title: 'Total Guru Aktif', value: stats.guru_aktif, color: 'bg-green-100', text: 'text-green-600', icon: Users },
      { key: 'menunggu', title: 'Menunggu Persetujuan', value: stats.menunggu, color: 'bg-orange-100', text: 'text-orange-600', icon: CheckCircle },
      { key: 'download_bulan_ini', title: 'Total Download Bulan Ini', value: stats.download_bulan_ini, color: 'bg-purple-100', text: 'text-purple-600', icon: Download },
    ];
  }, [stats]);

  // Tambahan: stats untuk guru mengikuti contoh gambar (campuran personal & global)
  const displayStats = useMemo(() => {
    if (isGuru) {
      // Personal totals + sebagian global
      const now = new Date();
      const menungguSaya = items.filter(i => i.status === 'Menunggu').length;
      const downloadBulanIniSaya = items
        .filter(i => {
          const d = new Date(i.tanggal_upload);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((acc, cur) => acc + (cur.downloads_count || 0), 0);
      return [
        { key: 'total_saya', title: 'Total Modul', value: items.length, color: 'bg-blue-100', text: 'text-blue-600', icon: FileText },
        { key: 'guru_aktif', title: 'Total Guru Aktif', value: stats?.guru_aktif ?? 0, color: 'bg-green-100', text: 'text-green-600', icon: Users },
        { key: 'menunggu_saya', title: 'Menunggu Persetujuan', value: menungguSaya, color: 'bg-orange-100', text: 'text-orange-600', icon: CheckCircle },
        { key: 'download_bulan_ini_saya', title: 'Total Download Bulan Ini', value: downloadBulanIniSaya, color: 'bg-purple-100', text: 'text-purple-600', icon: Download },
      ];
    }
    return adminStats;
  }, [isGuru, items, stats, adminStats]);
  // Derived: guru stats dari items
  const myStats = useMemo(() => {
    const total = items.length;
    const now = new Date();
    const uploadsThisMonth = items.filter(i => {
      const d = new Date(i.tanggal_upload);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalDownloads = items.reduce((acc, cur) => acc + (cur.downloads_count || 0), 0);
    return { total, uploadsThisMonth, totalDownloads };
  }, [items]);

  if (!userPermissions.view) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Anda tidak memiliki izin untuk melihat halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {isGuru ? (
        <div className="rounded-xl p-6 md:p-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-3 opacity-90" />
              <div>
                <h1 className="text-2xl font-bold">Modul Ajar Saya</h1>
                <p className="text-sm opacity-90">Kelola dan bagikan modul pembelajaran Anda</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm opacity-90">{(user as any)?.nama_lengkap || (user as any)?.username || 'Guru'}</p>
                <p className="text-xs opacity-80">Guru</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">{((user as any)?.nama_lengkap || 'G').split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase()}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Total Modul Saya</p>
              <p className="text-3xl font-bold">{myStats.total}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Upload Bulan Ini</p>
              <p className="text-3xl font-bold">{myStats.uploadsThisMonth}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-90">Total Download</p>
              <p className="text-3xl font-bold">{myStats.totalDownloads}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Manajemen Modul Ajar
            </h1>
            <p className="text-gray-600 mt-1">Kelola semua modul pembelajaran dari seluruh guru</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Export Data</button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Generate Laporan</button>
          </div>
        </div>
      )}
 
        {/* Stats (Admin only) */}
      {!isGuru && (statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {displayStats.map((s, idx) => (
            <div key={s.key ?? idx} className={`bg-white rounded-lg shadow-sm border p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{s.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
                <div className={`w-12 h-12 ${s.color} rounded-lg flex items-center justify-center`}>
                  {(() => { const Icon = s.icon; return <Icon className={`w-6 h-6 ${s.text}`} />; })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Tabs status */}
      {!isGuru && (
        <div className="flex items-center gap-2">
          {[
            { label: 'Semua Modul', value: '' },
            { label: 'Persetujuan', value: 'Menunggu' },
            { label: 'Disetujui', value: 'Disetujui' },
            { label: 'Ditolak', value: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg border ${statusFilter === tab.value ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters & actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2 xl:col-span-2 min-w-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan judul, guru, atau mapel..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>
          {!isGuru && (
            <select value={guruFilter} onChange={(e) => setGuruFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="">Semua Guru</option>
              {guruOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          )}
          <select value={mapelFilter} onChange={(e) => setMapelFilter(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded-lg px-3 py-2">
            <option value="">Semua Mata Pelajaran</option>
            {mapelOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded-lg px-3 py-2">
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <select value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Semua Tipe File</option>
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="PPTX">PPTX</option>
          </select>
          <button onClick={() => { setCurrentPage(1); fetchItems(); }} className="w-full inline-flex items-center px-3 py-2 bg-gray-100 border rounded-lg text-gray-700 hover:bg-gray-200">
            <Filter className="h-4 w-4 mr-2" /> Terapkan
          </button>
        </div>
        {!isGuru && userPermissions.create && (
          <div className="flex items-center gap-2 w-full md:w-auto md:justify-end">
            <label className="w-full md:w-auto inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer text-blue-700 hover:bg-blue-100">
              <Upload className="h-4 w-4 mr-2" /> Pilih File & Upload
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}
      </div>

      {/* Guru Upload Area */}
      {isGuru && userPermissions.create && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Form metadata untuk upload oleh Guru */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Judul Modul</label>
              <input
                type="text"
                value={judulModul}
                onChange={(e) => setJudulModul(e.target.value)}
                placeholder="Contoh: Bab 1 - Persamaan Linear"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mata Pelajaran</label>
              <select
                value={uploadMapelId}
                onChange={(e) => setUploadMapelId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mapelOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kelas</label>
              <select
                value={uploadKelasId}
                onChange={(e) => setUploadKelasId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <p className="font-semibold">Upload Modul Ajar Baru</p>
            <p className="text-sm text-gray-600">Seret file ke sini atau klik tombol di bawah untuk memilih file</p>
            <button onClick={openFilePicker} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" /> Pilih File & Upload
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => { const f = e.target.files?.[0] || null; setSelectedFile(f); if (f) handleUpload(f); }} />
            <p className="mt-3 text-xs text-gray-500">Format yang didukung: PDF, DOC, DOCX, PPT, PPTX (maksimal 10MB)</p>
            {feedback && <p className="mt-2 text-sm text-red-600">{feedback}</p>}
          </div>
        </div>
      )}

      {/* Admin Table or Guru Cards */}
      {isGuru ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Daftar Modul Saya</h2>
          {/* small stats untuk guru */}
          {/* bagian ini tetap untuk ringkas */}
          {loading ? (
            <div className="text-gray-600">Memuat data...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">Belum ada modul</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map((m) => (
                <div key={m.id} className="bg-white rounded-lg border shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{m.judul_modul}</h3>
                      <p className="text-xs text-gray-500 mt-1">Kelas: {m.id_kelas || '-'} • {new Date(m.tanggal_upload).toLocaleDateString()} • {formatSize(m.ukuran_bytes)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.status === 'Disetujui' ? 'bg-green-100 text-green-700' : m.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{m.status}</span>
                  </div>
                  {/* badge tipe */}
                  <div className="mt-2">
                    <span className="inline-block text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{m.tipe_file}</span>
                  </div>
                  {/* badge statistik kecil */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-gray-700 text-xs">
                      <Download className="h-3 w-3 mr-1" /> {m.downloads_count || 0} downloads
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => viewFile(m)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Lihat
                    </button>
                    <button
                      onClick={() => handleDownload(m.id)}
                      className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </button>
                    <button
                      onClick={() => handleEdit(m.id, m.judul_modul)}
                      className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      Edit
                    </button>
                    {userPermissions.delete && (
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Judul Modul</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Guru</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mapel</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Kelas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tanggal Upload</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={7}>Memuat data...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={7}>Tidak ada data</td>
                    </tr>
                  ) : (
                    items.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{m.judul_modul}</div>
                        </td>
                        <td className="px-4 py-3">{m.nik_guru || '-'}</td>
                        <td className="px-4 py-3">{m.id_mata_pelajaran || '-'}</td>
                        <td className="px-4 py-3">{m.id_kelas || '-'}</td>
                        <td className="px-4 py-3">{m.tipe_file}</td>
                        <td className="px-4 py-3">{new Date(m.tanggal_upload).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(m.id)}
                              className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                              <Download className="h-4 w-4 mr-2" /> Unduh
                            </button>
                            {userPermissions.edit && m.status !== 'Disetujui' && (
                              <button
                                onClick={() => handleApprove(m.id)}
                                className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" /> Setujui
                              </button>
                            )}
                            {userPermissions.edit && m.status !== 'Ditolak' && (
                              <button
                                onClick={() => handleReject(m.id)}
                                className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                              >
                                <XCircle className="h-4 w-4 mr-2" /> Tolak
                              </button>
                            )}
                            {userPermissions.delete && (
                              <button
                                onClick={() => handleDelete(m.id)}
                                className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Hapus
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
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">Menampilkan {items.length} dari {totalItems} modul</p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Sebelumnya</button>
              {/* angka halaman */}
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 border rounded ${currentPage === (idx + 1) ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Berikutnya</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}