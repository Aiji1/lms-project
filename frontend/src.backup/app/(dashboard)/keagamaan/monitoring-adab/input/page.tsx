"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CheckCircle, Calendar, Filter, BookOpen, Users, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface KelasOption {
  id_kelas: number;
  nama_kelas: string;
}

interface SiswaItem {
  nis: string;
  nama_lengkap: string;
  id_kelas?: number;
}

type StatusDilaksanakan = "Ya" | "Tidak";

export default function MonitoringAdabInputPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tugasAdabId = searchParams.get("tugas_adab");
  const { isLoading, isAuthenticated, isTeacher, isAdmin } = useAuth();
  const isTeacherOrAdmin = isTeacher() || isAdmin();

  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, StatusDilaksanakan | undefined>>({});
  const [loadingSiswa, setLoadingSiswa] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Load kelas options
  useEffect(() => {
    if (!isTeacherOrAdmin) return;
    const loadKelas = async () => {
      try {
        const res = await api.get(`/v1/kelas`, { params: { per_page: 100 } });
        const list = res.data?.data?.data || res.data?.data || [];
        const mapped = list.map((k: any) => ({ id_kelas: k.id_kelas, nama_kelas: k.nama_kelas }));
        setKelasOptions(mapped);
      } catch (e: any) {
        setError(e?.message || "Gagal memuat data kelas");
      }
    };
    loadKelas();
  }, [isTeacherOrAdmin]);

  // Load siswa when kelas selected
  useEffect(() => {
    if (!isTeacherOrAdmin) return;
    const loadSiswa = async () => {
      if (!selectedKelas) {
        setSiswaList([]);
        return;
      }
      setLoadingSiswa(true);
      setError(null);
      try {
        // Reuse existing endpoint to get siswa by kelas
        const res = await api.get(`/v1/tugas/siswa/${selectedKelas}`);
        const list = res.data?.data || [];
        const mapped: SiswaItem[] = list.map((s: any) => ({ nis: s.nis, nama_lengkap: s.nama_lengkap, id_kelas: s.id_kelas }));
        setSiswaList(mapped);
        // Reset status map for new kelas
        setStatusMap({});
      } catch (e: any) {
        setError(e?.message || "Gagal memuat data siswa");
      } finally {
        setLoadingSiswa(false);
      }
    };
    loadSiswa();
  }, [selectedKelas, isTeacherOrAdmin]);

  const allAssigned = useMemo(() => {
    if (siswaList.length === 0) return false;
    return siswaList.every((s) => !!statusMap[s.nis]);
  }, [siswaList, statusMap]);

  const handleSetAll = (status: StatusDilaksanakan) => {
    const newMap: Record<string, StatusDilaksanakan> = {};
    siswaList.forEach((s) => {
      newMap[s.nis] = status;
    });
    setStatusMap(newMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setError(null);
    if (!tugasAdabId) {
      setError("Parameter tugas_adab tidak ditemukan.");
      return;
    }
    if (!tanggal) {
      setError("Tanggal harus diisi.");
      return;
    }
    const entries = Object.entries(statusMap)
      .filter(([, status]) => !!status)
      .map(([nis, status]) => ({ nis, status_dilaksanakan: status as StatusDilaksanakan }));

    if (entries.length === 0) {
      setError("Pilih status untuk minimal satu siswa.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/v1/tugas-adab/${tugasAdabId}/monitoring-submit`, {
        tanggal,
        entries,
      });
      if (res.data?.success) {
        setSubmitMessage("Berhasil menyimpan monitoring.");
        // Navigate to list page
        router.push(`/keagamaan/monitoring-adab?tugas_adab=${tugasAdabId}`);
      } else {
        setError(res.data?.message || "Gagal menyimpan monitoring");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isTeacherOrAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center p-4 border border-yellow-200 rounded-lg bg-yellow-50 text-yellow-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            Halaman ini hanya dapat diakses oleh guru atau admin.
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              onClick={() => router.push(`/keagamaan/monitoring-adab${tugasAdabId ? `?tugas_adab=${tugasAdabId}` : ""}`)}
            >
              Kembali ke Daftar Monitoring
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              Input Monitoring Adab
            </h1>
            <p className="text-gray-600 mt-1">Isi status pelaksanaan adab siswa per kelas</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            {tugasAdabId && (
              <Link
                href={`/keagamaan/monitoring-adab?tugas_adab=${tugasAdabId}`}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Lihat Daftar Monitoring
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Form Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
              <div className="relative">
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k.id_kelas} value={k.id_kelas.toString()}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={() => handleSetAll("Ya")}
                disabled={siswaList.length === 0}
              >
                Tandai Semua Ya
              </button>
              <button
                type="button"
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => handleSetAll("Tidak")}
                disabled={siswaList.length === 0}
              >
                Tandai Semua Tidak
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          {submitMessage && (
            <div className="flex items-center p-4 border border-green-200 rounded-lg bg-green-50 text-green-700">
              {submitMessage}
            </div>
          )}

          {/* Student List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Daftar Siswa</span>
              </div>
              <div className="text-sm text-gray-600">
                {siswaList.length} siswa
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingSiswa ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        <Loader2 className="inline h-5 w-5 animate-spin mr-2" /> Memuat siswa...
                      </td>
                    </tr>
                  ) : siswaList.length > 0 ? (
                    siswaList.map((s) => (
                      <tr key={s.nis} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nis}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nama_lengkap}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-4">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name={`status-${s.nis}`}
                                checked={statusMap[s.nis] === "Ya"}
                                onChange={() => setStatusMap((prev) => ({ ...prev, [s.nis]: "Ya" }))}
                              />
                              <span>Ya</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name={`status-${s.nis}`}
                                checked={statusMap[s.nis] === "Tidak"}
                                onChange={() => setStatusMap((prev) => ({ ...prev, [s.nis]: "Tidak" }))}
                              />
                              <span>Tidak</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Pilih kelas untuk menampilkan siswa</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              onClick={() => router.back()}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              disabled={submitting || !tugasAdabId}
              title={!tugasAdabId ? "Pilih tugas adab dari halaman detail" : undefined}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan Monitoring
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}