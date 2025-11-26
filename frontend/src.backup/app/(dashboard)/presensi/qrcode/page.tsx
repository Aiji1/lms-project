'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Search, 
  Filter,
  Check,
  X,
  Loader2,
  Eye,
  Trash2,
  PrinterIcon
} from 'lucide-react';
import { api } from '@/lib/api';
import { 
  generateQRCode, 
  generateAllQRCodes, 
  getQRCodeInfo,
  deleteQRCode,
  getQRCodeDisplayUrl,
  getQRCodeDownloadUrl,
  QRCodeInfo 
} from '@/lib/qrcode';

interface Student {
  nis: string;
  nama_lengkap: string;
  kelas: string;
  jurusan: string;
  qr_status?: 'exists' | 'missing' | 'generating';
}

export default function QRCodeManagementPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'exists' | 'missing'>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [qrCodeInfo, setQrCodeInfo] = useState<QRCodeInfo | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch students
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.qr_status === filterStatus);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, filterStatus, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/siswa');
      const studentData = response.data.data || response.data;
      
      // Check QR status for each student
      const studentsWithStatus = await Promise.all(
        studentData.map(async (student: any) => {
          try {
            const qrInfo = await getQRCodeInfo(student.nis);
            return {
              ...student,
              qr_status: qrInfo.data?.qr_code_exists ? 'exists' : 'missing'
            };
          } catch {
            return { ...student, qr_status: 'missing' };
          }
        })
      );

      setStudents(studentsWithStatus);
      setFilteredStudents(studentsWithStatus);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!confirm('Generate QR Code untuk semua siswa? Proses ini bisa memakan waktu beberapa menit.')) {
      return;
    }

    try {
      setGenerating(true);
      const result = await generateAllQRCodes(false);
      
      if (result.success) {
        alert(`Berhasil: ${result.data?.success} siswa\nGagal: ${result.data?.failed} siswa\nSudah ada: ${result.data?.skipped} siswa`);
        fetchStudents(); // Refresh list
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSingle = async (nis: string) => {
    try {
      const student = students.find(s => s.nis === nis);
      if (student) {
        setStudents(prev => prev.map(s => 
          s.nis === nis ? { ...s, qr_status: 'generating' } : s
        ));
      }

      const result = await generateQRCode(nis, false);
      
      if (result.success) {
        setStudents(prev => prev.map(s => 
          s.nis === nis ? { ...s, qr_status: 'exists' } : s
        ));
      } else {
        alert('Error: ' + result.message);
        setStudents(prev => prev.map(s => 
          s.nis === nis ? { ...s, qr_status: 'missing' } : s
        ));
      }
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewQRCode = async (student: Student) => {
    try {
      const info = await getQRCodeInfo(student.nis);
      if (info.success && info.data) {
        setQrCodeInfo(info.data);
        setSelectedStudent(student);
        setShowModal(true);
      }
    } catch (error) {
      alert('Error loading QR Code');
    }
  };

  const handleDeleteQRCode = async (nis: string) => {
    if (!confirm('Hapus QR Code ini?')) return;

    try {
      const result = await deleteQRCode(nis);
      if (result.success) {
        alert('QR Code berhasil dihapus');
        fetchStudents();
      }
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const stats = {
    total: students.length,
    exists: students.filter(s => s.qr_status === 'exists').length,
    missing: students.filter(s => s.qr_status === 'missing').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen QR Code Siswa</h1>
          <p className="text-gray-600">Generate dan kelola QR Code untuk presensi siswa</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Siswa</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <QrCode className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">QR Code Tersedia</p>
                <p className="text-3xl font-bold text-green-600">{stats.exists}</p>
              </div>
              <Check className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Belum Ada QR Code</p>
                <p className="text-3xl font-bold text-orange-600">{stats.missing}</p>
              </div>
              <X className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Generate Semua</span>
                  </>
                )}
              </button>
              <button
                onClick={fetchStudents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari NIS, nama, kelas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua</option>
                <option value="exists">Sudah Ada QR</option>
                <option value="missing">Belum Ada QR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status QR</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.nis} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.nis}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.nama_lengkap}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.kelas}</td>
                    <td className="px-6 py-4">
                      {student.qr_status === 'generating' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating
                        </span>
                      ) : student.qr_status === 'exists' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          <Check className="w-3 h-3" />
                          Tersedia
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                          <X className="w-3 h-3" />
                          Belum Ada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex gap-2 justify-end">
                        {student.qr_status === 'exists' ? (
                          <>
                            <button
                              onClick={() => handleViewQRCode(student)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Lihat QR Code"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateSingle(student.nis)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQRCode(student.nis)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerateSingle(student.nis)}
                            disabled={student.qr_status === 'generating'}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                          >
                            Generate
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

      {/* QR Code Modal */}
      {showModal && selectedStudent && qrCodeInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">QR Code - {selectedStudent.nama_lengkap}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                {qrCodeInfo.qr_code_url && (
                  <img
                    src={getQRCodeDisplayUrl(qrCodeInfo.qr_code_url) || ''}
                    alt={`QR Code ${selectedStudent.nis}`}
                    className="w-64 h-64"
                  />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">NIS:</span> {qrCodeInfo.nis}</p>
                <p><span className="font-medium">Nama:</span> {qrCodeInfo.nama_lengkap}</p>
                <p><span className="font-medium">Kelas:</span> {qrCodeInfo.kelas}</p>
                <p><span className="font-medium">Jurusan:</span> {qrCodeInfo.jurusan}</p>
              </div>
              
              <div className="flex gap-2">
                <a
                  href={getQRCodeDownloadUrl(selectedStudent.nis)}
                  download
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}