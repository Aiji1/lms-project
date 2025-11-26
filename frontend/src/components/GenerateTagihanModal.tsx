'use client';

import { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface GenerateTagihanModalProps {
  isOpen: boolean;
  onClose: () => void;
  jenisPembayaran: {
    id: number;
    nama: string;
    tipe_periode: string;
    tipe_siswa: string;
    periode_display?: string;
    target_display?: string;
  } | null;
  onSuccess: () => void;
}

export default function GenerateTagihanModal({
  isOpen,
  onClose,
  jenisPembayaran,
  onSuccess
}: GenerateTagihanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    tanggal_jatuh_tempo: ''
  });

  const bulanOptions = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jenisPembayaran) return;
    
    console.log('Jenis Pembayaran:', jenisPembayaran);
    console.log('ID to use:', jenisPembayaran.id);
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        const token = localStorage.getItem('token');
      
      const payload: any = {
        tahun: formData.tahun,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo
      };

      // Hanya kirim bulan jika bukan tipe sekali
      if (jenisPembayaran.tipe_periode !== 'sekali') {
        payload.bulan = formData.bulan;
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/jenis-pembayaran/${jenisPembayaran.id}/generate-tagihan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Tagihan berhasil di-generate!');
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset form
          setFormData({
            bulan: new Date().getMonth() + 1,
            tahun: new Date().getFullYear(),
            tanggal_jatuh_tempo: ''
          });
          setSuccess('');
        }, 2000);
      } else {
        setError(data.message || 'Gagal generate tagihan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate tagihan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !jenisPembayaran) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-[70]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Generate Tagihan
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Jenis Pembayaran */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">
              {jenisPembayaran.nama}
            </h4>
            <div className="space-y-1 text-sm text-blue-700">
              <p>• Tipe: {jenisPembayaran.periode_display}</p>
              <p>• Target: {jenisPembayaran.target_display}</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bulan - hanya tampil jika bukan sekali bayar */}
            {jenisPembayaran.tipe_periode !== 'sekali' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan Tagihan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.bulan}
                  onChange={(e) => setFormData({ ...formData, bulan: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {bulanOptions.map((bulan) => (
                    <option key={bulan.value} value={bulan.value}>
                      {bulan.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tahun */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahun <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="2020"
                max="2099"
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Tanggal Jatuh Tempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Jatuh Tempo <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggal_jatuh_tempo}
                onChange={(e) => setFormData({ ...formData, tanggal_jatuh_tempo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Warning untuk generate ulang */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                <strong>Catatan:</strong> Tagihan yang sudah ada untuk periode ini tidak akan di-generate ulang.
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Generate Tagihan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}