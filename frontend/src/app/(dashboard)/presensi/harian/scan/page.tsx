'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StudentQRCodeScanner from '@/components/QRCodeScanner';
import StudentNFCReader from '@/components/NFCReader';
import { api } from '@/lib/api';

interface Student {
  nis: string;
  nama_lengkap: string;
  kelas: string;
  jurusan: string;
}

interface AttendanceRecord {
  id: string;
  nis: string;
  tanggal: string;
  status_kehadiran: string;
  metode_presensi: string;
  keterangan?: string;
}

export default function ScanAttendancePage() {
  const router = useRouter();
  const [scanMethod, setScanMethod] = useState<'qrcode' | 'nfc'>('qrcode');
  const [isScanning, setIsScanning] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<'hadir' | 'terlambat' | 'sakit' | 'izin' | 'alpha'>('hadir');

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleScan = async (scannedData: string) => {
    console.log('=== SCAN DEBUG START ===');
    console.log('Raw scanned data:', scannedData);
    console.log('Data type:', typeof scannedData);
    console.log('Data length:', scannedData?.length);
    
    try {
      // Extract barcode from scanned data
      // Expected format: BC4407-2425001_1759197191
      const barcode = scannedData.trim();
      console.log('Processed barcode:', barcode);
      
      if (!barcode) {
        console.log('Empty barcode detected');
        alert('QR code tidak valid');
        return;
      }

      // Fetch student data using barcode
      console.log('Making API request to:', `/v1/siswa/barcode/${barcode}`);
      const studentResponse = await api.get(`/v1/siswa/barcode/${barcode}`);
      console.log('Student API response:', studentResponse.data);

      if (!studentResponse.data.success) {
        console.log('Student not found:', studentResponse.data.message);
        alert('Siswa tidak ditemukan');
        return;
      }

      const student = studentResponse.data.data;
      console.log('Student data:', student);

      // Auto-determine status based on current time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
      const status = currentTime <= '07:30:00' ? 'Hadir' : 'Terlambat';
      console.log('Current time:', currentTime);
      console.log('Determined status:', status);

      // Submit attendance
      const attendanceData = {
        nis: student.nis,
        tanggal: new Date().toISOString().split('T')[0],
        status_kehadiran: status,
        metode_presensi: 'Barcode',
        jam_masuk: currentTime
      };
      
      console.log('Submitting attendance data:', attendanceData);
      const response = await api.post('/v1/presensi-harian', attendanceData);
      console.log('Attendance API response:', response.data);

      if (response.data.success) {
        alert(`Presensi berhasil dicatat untuk ${student.nama_lengkap} (${student.nis})`);
      } else {
        alert('Gagal mencatat presensi: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('=== SCAN ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      alert('Error: ' + (error.response?.data?.message || error.message || 'Terjadi kesalahan'));
    } finally {
      console.log('=== SCAN DEBUG END ===');
    }
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSubmitAttendance = async () => {
    if (!student) return;

    setLoading(true);
    setError('');

    try {
      const attendanceData = {
        nis: student.nis,
        tanggal: getCurrentDate(),
        status_kehadiran: attendanceStatus === 'hadir' || attendanceStatus === 'terlambat' ? 'Hadir' : 'Alpha',
        metode_presensi: scanMethod === 'qrcode' ? 'Barcode' : 'RFID'
      };

      const response = await api.post('/v1/presensi-harian', attendanceData);

      if (response.data.success) {
        setSuccess(`Presensi berhasil dicatat untuk ${student.nama_lengkap}`);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setStudent(null);
          setSuccess('');
          setError('');
        }, 3000);
      } else {
        setError('Gagal menyimpan presensi: ' + response.data.message);
      }
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setError('Error: ' + (err.response?.data?.message || 'Gagal menyimpan presensi'));
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setStudent(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Scan QR Code Presensi Siswa</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {getCurrentDate()} - {getCurrentTime()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Scanner Section */}
        <div className="space-y-4">
          {/* Method Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Pilih Metode Scan</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setScanMethod('qrcode')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  scanMethod === 'qrcode'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 QR Code Scanner
              </button>
              <button
                onClick={() => setScanMethod('nfc')}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  scanMethod === 'nfc'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📱 NFC/RFID
              </button>
            </div>
          </div>

          {/* Scanner Component */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {scanMethod === 'qrcode' ? (
              <StudentQRCodeScanner
                onScan={handleScan}
                onError={handleScanError}
                isActive={isScanning}
                onToggle={() => setIsScanning(!isScanning)}
              />
            ) : (
              <StudentNFCReader
                onScan={handleScan}
                onError={handleScanError}
                isActive={isScanning}
                onToggle={() => setIsScanning(!isScanning)}
              />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-800">Berhasil</span>
              </div>
              <p className="text-sm text-green-700 mt-1 break-words">{success}</p>
            </div>
          )}
        </div>

        {/* Student Info & Attendance Form */}
        <div className="space-y-4">
          {student ? (
            <>
              {/* Student Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Data Siswa
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 text-sm">NIS:</span>
                    <span className="font-medium text-sm sm:text-base">{student.nis}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 text-sm">Nama:</span>
                    <span className="font-medium text-sm sm:text-base break-words">{student.nama_lengkap}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 text-sm">Kelas:</span>
                    <span className="font-medium text-sm sm:text-base">{student.kelas}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-gray-600 text-sm">Jurusan:</span>
                    <span className="font-medium text-sm sm:text-base">{student.jurusan}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Form */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Konfirmasi Presensi
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Kehadiran
                    </label>
                    <select
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value as any)}
                      className="w-full px-3 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hadir">✅ Hadir</option>
                      <option value="terlambat">⏰ Terlambat</option>
                      <option value="sakit">🤒 Sakit</option>
                      <option value="izin">📝 Izin</option>
                      <option value="alpha">❌ Alpha</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={resetScan}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                    >
                      🔄 Reset
                    </button>
                    <button
                      onClick={handleSubmitAttendance}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                    >
                      {loading ? '⏳ Menyimpan...' : '💾 Simpan Presensi'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
              <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Siap untuk Scan
              </h3>
              <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                Pilih metode scan dan mulai scanning untuk mencatat presensi siswa
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}