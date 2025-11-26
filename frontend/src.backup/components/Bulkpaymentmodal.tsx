'use client';

import { useState } from 'react';
import { X, CreditCard, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkPaymentItem {
  id_tagihan: number;
  siswa_nama: string;
  jenis_pembayaran: string;
  nominal_tagihan: number;
  sisa_bayar: number;
  bulan_tahun: string;
}

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: BulkPaymentItem[];
}

export default function BulkPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  items
}: BulkPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'custom'>('full');
  
  const [formData, setFormData] = useState({
    tanggal_bayar: new Date().toISOString().split('T')[0],
    metode_pembayaran: 'Tunai',
    no_referensi: '',
    keterangan: ''
  });

  // Custom amounts per tagihan
  const [customAmounts, setCustomAmounts] = useState<{[key: number]: string}>({});

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

  const handleCustomAmountChange = (idTagihan: number, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [idTagihan]: value }));
  };

  const getTotalToBePaid = () => {
    if (paymentMode === 'full') {
      return items.reduce((sum, item) => sum + item.sisa_bayar, 0);
    } else {
      return items.reduce((sum, item) => {
        const customAmount = parseFloat(customAmounts[item.id_tagihan] || '0');
        return sum + customAmount;
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Process each payment
      const promises = items.map(async (item) => {
        const jumlahBayar = paymentMode === 'full' 
          ? item.sisa_bayar 
          : parseFloat(customAmounts[item.id_tagihan] || '0');

        if (jumlahBayar <= 0) {
          throw new Error(`Jumlah bayar untuk ${item.siswa_nama} - ${item.jenis_pembayaran} harus lebih dari 0`);
        }

        if (jumlahBayar > item.sisa_bayar) {
          throw new Error(`Jumlah bayar untuk ${item.siswa_nama} - ${item.jenis_pembayaran} melebihi sisa tagihan`);
        }

        const response = await fetch(
          `http://localhost:8000/api/v1/tagihan/${item.id_tagihan}/konfirmasi-pembayaran`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jumlah_bayar: jumlahBayar,
              tanggal_bayar: formData.tanggal_bayar,
              metode_pembayaran: formData.metode_pembayaran,
              no_referensi: formData.no_referensi,
              keterangan_cicilan: formData.keterangan
            })
          }
        );

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || `Gagal memproses pembayaran ${item.siswa_nama}`);
        }

        return result;
      });

      await Promise.all(promises);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error processing bulk payment:', err);
      setError(err.message || 'Gagal memproses pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pembayaran Massal
                </h3>
                <p className="text-sm text-gray-600">
                  {items.length} tagihan dipilih
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
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Tagihan</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(items.reduce((sum, item) => sum + item.nominal_tagihan, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Sisa</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(items.reduce((sum, item) => sum + item.sisa_bayar, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Akan Dibayar</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(getTotalToBePaid())}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Mode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('full')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMode === 'full'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Bayar Penuh Semua</span>
                    {paymentMode === 'full' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    Bayar semua tagihan sampai lunas
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('custom')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    paymentMode === 'custom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Custom Per Item</span>
                    {paymentMode === 'custom' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    Atur jumlah bayar per tagihan
                  </p>
                </button>
              </div>
            </div>

            {/* Items List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Daftar Tagihan
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Siswa</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Jenis</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Periode</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Sisa</th>
                        {paymentMode === 'custom' && (
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Bayar</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr key={item.id_tagihan} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{item.siswa_nama}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.jenis_pembayaran}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.bulan_tahun}</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(item.sisa_bayar)}
                          </td>
                          {paymentMode === 'custom' && (
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="0"
                                max={item.sisa_bayar}
                                step="1000"
                                value={customAmounts[item.id_tagihan] || ''}
                                onChange={(e) => handleCustomAmountChange(item.id_tagihan, e.target.value)}
                                placeholder="0"
                                className="w-full px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

            {/* Keterangan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Keterangan pembayaran (opsional)"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 flex justify-between items-center px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="text-sm text-gray-600">
              Total: <span className="font-bold text-green-600 text-lg">{formatCurrency(getTotalToBePaid())}</span>
            </div>
            <div className="flex space-x-3">
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
                disabled={loading || (paymentMode === 'custom' && getTotalToBePaid() === 0)}
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
    </div>
  );
}