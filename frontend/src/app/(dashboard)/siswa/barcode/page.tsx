'use client';

import { useEffect, useState } from 'react';
import { QrCode, RefreshCw, User, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface StudentBarcode {
  nis: string;
  nama_lengkap: string;
  barcode: string;
  barcode_generated_at: string;
  rfid_code?: string;
  rfid_assigned_at?: string;
}

export default function StudentBarcodePage() {
  const [barcodeData, setBarcodeData] = useState<StudentBarcode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, userRole, isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('=== BARCODE PAGE DEBUG ===');
    console.log('userRole:', userRole);
    console.log('authState:', { isAuthenticated, userRole, user });
    console.log('localStorage token:', localStorage.getItem('token'));
    console.log('localStorage user:', localStorage.getItem('user'));
    
    // Wait for auth to finish loading before checking
    if (isLoading) {
      console.log('Auth is still loading, waiting...');
      return;
    }

    // Only redirect if we're sure the user is not a student
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    if (userRole && userRole !== 'Siswa') {
      console.log('User is not a student, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // Only fetch if user is authenticated and is a student
    if (isAuthenticated && userRole === 'Siswa') {
      console.log('User is a student, fetching barcode data');
      fetchStudentBarcode();
    }
  }, [isLoading, isAuthenticated, userRole, router]);

  const fetchStudentBarcode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/v1/my-barcode');
      console.log('Barcode API response:', response.data);
      
      if (response.data.success) {
        setBarcodeData(response.data.data);
      } else {
        setError(response.data.message || 'Gagal mengambil data barcode');
      }
    } catch (error: any) {
      console.error('Error fetching student barcode:', error);
      setError(error.response?.data?.message || 'Terjadi kesalahan saat mengambil data barcode');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data barcode...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStudentBarcode}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="h-6 w-6 text-blue-600" />
              QR Code Presensi
            </h1>
            <p className="text-gray-600 mt-1">
              Tunjukkan QR code ini kepada guru piket untuk presensi
            </p>
          </div>
          <button
            onClick={fetchStudentBarcode}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {barcodeData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Informasi Siswa
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <p className="text-lg font-medium text-gray-900">{barcodeData.nama_lengkap}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIS
                </label>
                <p className="text-gray-900">{barcodeData.nis}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barcode Generated
                </label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {formatDate(barcodeData.barcode_generated_at)}
                </p>
              </div>

              {barcodeData.rfid_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFID Code
                  </label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    {barcodeData.rfid_code}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Barcode Display */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Barcode Anda
            </h2>
            
            <div className="text-center">
              {/* QR Code Display */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-4 inline-block">
                <QRCodeDisplay 
                  value={barcodeData.barcode} 
                  size={250}
                  className="mb-4"
                />
                <div className="text-lg font-mono font-bold text-gray-900 mb-2 break-all">
                  {barcodeData.barcode}
                </div>
                <p className="text-sm text-gray-600">
                  Scan QR code atau tunjukkan kode untuk presensi
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Cara Menggunakan:
                </h3>
                <ul className="text-sm text-blue-700 text-left space-y-1">
                  <li>• Tunjukkan QR code ini kepada guru piket</li>
                  <li>• Pastikan QR code dapat di-scan dengan jelas</li>
                  <li>• Atau tunjukkan kode angka di bawah QR code</li>
                  <li>• QR code ini unik untuk Anda</li>
                  <li>• Jangan bagikan kode ini kepada orang lain</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-900">Penting!</h3>
            <p className="text-sm text-yellow-700 mt-1">
              QR code ini adalah identitas unik Anda untuk sistem presensi. 
              Jaga kerahasiaan kode ini dan jangan memberikannya kepada orang lain. 
              Jika ada masalah dengan QR code, segera hubungi admin sekolah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}