'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentModal from '@/components/PaymentModal';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  FileText,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface TagihanDetail {
  tagihan: {
    id_tagihan: number;
    nis: string;
    id_jenis_pembayaran: number;
    jenis_pembayaran: string;
    deskripsi_jenis: string;
    bulan_tagihan: string | null;
    tahun_tagihan: string;
    nominal_tagihan: string;
    tanggal_jatuh_tempo: string;
    status_tagihan: string;
    tahun_ajaran: string;
    keterangan: string | null;
    created_at: string;
  };
  siswa?: {
    nama_lengkap?: string;
    nis?: string;
    jenis_kelamin?: string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    nama_kelas?: string;
    nama_jurusan?: string;
  };
  pembayaran: Array<{
    id_pembayaran: number;
    tanggal_bayar: string;
    jumlah_bayar: string;
    metode_pembayaran: string;
    status_pembayaran: string;
    no_referensi: string | null;
    keterangan_cicilan: string | null;
  }>;
}

export default function DetailTagihanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TagihanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/v1/tagihan/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Gagal memuat detail tagihan');
      }
    } catch (err: any) {
      console.error('Error fetching detail:', err);
      setError('Gagal memuat detail tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      'Lunas': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-5 h-5" />,
        label: 'Lunas'
      },
      'Belum_Bayar': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="w-5 h-5" />,
        label: 'Belum Bayar'
      },
      'Cicilan': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <DollarSign className="w-5 h-5" />,
        label: 'Cicilan'
      },
      'Overdue': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle className="w-5 h-5" />,
        label: 'Terlambat'
      }
    };

    const config = configs[status] || configs['Belum_Bayar'];

    return (
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${config.bg} ${config.text}`}>
        {config.icon}
        <span className="font-semibold">{config.label}</span>
      </div>
    );
  };

  const getBulanName = (bulan: string | null) => {
    if (!bulan) return '-';
    const bulanNames: any = {
      '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
      '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
      '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    return bulanNames[bulan] || bulan;
  };

  const getTotalTerbayar = () => {
    if (!data?.pembayaran) return 0;
    return data.pembayaran
      .filter(p => p.status_pembayaran === 'Success')
      .reduce((sum, p) => sum + parseFloat(p.jumlah_bayar), 0);
  };

  const getSisaTagihan = () => {
    if (!data) return 0;
    const total = parseFloat(data.tagihan.nominal_tagihan);
    const terbayar = getTotalTerbayar();
    return total - terbayar;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error || 'Data tidak ditemukan'}
        </div>
        <Link
          href="/keuangan/tagihan"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Tagihan
        </Link>
      </div>
    );
  }

  const { tagihan, siswa, pembayaran } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/keuangan/tagihan"
          className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Tagihan
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Tagihan</h1>
            <p className="text-gray-600 mt-1">
              {tagihan.jenis_pembayaran} - {getBulanName(tagihan.bulan_tagihan)} {tagihan.tahun_tagihan}
            </p>
          </div>

          <div className="flex space-x-3">
            <Link
              href={`/keuangan/tagihan/${id}/edit`}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
            {tagihan.status_tagihan !== 'Lunas' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Konfirmasi Pembayaran
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Status Tagihan</h2>
              {getStatusBadge(tagihan.status_tagihan)}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tagihan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(tagihan.nominal_tagihan)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Terbayar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(getTotalTerbayar())}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Sisa Tagihan</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(getSisaTagihan())}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Jatuh Tempo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(tagihan.tanggal_jatuh_tempo)}
                </p>
              </div>
            </div>

            {tagihan.keterangan && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Keterangan</p>
                <p className="text-sm text-gray-900">{tagihan.keterangan}</p>
              </div>
            )}
          </div>

          {/* Info Tagihan */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Tagihan</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Jenis Pembayaran</p>
                  <p className="text-sm font-medium text-gray-900">{tagihan.jenis_pembayaran}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Periode</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getBulanName(tagihan.bulan_tagihan)} {tagihan.tahun_tagihan}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tahun Ajaran</p>
                  <p className="text-sm font-medium text-gray-900">{tagihan.tahun_ajaran}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Dibuat</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(tagihan.created_at)}
                  </p>
                </div>
              </div>

              {tagihan.deskripsi_jenis && (
                <div>
                  <p className="text-sm text-gray-600">Deskripsi</p>
                  <p className="text-sm text-gray-700">{tagihan.deskripsi_jenis}</p>
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Pembayaran */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Pembayaran</h2>
            
            {pembayaran.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Belum ada riwayat pembayaran</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pembayaran.map((p) => (
                  <div
                    key={p.id_pembayaran}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(p.jumlah_bayar)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(p.tanggal_bayar)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.status_pembayaran === 'Success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.status_pembayaran}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Metode: </span>
                        <span className="text-gray-900">{p.metode_pembayaran}</span>
                      </div>
                      {p.no_referensi && (
                        <div>
                          <span className="text-gray-600">No. Ref: </span>
                          <span className="text-gray-900">{p.no_referensi}</span>
                        </div>
                      )}
                    </div>

                    {p.keterangan_cicilan && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Keterangan: </span>
                        {p.keterangan_cicilan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Student Info */}
        <div className="space-y-6">
          {/* Info Siswa */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informasi Siswa
            </h2>
            
            {siswa?.nama_lengkap ? (
              <>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama Lengkap</p>
                    <p className="font-medium text-gray-900">{siswa.nama_lengkap}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">NIS</p>
                    <p className="font-medium text-gray-900">{siswa.nis || tagihan.nis}</p>
                  </div>
                  
                  {(siswa.nama_kelas || siswa.nama_jurusan) && (
                    <div>
                      <p className="text-sm text-gray-600">Kelas</p>
                      <p className="font-medium text-gray-900">
                        {siswa.nama_kelas && siswa.nama_jurusan 
                          ? `${siswa.nama_kelas} - ${siswa.nama_jurusan}`
                          : siswa.nama_kelas || siswa.nama_jurusan || '-'
                        }
                      </p>
                    </div>
                  )}
                  
                  {siswa.jenis_kelamin && (
                    <div>
                      <p className="text-sm text-gray-600">Jenis Kelamin</p>
                      <p className="font-medium text-gray-900">
                        {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : siswa.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </p>
                    </div>
                  )}
                  
                  {siswa.tempat_lahir && siswa.tanggal_lahir && (
                    <div>
                      <p className="text-sm text-gray-600">Tempat, Tanggal Lahir</p>
                      <p className="font-medium text-gray-900">
                        {siswa.tempat_lahir}, {formatDate(siswa.tanggal_lahir)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <Link
                    href={`/siswa/${siswa.nis}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Lihat Profil Lengkap →
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Data siswa tidak ditemukan</p>
                <p className="text-xs mt-1 text-gray-400">NIS: {tagihan.nis}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Aksi Cepat</h3>
            <div className="space-y-2">
              <Link
                href={`/keuangan/tagihan?search=${tagihan.nis}`}
                className="block text-sm text-blue-700 hover:text-blue-800"
              >
                • Lihat semua tagihan siswa ini
              </Link>
              <Link
                href="/keuangan/pembayaran"
                className="block text-sm text-blue-700 hover:text-blue-800"
              >
                • Riwayat pembayaran lengkap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {data && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            fetchDetail(); // Refresh data
          }}
          tagihan={data.tagihan}
          sisaBayar={getSisaTagihan()}
        />
      )}
    </div>
  );
}