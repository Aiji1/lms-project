'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { api } from '@/lib/api';

interface PresensiMapelEditProps {
  params: Promise<{
    id: string;
  }>;
}

interface PresensiMapelData {
  id_presensi_mapel: number;
  id_jurnal: number;
  nis: string;
  status_ketidakhadiran: 'Sakit' | 'Izin' | 'Alpa';
  keterangan: string;
}

interface Student {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface Subject {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  guru_pengajar: string;
}

interface FormData {
  nis: string;
  id_mata_pelajaran: string;
  tanggal: string;
  jam_pelajaran: string;
  status_ketidakhadiran: 'Sakit' | 'Izin' | 'Alpa';
  keterangan: string;
}

export default function PresensiMapelEditPage({ params }: PresensiMapelEditProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nis: '',
    id_mata_pelajaran: '',
    tanggal: '',
    jam_pelajaran: '',
    status_ketidakhadiran: 'Sakit',
    keterangan: ''
  });

  useEffect(() => {
    if (resolvedParams.id) {
      fetchData();
    }
  }, [resolvedParams.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch form data (students and subjects)
      const formDataResponse = await api.get('/presensi-mapel-form-data');
      if (formDataResponse.data.success) {
        setStudents(formDataResponse.data.data.students || []);
        setSubjects(formDataResponse.data.data.subjects || []);
      }

      // Fetch existing presensi data
      const presensiResponse = await api.get(`/presensi-mapel/${resolvedParams.id}`);
      if (presensiResponse.data.success) {
        const presensi = presensiResponse.data.data;
        setFormData({
          nis: presensi.nis,
          id_mata_pelajaran: presensi.id_mata_pelajaran?.toString() || '',
          tanggal: presensi.tanggal,
          jam_pelajaran: presensi.jam_pelajaran,
          status_ketidakhadiran: presensi.status_ketidakhadiran,
          keterangan: presensi.keterangan || ''
        });
      } else {
        alert('Data presensi mapel tidak ditemukan');
        router.push('/presensi/mapel');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Terjadi kesalahan saat mengambil data');
      router.push('/presensi/mapel');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nis || !formData.id_mata_pelajaran || !formData.tanggal || !formData.jam_pelajaran) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setSaving(true);
      
      const response = await api.put(`/presensi-mapel/${resolvedParams.id}`, {
        nis: formData.nis,
        id_mata_pelajaran: parseInt(formData.id_mata_pelajaran),
        tanggal: formData.tanggal,
        jam_pelajaran: formData.jam_pelajaran,
        status_ketidakhadiran: formData.status_ketidakhadiran,
        keterangan: formData.keterangan || null
      });

      if (response.data.success) {
        router.push(`/presensi/mapel/${resolvedParams.id}`);
      } else {
        alert(response.data.message || 'Gagal mengupdate data presensi mapel');
      }
    } catch (error: any) {
      console.error('Error updating presensi:', error);
      alert(error.response?.data?.message || 'Terjadi kesalahan saat mengupdate data');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedStudent = () => {
    return students.find(student => student.nis === formData.nis);
  };

  const getSelectedSubject = () => {
    return subjects.find(subject => subject.id_mata_pelajaran.toString() === formData.id_mata_pelajaran);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Link
            href={`/presensi/mapel/${resolvedParams.id}`}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Presensi Mapel</h1>
            <p className="text-gray-600 mt-1">Ubah data ketidakhadiran siswa pada mata pelajaran</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div>
              <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-2">
                Siswa <span className="text-red-500">*</span>
              </label>
              <select
                id="nis"
                name="nis"
                value={formData.nis}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Siswa</option>
                {students.map((student) => (
                  <option key={student.nis} value={student.nis}>
                    {student.nis} - {student.nama_lengkap} ({student.nama_kelas})
                  </option>
                ))}
              </select>
              {getSelectedStudent() && (
                <p className="mt-1 text-sm text-gray-600">
                  Kelas: {getSelectedStudent()?.nama_kelas}
                </p>
              )}
            </div>

            {/* Subject Selection */}
            <div>
              <label htmlFor="id_mata_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                Mata Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                id="id_mata_pelajaran"
                name="id_mata_pelajaran"
                value={formData.id_mata_pelajaran}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Mata Pelajaran</option>
                {subjects.map((subject) => (
                  <option key={subject.id_mata_pelajaran} value={subject.id_mata_pelajaran}>
                    {subject.nama_mata_pelajaran}
                  </option>
                ))}
              </select>
              {getSelectedSubject() && (
                <p className="mt-1 text-sm text-gray-600">
                  Guru: {getSelectedSubject()?.guru_pengajar}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="tanggal"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Period */}
            <div>
              <label htmlFor="jam_pelajaran" className="block text-sm font-medium text-gray-700 mb-2">
                Jam Pelajaran <span className="text-red-500">*</span>
              </label>
              <select
                id="jam_pelajaran"
                name="jam_pelajaran"
                value={formData.jam_pelajaran}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Jam Pelajaran</option>
                <option value="1">Jam ke-1 (07:00 - 07:45)</option>
                <option value="2">Jam ke-2 (07:45 - 08:30)</option>
                <option value="3">Jam ke-3 (08:30 - 09:15)</option>
                <option value="4">Jam ke-4 (09:30 - 10:15)</option>
                <option value="5">Jam ke-5 (10:15 - 11:00)</option>
                <option value="6">Jam ke-6 (11:00 - 11:45)</option>
                <option value="7">Jam ke-7 (12:30 - 13:15)</option>
                <option value="8">Jam ke-8 (13:15 - 14:00)</option>
                <option value="9">Jam ke-9 (14:00 - 14:45)</option>
                <option value="10">Jam ke-10 (14:45 - 15:30)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status_ketidakhadiran" className="block text-sm font-medium text-gray-700 mb-2">
                Status Ketidakhadiran <span className="text-red-500">*</span>
              </label>
              <select
                id="status_ketidakhadiran"
                name="status_ketidakhadiran"
                value={formData.status_ketidakhadiran}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Sakit">Sakit</option>
                <option value="Izin">Izin</option>
                <option value="Alpa">Alpa</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="keterangan" className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Masukkan keterangan tambahan (opsional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href={`/presensi/mapel/${resolvedParams.id}`}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}