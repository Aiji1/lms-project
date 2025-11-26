'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Users, GraduationCap, School, BookOpen, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';

interface StatistikData {
  total_siswa: number;
  total_guru: number;
  total_kelas: number;
  total_mapel: number;
  presensi_total: number;
  presensi_hadir_persen: number;
  hafalan_total: number;
  hafalan_selesai: number;
  hafalan_rata_baris: number;
  nilai_rata_final: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: StatistikData;
}

export default function LaporanStatistikPage() {
  const [stats, setStats] = useState<StatistikData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ApiResponse>('/v1/laporan/statistik');
      if (res.data.success) {
        setStats(res.data.data);
      } else {
        setError(res.data.message || 'Gagal mengambil statistik');
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal mengambil statistik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Statistik Laporan</h1>
        <Link href="/dashboard" className="text-blue-600">Kembali</Link>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Siswa</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><Users size={18}/>{stats?.total_siswa ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Guru</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><GraduationCap size={18}/>{stats?.total_guru ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Kelas</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><School size={18}/>{stats?.total_kelas ?? '-'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Mata Pelajaran</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><BookOpen size={18}/>{stats?.total_mapel ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Persentase Hadir Presensi</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><CheckCircle size={18}/>{stats ? `${stats.presensi_hadir_persen}%` : '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Presensi</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><BarChart3 size={18}/>{stats?.presensi_total ?? '-'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Hafalan</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><BookOpen size={18}/>{stats?.hafalan_total ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Hafalan Selesai</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><CheckCircle size={18}/>{stats?.hafalan_selesai ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Rata-rata Baris Hafalan</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><TrendingUp size={18}/>{stats?.hafalan_rata_baris ?? '-'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Nilai Rata-rata Final</div>
          <div className="text-2xl font-semibold flex items-center gap-2"><AwardIcon/>{stats?.nilai_rata_final ?? '-'}</div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={fetchData} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Memuat...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

function AwardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15C16.4183 15 20 11.4183 20 7C20 2.58172 16.4183 -1 12 -1C7.58172 -1 4 2.58172 4 7C4 11.4183 7.58172 15 12 15Z" transform="translate(0 4)" stroke="#111827" strokeWidth="2"/>
      <path d="M8 21L12 19L16 21L12 23L8 21Z" stroke="#111827" strokeWidth="2"/>
    </svg>
  );
}