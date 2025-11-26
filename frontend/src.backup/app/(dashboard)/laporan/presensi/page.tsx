'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Calendar, UserCheck, Filter, TrendingUp } from 'lucide-react';

interface PresensiRow {
  id_presensi_harian: number;
  nis: string;
  nama_siswa: string;
  nama_kelas: string;
  nama_jurusan: string;
  tanggal: string;
  jam_masuk: string | null;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  metode_presensi: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: PresensiRow[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: {
    total: number;
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    persentase_hadir: number;
  }
}

interface FormDataResponse {
  success: boolean;
  data: {
    tahun_ajaran: { id_tahun_ajaran: number; tahun_ajaran: string; semester: string; status: string }[];
    kelas: { id_kelas: number; nama_kelas: string; nama_jurusan?: string }[];
    status_presensi: { value: string; label: string }[];
  };
}

export default function LaporanPresensiPage() {
  const [rows, setRows] = useState<PresensiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [formData, setFormData] = useState<FormDataResponse['data'] | null>(null);
  const [summary, setSummary] = useState<ApiResponse['summary'] | null>(null);

  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
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
      const res = await api.get<ApiResponse>('/v1/laporan/presensi', {
        params: {
          page: currentPage,
          per_page: 10,
          tanggal_mulai: tanggalMulai,
          tanggal_selesai: tanggalSelesai,
          kelas: kelasFilter,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setRows(res.data.data);
        setTotalPages(res.data.meta.last_page);
        setTotalData(res.data.meta.total);
        setSummary(res.data.summary);
      }
    } catch (e) {
      console.error('Gagal mengambil laporan presensi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, tanggalMulai, tanggalSelesai, kelasFilter, statusFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Laporan Presensi</h1>
        <Link href="/dashboard" className="text-blue-600">Kembali</Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Data</div>
          <div className="text-2xl font-semibold">{totalData}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Persentase Hadir</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><TrendingUp size={18} />{summary ? `${summary.persentase_hadir.toFixed(1)}%` : '-'}</div>
          <div className="mt-2 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${Math.min(100, Math.max(0, summary?.persentase_hadir ?? 0))}%` }}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Hadir / Total</div>
          <div className="text-2xl font-semibold">{summary ? `${summary.hadir} / ${summary.total}` : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Sakit • Izin • Alpha</div>
          <div className="text-lg font-medium text-gray-700">{summary ? `${summary.sakit} • ${summary.izin} • ${summary.alpha}` : '-'}</div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm">Tanggal Mulai</label>
            <input type="date" className="border rounded p-2 w-48" value={tanggalMulai} onChange={e => setTanggalMulai(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Tanggal Selesai</label>
            <input type="date" className="border rounded p-2 w-48" value={tanggalSelesai} onChange={e => setTanggalSelesai(e.target.value)} />
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
              {formData?.status_presensi.map(s => (
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
              <th className="p-3 text-left">Tanggal</th>
              <th className="p-3 text-left">NIS</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Kelas</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Metode</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center">Tidak ada data</td></tr>
            ) : (
              rows.map(row => (
                <tr key={row.id_presensi_harian} className="border-t">
                  <td className="p-3">{row.tanggal}</td>
                  <td className="p-3">{row.nis}</td>
                  <td className="p-3">{row.nama_siswa}</td>
                  <td className="p-3">{row.nama_kelas}</td>
                  <td className="p-3">{row.status}</td>
                  <td className="p-3">{row.metode_presensi}</td>
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