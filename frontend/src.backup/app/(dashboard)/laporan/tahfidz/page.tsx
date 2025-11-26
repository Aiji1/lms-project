'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Filter, BookOpen, TrendingUp } from 'lucide-react';

interface TahfidzRow {
  id_hafalan: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  surah_mulai: string;
  ayat_mulai: number;
  surah_selesai: string | null;
  ayat_selesai: number | null;
  total_baris: number | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status_hafalan: 'Proses' | 'Selesai' | 'Tertunda';
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: TahfidzRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    selesai: number;
    proses: number;
    tertunda: number;
    rata_rata_baris: number;
  }
}

interface FormDataResponse {
  success: boolean;
  data: {
    tahun_ajaran: { id_tahun_ajaran: number; tahun_ajaran: string; semester: string; status: string }[];
    kelas: { id_kelas: number; nama_kelas: string }[];
    status_hafalan: { value: string; label: string }[];
  };
}

export default function LaporanTahfidzPage() {
  const [rows, setRows] = useState<TahfidzRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [formData, setFormData] = useState<FormDataResponse['data'] | null>(null);
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null);

  const [tahunAjaran, setTahunAjaran] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchFormData = async () => {
    try {
      const res = await api.get<FormDataResponse>('/v1/laporan/form-data');
      if (res.data.success) {
        setFormData(res.data.data);
      }
    } catch (e) {
      console.error('Gagal mengambil form data laporan:', e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse>('/v1/laporan/tahfidz', {
        params: {
          page: currentPage,
          per_page: 10,
          id_tahun_ajaran: tahunAjaran,
          kelas: kelasFilter,
          status_hafalan: statusFilter
        }
      });
      if (res.data.success) {
        setRows(res.data.data);
        setTotalPages(res.data.meta.last_page);
        setTotalData(res.data.meta.total);
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.error('Gagal mengambil laporan tahfidz:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, tahunAjaran, kelasFilter, statusFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Laporan Tahfidz</h1>
        <Link href="/dashboard" className="text-blue-600">Kembali</Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Data</div>
          <div className="text-2xl font-semibold">{totalData}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Rata-rata Baris</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><TrendingUp size={18} />{summary ? summary.rata_rata_baris.toFixed(2) : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Selesai</div>
          <div className="text-2xl font-semibold">{summary ? summary.selesai : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Proses • Tertunda</div>
          <div className="text-lg font-medium text-gray-700">{summary ? `${summary.proses} • ${summary.tertunda}` : '-'}</div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm">Tahun Ajaran</label>
            <select className="border rounded p-2 w-56" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)}>
              <option value="">Semua</option>
              {formData?.tahun_ajaran.map(t => (
                <option key={t.id_tahun_ajaran} value={t.id_tahun_ajaran}>{t.tahun_ajaran} - {t.semester}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Kelas</label>
            <select className="border rounded p-2 w-48" value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}>
              <option value="">Semua</option>
              {formData?.kelas.map(k => (
                <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Status</label>
            <select className="border rounded p-2 w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Semua</option>
              {formData?.status_hafalan.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => fetchData()} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Filter size={16}/> Terapkan</button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded shadow overflow-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Tanggal Mulai</th>
              <th className="p-3 text-left">NIS</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Kelas</th>
              <th className="p-3 text-left">Mulai</th>
              <th className="p-3 text-left">Selesai</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center">Tidak ada data</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.id_hafalan} className="border-t">
                  <td className="p-3">{row.tanggal_mulai}</td>
                  <td className="p-3">{row.nis}</td>
                  <td className="p-3">{row.nama_siswa}</td>
                  <td className="p-3">{row.nama_kelas}</td>
                  <td className="p-3">{row.surah_mulai} : {row.ayat_mulai}</td>
                  <td className="p-3">{row.surah_selesai ? `${row.surah_selesai} : ${row.ayat_selesai}` : '-'}</td>
                  <td className="p-3">{row.status_hafalan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button disabled={currentPage<=1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded">Prev</button>
        <span>Hal {currentPage} / {totalPages}</span>
        <button disabled={currentPage>=totalPages} onClick={() => setCurrentPage(p => p+1)} className="px-3 py-1 border rounded">Next</button>
      </div>
    </div>
  );
}