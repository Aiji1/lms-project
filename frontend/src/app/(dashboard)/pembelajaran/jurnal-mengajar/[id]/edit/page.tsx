'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, BookOpen, Calendar, Clock, FileText, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePermission } from '@/hooks/usePermission';

interface MataPelajaran {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
}

interface Kelas {
  id_kelas: number;
  nama_kelas: string;
  tahun_ajaran: string;
  semester: string;
}

interface FormData {
  id_mata_pelajaran: string;
  id_kelas: string;
  tanggal: string;
  jam_ke_mulai: string;
  jam_ke_selesai: string;
  status_mengajar: string;
  materi_diajarkan: string;
  keterangan: string;
}

export default function EditJurnalMengajarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 🔒 ROUTE PROTECTION
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'pembelajaran.jurnal_mengajar',
    requireEdit: true,
    redirectTo: '/pembelajaran/jurnal-mengajar'
  });

  const { canEdit } = usePermission('pembelajaran.jurnal_mengajar');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form options
  const [mataPelajaranList, setMataPelajaranList] = useState<MataPelajaran[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jamKeOptions] = useState<number[]>(Array.from({ length: 10 }, (_, i) => i + 1));

  // Form data
  const [formData, setFormData] = useState<FormData>({
    id_mata_pelajaran: '',
    id_kelas: '',
    tanggal: '',
    jam_ke_mulai: '1',
    jam_ke_selesai: '1',
    status_mengajar: 'Hadir',
    materi_diajarkan: '',
    keterangan: ''
  });

  useEffect(() => {
    if (id && isAuthorized) {
      fetchJurnalMengajar();
      fetchFormData();
    }
  }, [id, isAuthorized]);

  const fetchJurnalMengajar = async () => {
    try {
      const response = await api.get(`/jurnal-mengajar/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          id_mata_pelajaran: data.id_mata_pelajaran?.toString() || '',
          id_kelas: data.id_kelas?.toString() || '',
          tanggal: data.tanggal?.split('T')[0] || '',
          jam_ke_mulai: data.jam_ke_mulai?.toString() || '1',
          jam_ke_selesai: data.jam_ke_selesai?.toString() || '1',
          status_mengajar: data.status_mengajar || 'Hadir',
          materi_diajarkan: data.materi_diajarkan || '',
          keterangan: data.keterangan || ''
        });
      }
    } catch (error) {
      console.error('Error fetching jurnal mengajar:', error);
      setError('Gagal memuat data jurnal mengajar');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const response = await api.get('/jurnal-mengajar-form-data');
      if (response.data.success) {
        setMataPelajaranList(response.data.data.mata_pelajaran || []);
        setKelasList(response.data.data.kelas || []);
      }
    } catch (err: any) {
      console.error('Error fetching form data:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-adjust jam_ke_selesai if jam_ke_mulai is changed
    if (name === 'jam_ke_mulai' && parseInt(value) > parseInt(formData.jam_ke_selesai)) {
      setFormData(prev => ({
        ...prev,
        jam_ke_selesai: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/jurnal-mengajar/${id}`, {
        id_mata_pelajaran: parseInt(formData.id_mata_pelajaran),
        id_kelas: parseInt(formData.id_kelas),
        tanggal: formData.tanggal,
        jam_ke_mulai: parseInt(formData.jam_ke_mulai),
        jam_ke_selesai: parseInt(formData.jam_ke_selesai),
        status_mengajar: formData.status_mengajar,
        materi_diajarkan: formData.materi_diajarkan,
        keterangan: formData.keterangan
      });

      if (response.data.success) {
        setSuccess('Jurnal mengajar berhasil diperbarui!');
        setTimeout(() => {
          router.push('/pembelajaran/jurnal-mengajar');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error updating jurnal:', err);
      setError(err.response?.data?.message || 'Gagal memperbarui jurnal mengajar');
    } finally {
      setSubmitting(false);
    }
  };

  if (permLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/pembelajaran/jurnal-mengajar"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Jurnal Mengajar</h1>
            <p className="text-gray-600 text-sm mt-1">Perbarui data jurnal mengajar</p>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mata Pelajaran & Kelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Mata Pelajaran <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                name="id_mata_pelajaran"
                value={formData.id_mata_pelajaran}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {mataPelajaranList.map((mapel) => (
                  <option key={mapel.id_mata_pelajaran} value={mapel.id_mata_pelajaran}>
                    {mapel.nama_mata_pelajaran}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kelas <span className="text-red-500">*</span>
                </div>
              </label>
              <select
                name="id_kelas"
                value={formData.id_kelas}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Kelas</option>
                {kelasList.map((kelas) => (
                  <option key={kelas.id_kelas} value={kelas.id_kelas}>
                    {kelas.nama_kelas} ({kelas.tahun_ajaran} - {kelas.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tanggal <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Mengajar <span className="text-red-500">*</span>
              </label>
              <select
                name="status_mengajar"
                value={formData.status_mengajar}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Hadir">Hadir</option>
                <option value="Tidak_Hadir">Tidak Hadir</option>
                <option value="Diganti">Diganti</option>
              </select>
            </div>
          </div>

          {/* Jam Ke */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Pelajaran <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Jam Mulai</label>
                <select
                  name="jam_ke_mulai"
                  value={formData.jam_ke_mulai}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {jamKeOptions.map((jam) => (
                    <option key={jam} value={jam}>
                      Jam ke-{jam}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Jam Selesai</label>
                <select
                  name="jam_ke_selesai"
                  value={formData.jam_ke_selesai}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {jamKeOptions
                    .filter(jam => jam >= parseInt(formData.jam_ke_mulai))
                    .map((jam) => (
                      <option key={jam} value={jam}>
                        Jam ke-{jam}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.jam_ke_mulai === formData.jam_ke_selesai
                ? `Mengajar 1 jam pelajaran (Jam ke-${formData.jam_ke_mulai})`
                : `Mengajar ${parseInt(formData.jam_ke_selesai) - parseInt(formData.jam_ke_mulai) + 1} jam pelajaran (Jam ke-${formData.jam_ke_mulai} s/d ${formData.jam_ke_selesai})`
              }
            </p>
          </div>

          {/* Materi Diajarkan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Materi Diajarkan <span className="text-red-500">*</span>
              </div>
            </label>
            <textarea
              name="materi_diajarkan"
              value={formData.materi_diajarkan}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Tulis materi yang diajarkan (minimal 10 karakter)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.materi_diajarkan.length} / 1000 karakter
            </p>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan (Opsional)
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={3}
              placeholder="Catatan tambahan jika ada..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.keterangan.length} / 500 karakter
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <Link
              href="/pembelajaran/jurnal-mengajar"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
