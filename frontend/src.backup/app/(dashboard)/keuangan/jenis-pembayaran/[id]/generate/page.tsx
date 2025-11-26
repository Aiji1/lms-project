'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import GenerateTagihanModal from '@/components/GenerateTagihanModal';

interface JenisData {
  id_jenis_pembayaran?: number;
  id?: number;
  kode?: string;
  nama_pembayaran?: string;
  tipe_periode?: string;
  tipe_siswa?: string;
  periode_display?: string;
  target_display?: string;
}

export default function GenerateJenisPembayaranPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState<{ id: number; nama: string; tipe_periode: string; tipe_siswa: string; periode_display?: string; target_display?: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const resp = await fetch(`http://localhost:8000/api/v1/jenis-pembayaran/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await resp.json();
        const data: JenisData | undefined = json?.data?.data ?? json?.data;
        if (json?.success && data) {
          const resolvedId = data.id_jenis_pembayaran ?? data.id ?? (data.kode ? Number.isNaN(Number(data.kode)) ? undefined : Number(data.kode) : undefined);
          const nama = data.nama_pembayaran || data.kode || '';
          const tipe_periode = String(data.tipe_periode || 'sekali');
          const tipe_siswa = String(data.tipe_siswa || 'semua');
          setJenis(resolvedId ? { id: resolvedId, nama, tipe_periode, tipe_siswa, periode_display: data.periode_display, target_display: data.target_display } : null);
        } else {
          setError(json?.message || 'Gagal memuat detail jenis pembayaran');
        }
      } catch (e: any) {
        setError(e?.message || 'Gagal memuat detail jenis pembayaran');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleSuccess = () => {
    router.push('/keuangan/tagihan');
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span>/</span>
        <Link href="/keuangan" className="hover:text-blue-600">Keuangan</Link>
        <span>/</span>
        <Link href="/keuangan/jenis-pembayaran" className="hover:text-blue-600">Jenis Pembayaran</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Generate</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Generate Tagihan</h1>
        <Link href="/keuangan/jenis-pembayaran" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Kembali</Link>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {!loading && jenis && (
        <GenerateTagihanModal
          isOpen={open}
          onClose={() => setOpen(false)}
          jenisPembayaran={jenis}
          onSuccess={handleSuccess}
        />
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}

