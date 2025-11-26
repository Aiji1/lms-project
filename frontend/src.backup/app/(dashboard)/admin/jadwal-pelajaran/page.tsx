'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Calendar, Users, BookOpen, LayoutGrid, LayoutList, Download, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { createPermissionForRoles, getUserPermission } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS } from '@/types/permissions';
import { PermissionGuard } from '@/components/ui/PermissionGuard';

interface JadwalPelajaran {
  id_jadwal: number;
  id_tahun_ajaran: number;
  id_mata_pelajaran: number;
  nik_guru: string;
  id_kelas: number;
  hari: string;
  jam_ke: string | number;
  tahun_ajaran: string;
  semester: string;
  nama_mata_pelajaran: string;
  kode_mata_pelajaran: string;
  nama_guru: string;
  nama_kelas: string;
  tingkat: string;
}

interface FormOptions {
  tahun_ajaran: any[];
  mata_pelajaran: any[];
  guru: any[];
  kelas: any[];
  hari: { label: string; value: string }[];
  jam_ke: { label: string; value: number }[];
}

export default function JadwalPelajaranPage() {
  const { userRole } = useAuth();
  const jadwalPermissions = createPermissionForRoles({
    Admin: FULL_PERMISSIONS,
    Kepala_Sekolah: READ_ONLY_PERMISSIONS,
    Guru: FULL_PERMISSIONS,
    Siswa: READ_ONLY_PERMISSIONS,
    Orang_Tua: READ_ONLY_PERMISSIONS,
    Petugas_Keuangan: READ_ONLY_PERMISSIONS,
  });
  const userPermissions = getUserPermission(userRole || 'Siswa', jadwalPermissions);

  const [data, setData] = useState<JadwalPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [hariFilter, setHariFilter] = useState('');
  const [guruFilter, setGuruFilter] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [formOptions, setFormOptions] = useState<FormOptions>({
    tahun_ajaran: [],
    mata_pelajaran: [],
    guru: [],
    kelas: [],
    hari: [],
    jam_ke: [],
  });
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFormOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchTerm, tahunAjaranFilter, kelasFilter, hariFilter, guruFilter, viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/jadwal-pelajaran', {
        params: {
          page: 1,
          per_page: 200,
          search: searchTerm,
          tahun_ajaran: tahunAjaranFilter,
          kelas: kelasFilter,
          hari: viewMode === 'grid' ? '' : hariFilter,
          guru: guruFilter,
        },
      });
      if (response.data.success) {
        setData(response.data.data.data);
        setTotalItems(response.data.data.total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const response = await api.get('/v1/jadwal-pelajaran-form-options');
      if (response.data.success) {
        setFormOptions(response.data.data);
        if (response.data.data?.default_tahun_ajaran) {
          setTahunAjaranFilter(String(response.data.data.default_tahun_ajaran));
        }
      }
    } catch (error) {
      console.error('Error fetching form options:', error);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTahunAjaranFilter('');
    setKelasFilter('');
    setHariFilter('');
    setGuruFilter('');
  };

  const days: string[] = (formOptions.hari?.length ? formOptions.hari.map((h) => h.label) : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const jamList: (string | number)[] = (formOptions.jam_ke?.length ? formOptions.jam_ke.map((j) => j.value) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  const findCell = (hari: string, jam: string | number) => {
    return data.find((d) => d.hari === hari && String(d.jam_ke) === String(jam));
  };

  const handleExportPDF = () => window.print();
  const triggerImport = () => fileInputRef.current?.click();
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
      const [header, ...rows] = lines;
      const cols = header.split(',').map((c) => c.trim());
      const required = ['id_tahun_ajaran', 'id_mata_pelajaran', 'nik_guru', 'id_kelas', 'hari', 'jam_ke'];
      const ok = required.every((r) => cols.includes(r));
      if (!ok) {
        alert('Header CSV tidak sesuai. Gunakan kolom: ' + required.join(','));
        return;
      }
      const idx: Record<string, number> = {};
      cols.forEach((c, i) => (idx[c] = i));
      let success = 0,
        failed = 0;
      for (const row of rows) {
        const cells = row.split(',');
        if (cells.length < cols.length) continue;
        const payload = {
          id_tahun_ajaran: parseInt(cells[idx['id_tahun_ajaran']]),
          id_mata_pelajaran: parseInt(cells[idx['id_mata_pelajaran']]),
          nik_guru: cells[idx['nik_guru']].trim(),
          id_kelas: parseInt(cells[idx['id_kelas']]),
          hari: cells[idx['hari']].trim(),
          jam_ke: parseInt(cells[idx['jam_ke']]),
        };
        try {
          const resp = await api.post('/v1/jadwal-pelajaran', payload);
          if (resp.data.success) success++; else failed++;
        } catch {
          failed++;
        }
      }
      alert(`Impor selesai. Sukses: ${success}, Gagal: ${failed}`);
      fetchData();
    } catch (err: any) {
      alert('Gagal membaca file: ' + err?.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" /> Jadwal Pelajaran
            </h1>
            <p className="text-gray-600 mt-1">Kelola jadwal pelajaran untuk semua kelas</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 flex-wrap">
            <PermissionGuard userRole={userRole || 'Siswa'} permissions={jadwalPermissions} action="create">
              <Link href="/admin/jadwal-pelajaran/tambah" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
              </Link>
            </PermissionGuard>
            <button onClick={triggerImport} className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center">
              <Upload className="h-4 w-4 mr-2" /> Import Excel
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            <button onClick={handleExportPDF} className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </button>
            <div className="w-full sm:w-auto md:ml-2 flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 rounded-lg border border-gray-200 ${viewMode === 'grid' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <LayoutGrid className="h-4 w-4 inline mr-1" /> Grid
              </button>
              <button onClick={() => setViewMode('card')} className={`px-3 py-2 rounded-lg border border-gray-200 ${viewMode === 'card' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                <LayoutList className="h-4 w-4 inline mr-1" /> Card
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input type="text" placeholder="Cari mata pelajaran, guru, atau kelas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={tahunAjaranFilter} onChange={(e) => setTahunAjaranFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-lg">
                <option value="">Semua Tahun Ajaran</option>
                {formOptions.tahun_ajaran.map((t: any) => (
                  <option key={t.id_tahun_ajaran} value={t.id_tahun_ajaran}>{t.tahun_ajaran} - {t.semester}</option>
                ))}
              </select>
              <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-lg">
                <option value="">Semua Kelas</option>
                {formOptions.kelas.map((k: any) => (
                  <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
                ))}
              </select>
              <select value={hariFilter} onChange={(e) => setHariFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-lg">
                <option value="">Semua Hari</option>
                {formOptions.hari.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
              <select value={guruFilter} onChange={(e) => setGuruFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border rounded-lg">
                <option value="">Semua Guru</option>
                {formOptions.guru.map((g: any) => (
                  <option key={g.nik_guru} value={g.nik_guru}>{g.nama_lengkap}</option>
                ))}
              </select>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                <Search className="h-4 w-4 mr-2" /> Cari
              </button>
              <button type="button" onClick={resetFilters} className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center">
                <Filter className="h-4 w-4 mr-2" /> Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg"><Calendar className="h-6 w-6 text-blue-600" /></div>
            <div className="ml-4"><p className="text-sm text-gray-600">Total Jadwal</p><p className="text-2xl font-bold">{totalItems}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg"><BookOpen className="h-6 w-6 text-green-600" /></div>
            <div className="ml-4"><p className="text-sm text-gray-600">Mata Pelajaran</p><p className="text-2xl font-bold">{formOptions.mata_pelajaran.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div>
            <div className="ml-4"><p className="text-sm text-gray-600">Guru</p><p className="text-2xl font-bold">{formOptions.guru.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg"><Users className="h-6 w-6 text-orange-600" /></div>
            <div className="ml-4"><p className="text-sm text-gray-600">Kelas</p><p className="text-2xl font-bold">{formOptions.kelas.length}</p></div>
          </div>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          {!kelasFilter && (
            <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">Pilih kelas terlebih dahulu untuk menampilkan grid jadwal.</div>
          )}
          {kelasFilter && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full md:min-w-[900px] table-fixed border rounded-lg">
                    <thead>
                      <tr>
                        <th className="bg-blue-50 text-blue-700 font-semibold text-left text-xs sm:text-sm px-2 sm:px-4 py-2 border">Jam Ke</th>
                        {days.map((d) => (
                          <th key={d} className="bg-blue-50 text-blue-700 font-semibold text-xs sm:text-sm px-2 sm:px-4 py-2 border">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jamList.map((j) => (
                        <tr key={`row-${j}`}>
                          <td className="w-16 text-center font-semibold border px-2 py-3">{j}</td>
                          {days.map((d) => {
                            const item = findCell(d, j);
                            const content = item ? (
                              <Link href={`/admin/jadwal-pelajaran/${item.id_jadwal}/edit`} className="block w-full h-full rounded hover:bg-yellow-50 focus-visible:ring-2 focus-visible:ring-blue-500 p-2">
                                <div className="text-xs sm:text-sm font-semibold text-yellow-800">
                                  {item.kode_mata_pelajaran || item.nama_mata_pelajaran}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-600 mt-1">{item.nama_guru}</div>
                              </Link>
                            ) : (
                              <Link href={`/admin/jadwal-pelajaran/tambah?hari=${encodeURIComponent(d)}&jam_ke=${j}&id_kelas=${kelasFilter}&id_tahun_ajaran=${tahunAjaranFilter}`} className="block w-full h-full rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500">
                                +
                              </Link>
                            );
                            return <td key={`${d}-${j}`} className="align-top border p-1 sm:p-2 h-16 sm:h-20">{content}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="border rounded-lg p-3">
                  <p className="font-semibold mb-2">Legend Mata Pelajaran</p>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {Array.from(new Set(data.map((d) => `${d.nama_mata_pelajaran} (${d.kode_mata_pelajaran})`))).map((name) => (
                      <div key={name} className="text-sm text-gray-700">{name}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'card' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          {loading && <p className="text-gray-600">Memuat data...</p>}
          {!loading && data.length === 0 && <p className="text-gray-600">Tidak ada data.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <div key={item.id_jadwal} className="border rounded-lg p-3">
                <p className="font-semibold">{item.nama_mata_pelajaran} ({item.kode_mata_pelajaran})</p>
                <p className="text-sm text-gray-600">{item.nama_kelas} • {item.hari} • Jam {item.jam_ke}</p>
                <p className="text-sm text-gray-600">{item.nama_guru}</p>
                <div className="mt-2 flex gap-2">
                  <Link href={`/admin/jadwal-pelajaran/${item.id_jadwal}/edit`} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Edit</Link>
                  <Link href={`/admin/jadwal-pelajaran/tambah?hari=${encodeURIComponent(item.hari)}&jam_ke=${item.jam_ke}&id_kelas=${item.id_kelas}&id_tahun_ajaran=${item.id_tahun_ajaran}`} className="px-2 py-1 text-xs border rounded">Duplikasi</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}