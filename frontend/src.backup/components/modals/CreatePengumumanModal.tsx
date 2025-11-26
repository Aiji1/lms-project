'use client';

import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { pengumumanApi, type PengumumanFormData } from '@/lib/api-pengumuman';

interface CreatePengumumanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePengumumanModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePengumumanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PengumumanFormData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    judul: '',
    konten: '',
    kategori: 'Umum',
    prioritas: 'Normal',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
    status: 'Published',
    target_type: 'all',
    target_roles: [] as string[],
    target_tingkat: [] as string[],
    target_kelas: [] as number[],
    is_pinned: false,
  });

  useEffect(() => {
    if (isOpen) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      fetchFormData();
    }
  }, [isOpen]);

  const fetchFormData = async () => {
    try {
      const response = await pengumumanApi.getFormData();
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch form data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran file maksimal 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleMultiSelect = (name: string, value: string | number, checked: boolean) => {
    setForm((prev) => {
      const currentArray = prev[name as keyof typeof prev] as any[];
      
      if (checked) {
        return { ...prev, [name]: [...currentArray, value] };
      } else {
        return { ...prev, [name]: currentArray.filter((item) => item !== value) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User tidak ditemukan');
      return;
    }

    if (!form.judul.trim()) {
      setError('Judul harus diisi');
      return;
    }
    
    if (!form.konten.trim()) {
      setError('Konten harus diisi');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('judul', form.judul);
      formDataToSend.append('konten', form.konten);
      formDataToSend.append('kategori', form.kategori);
      formDataToSend.append('prioritas', form.prioritas);
      formDataToSend.append('tanggal_mulai', form.tanggal_mulai);
      if (form.tanggal_selesai) {
        formDataToSend.append('tanggal_selesai', form.tanggal_selesai);
      }
      formDataToSend.append('status', form.status);
      formDataToSend.append('target_type', form.target_type);
      formDataToSend.append('is_pinned', form.is_pinned ? '1' : '0');
      
      // Target arrays: kirim hanya field sesuai target_type dan jangan kirim string '[]'
      if (form.target_type === 'roles' && form.target_roles.length > 0) {
        form.target_roles.forEach((role) => {
          formDataToSend.append('target_roles[]', role);
        });
      }

      if (form.target_type === 'tingkat' && form.target_tingkat.length > 0) {
        form.target_tingkat.forEach((tingkat) => {
          formDataToSend.append('target_tingkat[]', tingkat);
        });
      }

      if (form.target_type === 'kelas' && form.target_kelas.length > 0) {
        form.target_kelas.forEach((kelas) => {
          formDataToSend.append('target_kelas[]', String(kelas));
        });
      }

      // Jangan kirim 'target_siswa' jika tidak digunakan
      
      const userIdentifier = user.user_id || user.username || user.reference_id;
      formDataToSend.append('dibuat_oleh', userIdentifier);
      formDataToSend.append('dibuat_oleh_nama', user.nama_lengkap || user.username);
      formDataToSend.append('dibuat_oleh_role', user.user_type);
      
      if (selectedFile) {
        formDataToSend.append('file_lampiran', selectedFile);
      }

      await pengumumanApi.create(formDataToSend);
      
      // Reset form
      setForm({
        judul: '',
        konten: '',
        kategori: 'Umum',
        prioritas: 'Normal',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '',
        status: 'Published',
        target_type: 'all',
        target_roles: [],
        target_tingkat: [],
        target_kelas: [],
        is_pinned: false,
      });
      setSelectedFile(null);
      
      onSuccess();
      onClose();

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal membuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">📢 Buat Pengumuman Baru</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* JUDUL - INI YANG PENTING! */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Judul Pengumuman <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="judul"
                value={form.judul}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Contoh: Libur Semester Ganjil 2025"
                required
              />
            </div>

            {/* KONTEN - INI JUGA PENTING! */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📄 Konten Pengumuman <span className="text-red-500">*</span>
              </label>
              <textarea
                name="konten"
                value={form.konten}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Tulis isi pengumuman lengkap di sini..."
                required
              />
            </div>

            {/* Row: Kategori, Prioritas, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {formData?.kategori.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioritas <span className="text-red-500">*</span>
                </label>
                <select
                  name="prioritas"
                  value={form.prioritas}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {formData?.prioritas.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {formData?.status.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  value={form.tanggal_mulai}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Selesai (Opsional)
                </label>
                <input
                  type="date"
                  name="tanggal_selesai"
                  value={form.tanggal_selesai}
                  onChange={handleChange}
                  min={form.tanggal_mulai}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Lampiran (Opsional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedFile ? selectedFile.name : 'Klik untuk upload file'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Max 10MB • PDF, Word, Excel, PowerPoint, Gambar
                  </span>
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    ✕ Hapus file
                  </button>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="border-2 border-gray-200 rounded-lg p-5 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🎯 Target Penerima
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Target
                </label>
                <select
                  name="target_type"
                  value={form.target_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">📣 Semua Pengguna</option>
                  <option value="roles">👥 Berdasarkan Role</option>
                  <option value="tingkat">🎓 Berdasarkan Tingkat</option>
                  <option value="kelas">🏫 Berdasarkan Kelas</option>
                </select>
              </div>

              {/* Target: Roles */}
              {form.target_type === 'roles' && formData && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.roles.map((role) => (
                      <label key={role} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.target_roles.includes(role)}
                          onChange={(e) => handleMultiSelect('target_roles', role, e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{role.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Target: Tingkat */}
              {form.target_type === 'tingkat' && formData && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Tingkat
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.tingkat.map((tingkat) => (
                      <label key={tingkat} className="flex items-center gap-2 p-3 hover:bg-blue-50 rounded cursor-pointer border border-gray-200">
                        <input
                          type="checkbox"
                          checked={form.target_tingkat.includes(tingkat)}
                          onChange={(e) => handleMultiSelect('target_tingkat', tingkat, e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm font-medium">Kelas {tingkat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Target: Kelas */}
              {form.target_type === 'kelas' && formData && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Kelas
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {formData.kelas.map((kelas) => (
                      <label key={kelas.id_kelas} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.target_kelas.includes(kelas.id_kelas)}
                          onChange={(e) => handleMultiSelect('target_kelas', kelas.id_kelas, e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm">{kelas.nama_kelas}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pin Option */}
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                name="is_pinned"
                id="is_pinned"
                checked={form.is_pinned}
                onChange={handleChange}
                className="rounded text-yellow-600 w-5 h-5"
              />
              <label htmlFor="is_pinned" className="text-sm text-gray-700 cursor-pointer font-medium">
                📌 Pin pengumuman ini di atas (akan ditampilkan paling atas)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Menyimpan...' : '✓ Simpan Pengumuman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
