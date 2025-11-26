'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRScannerComponent from '../../../../components/presensi/QRScannerComponent';
import { Camera, User, Clock, MapPin, CheckCircle, XCircle, Loader2, Video, VideoOff } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ScanResult {
  success: boolean;
  message: string;
  data?: {
    presensi: {
      id_presensi_harian: number;
      nis: string;
      nama_lengkap: string;
      nama_kelas: string;
      tanggal: string;
      jam_masuk?: string;
      jam_pulang?: string;
      status: string;
    };
    info?: {
      status: string;
      is_late: boolean;
      selisih_waktu?: string;
      durasi?: {
        jam: number;
        menit: number;
      };
    };
  };
}

export default function ScannerPage() {
  const router = useRouter();
  const [scanType, setScanType] = useState<'masuk' | 'pulang'>('masuk');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualNIS, setManualNIS] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false); // ✅ Camera state
  
  // ✅ Navigation guard to prevent transition errors
  const isNavigating = useRef(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // ✅ Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Get user location
  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          resolve(loc);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Use default location if GPS fails
          const defaultLoc = { lat: -7.556410, lng: 110.828316 };
          setLocation(defaultLoc);
          resolve(defaultLoc);
        }
      );
    });
  };

  // Handle scan success
  const handleScanSuccess = async (nis: string) => {
    if (isProcessing || isNavigating.current) return;

    setIsProcessing(true);
    setScanResult(null);

    try {
      // Get location
      const loc = await getLocation();

      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Call API
      const endpoint = scanType === 'masuk' 
        ? `${API_URL}/presensi-harian/scan-masuk`
        : `${API_URL}/presensi-harian/scan-pulang`;

      const response = await axios.post(
        endpoint,
        {
          nis,
          metode: 'qrcode',
          lat: loc.lat,
          lng: loc.lng,
          device_info: navigator.userAgent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setScanResult(response.data);

      // Auto clear after 5 seconds
      const timeout = setTimeout(() => {
        setScanResult(null);
      }, 5000);
      timeoutRefs.current.push(timeout);

    } catch (error: any) {
      console.error('Scan error:', error);
      setScanResult({
        success: false,
        message: error.response?.data?.message || 'Terjadi kesalahan saat memproses presensi',
      });

      // Auto clear error after 5 seconds
      const timeout = setTimeout(() => {
        setScanResult(null);
      }, 5000);
      timeoutRefs.current.push(timeout);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualNIS.trim() && !isNavigating.current) {
      handleScanSuccess(manualNIS.trim());
      setManualNIS('');
    }
  };

  // ✅ Handle camera toggle
  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner Presensi</h1>
          <p className="text-gray-600">Scan QR Code untuk presensi masuk atau pulang</p>
        </div>

        {/* Scan Type Toggle */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setScanType('masuk')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                scanType === 'masuk'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                <span>Scan Masuk</span>
              </div>
            </button>
            <button
              onClick={() => setScanType('pulang')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                scanType === 'pulang'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                <span>Scan Pulang</span>
              </div>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Scan QR Code</h2>
              {/* ✅ Camera Toggle Button */}
              <button
                onClick={toggleCamera}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCameraActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <VideoOff className="w-4 h-4" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>
            
            {isCameraActive ? (
              <QRScannerComponent
                onScanSuccess={handleScanSuccess}
                isScanning={!isProcessing}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Kamera Tidak Aktif</p>
                  <p className="text-sm">Klik tombol "Start" untuk mengaktifkan kamera</p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Input & Result */}
          <div className="space-y-6">
            {/* Manual Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Input Manual</h2>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIS Siswa
                  </label>
                  <input
                    type="text"
                    value={manualNIS}
                    onChange={(e) => setManualNIS(e.target.value)}
                    placeholder="Contoh: 4407-2425001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !manualNIS.trim()}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Location Info */}
            {location && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lokasi Saat Ini
                </h3>
                <p className="text-sm text-gray-600">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div
                className={`rounded-lg shadow p-6 ${
                  scanResult.success
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-red-50 border-2 border-red-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${
                      scanResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {scanResult.message}
                    </h3>
                    
                    {scanResult.success && scanResult.data && (
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Nama:</span>{' '}
                          {scanResult.data.presensi.nama_lengkap}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">NIS:</span>{' '}
                          {scanResult.data.presensi.nis}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Kelas:</span>{' '}
                          {scanResult.data.presensi.nama_kelas}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Waktu:</span>{' '}
                          {scanResult.data.presensi.jam_masuk || scanResult.data.presensi.jam_pulang}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Status:</span>{' '}
                          <span className="capitalize">{scanResult.data.presensi.status}</span>
                        </p>
                        
                        {scanResult.data.info?.is_late && (
                          <p className="text-orange-600 font-medium">
                            ⚠️ Terlambat: {scanResult.data.info.selisih_waktu}
                          </p>
                        )}
                        
                        {scanResult.data.info?.durasi && (
                          <p className="text-gray-700">
                            <span className="font-medium">Durasi:</span>{' '}
                            {scanResult.data.info.durasi.jam} jam {scanResult.data.info.durasi.menit} menit
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium">Memproses presensi...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}