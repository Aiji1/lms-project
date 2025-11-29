'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  GraduationCap,
  Users,
  QrCode,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getUserPermission, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, DEFAULT_PERMISSIONS, UserRole } from '@/types/permissions';

interface SiswaDetail {
  nis: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat?: string;
  nama_kelas?: string;
  nama_jurusan?: string;
  rombel?: string;
  status: 'Aktif' | 'Non-aktif' | 'Lulus';
  asal_sekolah?: string;
  golongan_darah?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  no_hp?: string;
  alamat_orang_tua?: string;
  pekerjaan_ayah?: string;
  pekerjaan_ibu?: string;
  barcode?: string;
  rfid_code?: string;
  barcode_generated_at?: string;
  rfid_assigned_at?: string;
}

export default function DetailSiswaPage() {
  const { user } = useAuth();
  const params = useParams();
  const nis = params.nis as string;
  
  // Permission configuration for Detail Siswa
  const detailSiswaPermissions = createPermissionForRoles({
    'Admin': FULL_PERMISSIONS,
    'Kepala_Sekolah': READ_ONLY_PERMISSIONS,
    'Guru': READ_ONLY_PERMISSIONS,
    'Siswa': DEFAULT_PERMISSIONS,
    'Petugas_Keuangan': DEFAULT_PERMISSIONS,
    'Orang_Tua': DEFAULT_PERMISSIONS
  });
  
  const userPermissions = getUserPermission(user?.user_type as UserRole || 'Siswa', detailSiswaPermissions);

  const [siswa, setSiswa] = useState<SiswaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [rfidLoading, setRfidLoading] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);
  const [rfidInput, setRfidInput] = useState('');

  useEffect(() => {
    if (nis) {
      fetchSiswaDetail();
    }
  }, [nis]);

  const fetchSiswaDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/siswa/${nis}`);
      if (response.data.success) {
        setSiswa(response.data.data);
      } else {
        setError('Data siswa tidak ditemukan');
      }
    } catch (err) {
      setError('Error loading data siswa');
      console.error('Error fetching siswa detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

    try {
      const response = await api.delete(`/siswa/${nis}`);
      if (response.data.success) {
        alert('Data siswa berhasil dihapus');
        window.location.href = '/admin/siswa';
      }
    } catch (error) {
      alert('Error menghapus data siswa');
      console.error('Error deleting siswa:', error);
    }
  };

  const handleGenerateBarcode = async () => {
    setBarcodeLoading(true);
    try {
      const response = await api.post(`/siswa/${nis}/generate-barcode`);
      if (response.data.success) {
        alert('Barcode berhasil di-generate!');
        fetchSiswaDetail(); // Refresh data
      }
    } catch (error) {
      alert('Error generating barcode');
      console.error('Error generating barcode:', error);
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleAssignRfid = async () => {
    if (!rfidInput.trim()) {
      alert('Masukkan kode RFID terlebih dahulu');
      return;
    }

    setRfidLoading(true);
    try {
      const response = await api.post(`/siswa/${nis}/assign-rfid`, {
        rfid_code: rfidInput.trim()
      });
      if (response.data.success) {
        alert('RFID berhasil di-assign!');
        setShowRfidModal(false);
        setRfidInput('');
        fetchSiswaDetail(); // Refresh data
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error assigning RFID';
      alert(errorMessage);
      console.error('Error assigning RFID:', error);
    } finally {
      setRfidLoading(false);
    }
  };

  const handleRemoveRfid = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus RFID ini?')) return;

    setRfidLoading(true);
    try {
      const response = await api.delete(`/siswa/${nis}/remove-rfid`);
      if (response.data.success) {
        alert('RFID berhasil dihapus!');
        fetchSiswaDetail(); // Refresh data
      }
    } catch (error) {
      alert('Error removing RFID');
      console.error('Error removing RFID:', error);
    } finally {
      setRfidLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data siswa...</p>
        </div>
      </div>
    );
  }

  if (error || !siswa) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/siswa"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/siswa"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Siswa</h1>
              <p className="text-gray-600 mt-1">
                Informasi lengkap data siswa
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {userPermissions.edit && (
              <Link
                href={`/admin/siswa/${nis}/edit`}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Edit size={20} className="mr-2" />
                Edit
              </Link>
            )}
            {userPermissions.delete && (
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 size={20} className="mr-2" />
                Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={40} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {siswa.nama_lengkap}
            </h2>
            <p className="text-gray-600 mb-2">NIS: {siswa.nis}</p>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              siswa.status === 'Aktif' 
                ? 'bg-green-100 text-green-800'
                : siswa.status === 'Lulus'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {siswa.status}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center text-gray-600">
              <Calendar size={16} className="mr-3" />
              <div>
                <p className="text-sm">Tanggal Lahir</p>
                <p className="font-medium text-gray-900">
                  {formatDate(siswa.tanggal_lahir)} ({calculateAge(siswa.tanggal_lahir)} tahun)
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600">
              <User size={16} className="mr-3" />
              <div>
                <p className="text-sm">Jenis Kelamin</p>
                <p className="font-medium text-gray-900">
                  {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>
            </div>

            {siswa.golongan_darah && (
              <div className="flex items-center text-gray-600">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm">Golongan Darah</p>
                  <p className="font-medium text-gray-900">{siswa.golongan_darah}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Akademik */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <GraduationCap size={20} className="text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Data Akademik</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Kelas</p>
                <p className="font-medium text-gray-900">
                  {siswa.nama_kelas || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jurusan</p>
                <p className="font-medium text-gray-900">
                  {siswa.nama_jurusan || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rombel</p>
                <p className="font-medium text-gray-900">
                  {siswa.rombel || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Asal Sekolah</p>
                <p className="font-medium text-gray-900">
                  {siswa.asal_sekolah || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Data Pribadi */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <MapPin size={20} className="text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Alamat</h3>
            </div>
            <p className="text-gray-900">
              {siswa.alamat || 'Alamat tidak tersedia'}
            </p>
          </div>

          {/* Data Orang Tua */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <Users size={20} className="text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Data Orang Tua</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Nama Ayah</p>
                  <p className="font-medium text-gray-900">
                    {siswa.nama_ayah || '-'}
                  </p>
                </div>
                {siswa.pekerjaan_ayah && (
                  <div>
                    <p className="text-sm text-gray-500">Pekerjaan Ayah</p>
                    <p className="font-medium text-gray-900">{siswa.pekerjaan_ayah}</p>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Nama Ibu</p>
                  <p className="font-medium text-gray-900">
                    {siswa.nama_ibu || '-'}
                  </p>
                </div>
                {siswa.pekerjaan_ibu && (
                  <div>
                    <p className="text-sm text-gray-500">Pekerjaan Ibu</p>
                    <p className="font-medium text-gray-900">{siswa.pekerjaan_ibu}</p>
                  </div>
                )}
              </div>
            </div>
            
            {siswa.no_hp && (
              <div className="mt-4 flex items-center text-gray-600">
                <Phone size={16} className="mr-3" />
                <div>
                  <p className="text-sm">Nomor HP</p>
                  <p className="font-medium text-gray-900">{siswa.no_hp}</p>
                </div>
              </div>
            )}

            {siswa.alamat_orang_tua && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Alamat Orang Tua</p>
                <p className="text-gray-900">{siswa.alamat_orang_tua}</p>
              </div>
            )}
          </div>

          {/* Barcode & RFID Management */}
          {userPermissions.edit && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <QrCode size={20} className="text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Barcode & RFID</h3>
              </div>
              
              {/* Barcode Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">Barcode</p>
                    <p className="font-medium text-gray-900">
                      {siswa.barcode || 'Belum di-generate'}
                    </p>
                    {siswa.barcode_generated_at && (
                      <p className="text-xs text-gray-400">
                        Generated: {formatDate(siswa.barcode_generated_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleGenerateBarcode}
                    disabled={barcodeLoading}
                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {barcodeLoading ? (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                    ) : (
                      <QrCode size={16} className="mr-2" />
                    )}
                    {siswa.barcode ? 'Re-generate' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* RFID Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">RFID Code</p>
                    <p className="font-medium text-gray-900">
                      {siswa.rfid_code || 'Belum di-assign'}
                    </p>
                    {siswa.rfid_assigned_at && (
                      <p className="text-xs text-gray-400">
                        Assigned: {formatDate(siswa.rfid_assigned_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {siswa.rfid_code ? (
                      <button
                        onClick={handleRemoveRfid}
                        disabled={rfidLoading}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {rfidLoading ? (
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Trash2 size={16} className="mr-2" />
                        )}
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRfidModal(true)}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CreditCard size={16} className="mr-2" />
                        Assign RFID
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RFID Modal */}
      {showRfidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign RFID Code</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFID Code
              </label>
              <input
                type="text"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                placeholder="Masukkan kode RFID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRfidModal(false);
                  setRfidInput('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleAssignRfid}
                disabled={rfidLoading || !rfidInput.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {rfidLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}