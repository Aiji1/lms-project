'use client';

import { useState } from 'react';
import { X, CreditCard, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tagihan: {
    id_tagihan: number;
    nominal_tagihan: string;
    jenis_pembayaran: string;
    bulan_tagihan: string | null;
    tahun_tagihan: string;
  };
  sisaBayar: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  tagihan,
  sisaBayar
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    jumlah_bayar: sisaBayar.toString(),
    tanggal_bayar: new Date().toISOString().split('T')[0],
    metode_pembayaran: 'Tunai',
    no_referensi: '',
    keterangan_cicilan: ''
  });

  const metodePembayaran = [
    { value: 'Tunai', label: 'Tunai' },
    { value: 'Transfer', label: 'Transfer Bank' },
    { value: 'Kartu', label: 'Kartu Debit/Kredit' },
    { value: 'E-wallet', label: 'E-Wallet (OVO/DANA/dll)' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const jumlahBayar = parseFloat(formData.jumlah_bayar);
    if (isNaN(jumlahBayar) || jumlahBayar <= 0) {
      setError('Jumlah bayar harus lebih dari 0');
      return;
    }
    
    if (jumlahBayar > sisaBayar) {
      setError(`Jumlah bayar tidak boleh lebih dari sisa tagihan (${formatCurrency(sisaBayar)})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/tagihan/${tagihan.id_tagihan}/konfirmasi-pembayaran`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          jumlah_bayar: sisaBayar.toString(),
          tanggal_bayar: new Date().toISOString().split('T')[0],
          metode_pembayaran: 'Tunai',
          no_referensi: '',
          keterangan_cicilan: ''
        });
      } else {
        setError(result.message || 'Gagal mengkonfirmasi pembayaran');
      }
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const setFullPayment = () => {
    setFormData(prev => ({ ...prev, jumlah_bayar: sisaBayar.toString() }));
  };

  const setPartialPayment = (percentage: number) => {
    const amount = Math.floor(sisaBayar * (percentage / 100));
    setFormData(prev => ({ ...prev, jumlah_bayar: amount.toString() }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Konfirmasi Pembayaran
                </h3>
                <p className="text-sm text-gray-600">
                  {tagihan.jenis_pembayaran} - {tagihan.bulan_tagihan ? `${tagihan.bulan_tagihan}/` : ''}{tagihan.tahun_tagihan}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 font-medium">Total Tagihan</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(tagihan.nominal_tagihan)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 font-medium">Sisa Tagihan</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(sisaBayar)}
                  </p>
                </div>
              </div>
            </div>

            {/* Jumlah Bayar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Bayar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  name="jumlah_bayar"
                  value={formData.jumlah_bayar}
                  onChange={handleChange}
                  min="0"
                  max={sisaBayar}
                  step="1000"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan jumlah pembayaran"
                />
              </div>
              
              {/* Quick Buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={setFullPayment}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Bayar Penuh
                </button>
                <button
                  type="button"
                  onClick={() => setPartialPayment(50)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setPartialPayment(25)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  25%
                </button>
              </div>
            </div>

            {/* Tanggal Bayar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pembayaran <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="tanggal_bayar"
                  value={formData.tanggal_bayar}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran <span className="text-red-500">*</span>
              </label>
              <select
                name="metode_pembayaran"
                value={formData.metode_pembayaran}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {metodePembayaran.map((metode) => (
                  <option key={metode.value} value={metode.value}>
                    {metode.label}
                  </option>
                ))}
              </select>
            </div>

            {/* No Referensi */}
            {(formData.metode_pembayaran === 'Transfer' || formData.metode_pembayaran === 'E-wallet') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Referensi / No. Transaksi
                </label>
                <input
                  type="text"
                  name="no_referensi"
                  value={formData.no_referensi}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: TRX123456789"
                />
              </div>
            )}

            {/* Keterangan Cicilan */}
            {parseFloat(formData.jumlah_bayar) < sisaBayar && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Cicilan
                </label>
                <textarea
                  name="keterangan_cicilan"
                  value={formData.keterangan_cicilan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Contoh: Cicilan pertama dari 3x"
                />
              </div>
            )}

            {/* Preview Sisa */}
            {parseFloat(formData.jumlah_bayar) > 0 && parseFloat(formData.jumlah_bayar) < sisaBayar && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Sisa setelah pembayaran:</span>{' '}
                  {formatCurrency(sisaBayar - parseFloat(formData.jumlah_bayar))}
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Konfirmasi Pembayaran
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}