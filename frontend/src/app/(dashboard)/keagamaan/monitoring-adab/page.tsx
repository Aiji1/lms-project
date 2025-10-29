"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Users, UserCheck, Filter, Calendar, BookOpen, Eye, CheckCircle, XCircle, BarChart3, FileDown, PlusCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MonitoringDetailItem {
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  kelas: string | null;
  status_pelaksanaan: string | null;
  tanggal_monitoring: string | null;
}

interface TugasAdabOption {
  id_tugas_adab: number;
  nama_tugas: string;
}

interface TugasAdabItem {
  id_tugas_adab: number;
  nama_tugas: string;
  deskripsi_tugas: string;
}

interface DailyRecapItem {
  id_kelas: number;
  nama_kelas: string;
  total_siswa: number;
  siswa_melaksanakan: number;
  siswa_tidak_melaksanakan: number;
  persentase_kepatuhan: number;
  tanggal: string;
  id_tugas_adab: number;
}

export default function MonitoringAdabListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tugasAdabId = searchParams.get("tugas_adab");
  const auth = useAuth();
  const isStudent = useMemo(() => auth.isStudent(), [auth]);
  const isTeacherOrAdmin = useMemo(() => auth.isTeacher() || auth.isAdmin(), [auth]);

  const [details, setDetails] = useState<MonitoringDetailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState<string>("");
  const [kelasId, setKelasId] = useState<string>("");
  const [tugasOptions, setTugasOptions] = useState<TugasAdabOption[]>([]);
  const [selectedTugas, setSelectedTugas] = useState<string>(tugasAdabId || "");
  const [activeTugas, setActiveTugas] = useState<TugasAdabItem[]>([]);
  const [dailyRecap, setDailyRecap] = useState<DailyRecapItem[]>([]);
  const [recapLoading, setRecapLoading] = useState<boolean>(false);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [kelasOptions, setKelasOptions] = useState<{ id_kelas: number; nama_kelas: string }[]>([]);
  // Task management states (Teacher/Admin)
  const [taId, setTaId] = useState<number | null>(null);
  const [newTaskNama, setNewTaskNama] = useState<string>("");
  const [newTaskDeskripsi, setNewTaskDeskripsi] = useState<string>("");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("Aktif");

  // Student view states
  const [studentInfo, setStudentInfo] = useState<{ nis: string; nama: string; kelasId?: number; kelasNama?: string } | null>(null);
  const [studentStatusMap, setStudentStatusMap] = useState<Record<number, "Ya" | "Tidak" | undefined>>({});
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    // Load some tugas adab options for quick navigation
    const loadTugasOptions = async () => {
      try {
        const res = await api.get(`/v1/tugas-adab`, { params: { per_page: 50, status: "Aktif" } });
        const data = res.data?.data || [];
        setTugasOptions(
          data.map((d: any) => ({ id_tugas_adab: d.id_tugas_adab, nama_tugas: d.nama_tugas }))
        );
        setActiveTugas(
          data.map((d: any) => ({
            id_tugas_adab: d.id_tugas_adab,
            nama_tugas: d.nama_tugas,
            deskripsi_tugas: d.deskripsi_tugas || "",
          }))
        );
      } catch {}
    };
    loadTugasOptions();
  }, []);

  // Load form data (tahun ajaran) for task creation
  useEffect(() => {
    const loadFormData = async () => {
      try {
        if (!isTeacherOrAdmin) return;
        const res = await api.get(`/v1/tugas-adab-form-data`);
        const d = res.data?.data;
        if (d && d.id_tahun_ajaran) {
          setTaId(Number(d.id_tahun_ajaran));
        }
      } catch {}
    };
    loadFormData();
  }, [isTeacherOrAdmin]);

  // Load kelas options for teacher/admin filters and export
  useEffect(() => {
    const loadKelas = async () => {
      try {
        const res = await api.get(`/v1/kelas`, { params: { per_page: 100 } });
        const list = res.data?.data?.data || res.data?.data || [];
        const mapped = list.map((k: any) => ({ id_kelas: k.id_kelas, nama_kelas: k.nama_kelas }));
        setKelasOptions(mapped);
      } catch {}
    };
    loadKelas();
  }, []);

  useEffect(() => {
    if (!selectedTugas) return;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/v1/tugas-adab/${selectedTugas}/monitoring-details`, {
          params: {
            tanggal: tanggal || undefined,
            kelas: kelasId || undefined,
          },
        });
        if (res.data?.success) {
          setDetails(res.data.data || []);
        } else {
          setError("Gagal mengambil data monitoring");
        }
      } catch (e: any) {
        setError(e?.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [selectedTugas, tanggal, kelasId]);

  useEffect(() => {
    // Fetch daily recap per kelas when tugas and tanggal are selected
    const fetchDailyRecap = async () => {
      if (!selectedTugas || !tanggal) {
        setDailyRecap([]);
        return;
      }
      setRecapLoading(true);
      setRecapError(null);
      try {
        const res = await api.get(`/v1/tugas-adab/${selectedTugas}/monitoring-daily-recap`, {
          params: { tanggal, kelas: kelasId || undefined },
        });
        if (res.data?.success) {
          setDailyRecap(res.data.data || []);
        } else {
          setRecapError("Gagal mengambil recap harian");
        }
      } catch (e: any) {
        setRecapError(e?.message || "Terjadi kesalahan");
      } finally {
        setRecapLoading(false);
      }
    };
    fetchDailyRecap();
  }, [selectedTugas, tanggal, kelasId]);

  const handleExportDaily = () => {
    // Export CSV dari data recap harian saat ini
    if (!selectedTugas || !tanggal) {
      alert("Pilih tugas adab dan tanggal terlebih dahulu");
      return;
    }
    if (!dailyRecap || dailyRecap.length === 0) {
      alert("Tidak ada data untuk diekspor");
      return;
    }
    const headers = [
      "Kelas",
      "Total Siswa",
      "Melaksanakan",
      "Tidak",
      "Kepatuhan (%)",
      "Tanggal",
      "ID Tugas Adab",
    ];
    const rows = dailyRecap.map((item) => [
      item.nama_kelas,
      String(item.total_siswa ?? 0),
      String(item.siswa_melaksanakan ?? 0),
      String(item.siswa_tidak_melaksanakan ?? 0),
      String(item.persentase_kepatuhan ?? 0),
      item.tanggal,
      String(item.id_tugas_adab),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Harian_Adab_${tanggal}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Add a new task (Teacher/Admin)
  const handleAddTask = async () => {
    try {
      if (!isTeacherOrAdmin) return;
      if (!taId) {
        alert("Gagal memuat tahun ajaran aktif");
        return;
      }
      if (!newTaskNama.trim()) {
        alert("Nama tugas wajib diisi");
        return;
      }
      if (!newTaskDeskripsi.trim()) {
        alert("Deskripsi tugas wajib diisi");
        return;
      }
      await api.post(`/v1/tugas-adab`, {
        nama_tugas: newTaskNama,
        deskripsi_tugas: newTaskDeskripsi,
        id_tahun_ajaran: taId,
        status: newTaskStatus,
      });
      // Refresh active tasks
      try {
        const res = await api.get(`/v1/tugas-adab`, { params: { per_page: 50, status: "Aktif" } });
        const data = res.data?.data || [];
        setTugasOptions(data.map((d: any) => ({ id_tugas_adab: d.id_tugas_adab, nama_tugas: d.nama_tugas })));
        setActiveTugas(
          data.map((d: any) => ({ id_tugas_adab: d.id_tugas_adab, nama_tugas: d.nama_tugas, deskripsi_tugas: d.deskripsi_tugas || "" }))
        );
      } catch {}
      setNewTaskNama("");
      setNewTaskDeskripsi("");
      setNewTaskStatus("Aktif");
      alert("Tugas adab berhasil ditambahkan");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menambahkan tugas");
    }
  };

  // Delete a task (Teacher/Admin)
  const handleDeleteTask = async (id: number) => {
    try {
      if (!isTeacherOrAdmin) return;
      const confirmDel = window.confirm("Yakin ingin menghapus tugas ini?");
      if (!confirmDel) return;
      await api.delete(`/v1/tugas-adab/${id}`);
      // Refresh active tasks
      try {
        const res = await api.get(`/v1/tugas-adab`, { params: { per_page: 50, status: "Aktif" } });
        const data = res.data?.data || [];
        setTugasOptions(data.map((d: any) => ({ id_tugas_adab: d.id_tugas_adab, nama_tugas: d.nama_tugas })));
        setActiveTugas(
          data.map((d: any) => ({ id_tugas_adab: d.id_tugas_adab, nama_tugas: d.nama_tugas, deskripsi_tugas: d.deskripsi_tugas || "" }))
        );
      } catch {}
      alert("Tugas adab berhasil dihapus");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menghapus tugas");
    }
  };

  // Fetch student info when logged in as student
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        if (!isStudent || !auth.user?.reference_id) return;
        const nis = String(auth.user.reference_id);
        const res = await api.get(`/v1/siswa/${nis}`);
        const s = res.data?.data;
        if (s) {
          setStudentInfo({
            nis,
            nama: s.nama_lengkap,
            kelasId: s.id_kelas,
            kelasNama: s.nama_kelas,
          });
        }
      } catch {}
    };
    fetchStudentInfo();
  }, [isStudent, auth.user?.reference_id]);

  // Fetch today's statuses for student for each active task
  useEffect(() => {
    const fetchStudentStatuses = async () => {
      try {
        if (!isStudent || !studentInfo?.kelasId || activeTugas.length === 0) return;
        const results = await Promise.all(
          activeTugas.map(async (t) => {
            try {
              const r = await api.get(`/v1/tugas-adab/${t.id_tugas_adab}/monitoring-details`, {
                params: { tanggal: todayStr, kelas: studentInfo.kelasId },
              });
              const list: MonitoringDetailItem[] = r.data?.data || [];
              const me = list.find((item) => item.nis === studentInfo.nis);
              return { id: t.id_tugas_adab, status: (me?.status_pelaksanaan as "Ya" | "Tidak" | null) || undefined };
            } catch {
              return { id: t.id_tugas_adab, status: undefined };
            }
          })
        );
        const map: Record<number, "Ya" | "Tidak" | undefined> = {};
        results.forEach((r) => {
          map[r.id] = r.status ?? undefined;
        });
        setStudentStatusMap(map);
      } catch {}
    };
    fetchStudentStatuses();
  }, [isStudent, studentInfo?.kelasId, studentInfo?.nis, activeTugas, todayStr]);

  const toggleStudentStatus = (taskId: number) => {
    setStudentStatusMap((prev) => {
      const curr = prev[taskId];
      const next: "Ya" | "Tidak" = curr === "Ya" ? "Tidak" : "Ya";
      return { ...prev, [taskId]: next };
    });
  };

  const handleStudentSave = async () => {
    if (!studentInfo?.nis) return;
    try {
      const tasksToSave = Object.entries(studentStatusMap).filter(([, status]) => !!status);
      if (tasksToSave.length === 0) return;
      await Promise.all(
        tasksToSave.map(([taskIdStr, status]) =>
          api.post(`/v1/tugas-adab/${taskIdStr}/monitoring-submit`, {
            tanggal: todayStr,
            entries: [{ nis: studentInfo.nis, status_dilaksanakan: status }],
          })
        )
      );
      alert("Berhasil menyimpan monitoring hari ini.");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menyimpan monitoring");
    }
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // Triggers useEffect to refetch
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              Monitoring Adab
            </h1>
            <p className="text-gray-600 mt-1">Lihat daftar monitoring pelaksanaan adab siswa</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            {isTeacherOrAdmin && (
              <>
                <Link
                  href="/keagamaan/tugas-adab/tambah"
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tambah Tugas Adab
                </Link>
                <button
                  type="button"
                  onClick={handleExportDaily}
                  disabled={!selectedTugas || !tanggal || dailyRecap.length === 0}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Rekap Harian
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student View */}
      {isStudent && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">Pengisian Adab Harian</h2>
            <p className="text-green-100">Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
            {studentInfo && (
              <p className="text-green-100 mt-1">{studentInfo.nama} {studentInfo.kelasNama ? `- ${studentInfo.kelasNama}` : ""}</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Checklist Adab Hari Ini</h3>
            <div className="space-y-3">
              {activeTugas.map((task) => {
                const status = studentStatusMap[task.id_tugas_adab];
                const isChecked = status === "Ya";
                const isNo = status === "Tidak";
                return (
                  <div
                    key={task.id_tugas_adab}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      isChecked
                        ? "bg-green-50 border-2 border-green-500"
                        : isNo
                        ? "bg-red-50 border-2 border-red-500"
                        : "bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className={`flex-1 ${isChecked ? "text-green-700 font-medium" : isNo ? "text-red-700 font-medium" : "text-gray-700"}`}>
                      {task.nama_tugas}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Tandai Ya"
                        onClick={() => setStudentStatusMap((prev) => ({ ...prev, [task.id_tugas_adab]: "Ya" }))}
                        className={`flex items-center justify-center h-8 w-8 rounded-full border-2 transition-colors ${
                          isChecked
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-green-600 text-green-600 hover:bg-green-50"
                        }`}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Tandai Tidak"
                        onClick={() => setStudentStatusMap((prev) => ({ ...prev, [task.id_tugas_adab]: "Tidak" }))}
                        className={`flex items-center justify-center h-8 w-8 rounded-full border-2 transition-colors ${
                          isNo
                            ? "bg-red-600 border-red-600 text-white"
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={handleStudentSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!studentInfo}
              >
                Simpan Monitoring Hari Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter dipindahkan ke bagian Rekap Harian */}

      {/* Kelola Tugas Adab dihapus untuk penyederhanaan tampilan guru */}

      {/* Tugas Adab Aktif - hide for students */}
      {!isStudent && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Tugas Adab Aktif
          </h2>
          <p className="text-gray-600 text-sm mt-1">Daftar tugas adab yang aktif. Klik tugas untuk melihat monitoring.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Tugas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                {isTeacherOrAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTugas.length === 0 ? (
                <tr>
                  <td colSpan={isTeacherOrAdmin ? 4 : 3} className="px-6 py-8 text-center text-gray-500">Tidak ada tugas aktif</td>
                </tr>
              ) : (
                activeTugas.map((t, idx) => (
                  <tr key={t.id_tugas_adab} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTugas(String(t.id_tugas_adab))}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      {t.nama_tugas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.deskripsi_tugas}</td>
                    {isTeacherOrAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTask(t.id_tugas_adab); }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" /> Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Rekap Harian per Kelas - teacher/admin only */}
      {isTeacherOrAdmin && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Rekap Harian per Kelas
          </h2>
          <p className="text-gray-600 text-sm mt-1">Ringkasan pelaksanaan tugas per kelas pada tanggal terpilih.</p>
        </div>
        {/* Filter Controls */}
        <div className="p-6 border-b">
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tugas Adab</label>
                <div className="relative">
                  <select
                    value={selectedTugas}
                    onChange={(e) => setSelectedTugas(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih Tugas Adab</option>
                    {tugasOptions.map((opt) => (
                      <option key={opt.id_tugas_adab} value={String(opt.id_tugas_adab)}>
                        {opt.nama_tugas}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
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
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Semua Kelas</option>
                    {kelasOptions.map((k) => (
                      <option key={k.id_kelas} value={String(k.id_kelas)}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </form>
        </div>
        {/* Recap Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            const totalKelas = dailyRecap.length;
            const totalSiswa = dailyRecap.reduce((acc, cur) => acc + (cur.total_siswa || 0), 0);
            const totalYa = dailyRecap.reduce((acc, cur) => acc + (cur.siswa_melaksanakan || 0), 0);
            const totalTidak = dailyRecap.reduce((acc, cur) => acc + (cur.siswa_tidak_melaksanakan || 0), 0);
            const kepatuhan = totalSiswa > 0 ? Math.round((totalYa / totalSiswa) * 100) : 0;
            return (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700">Kepatuhan Rata-rata</div>
                  <div className="text-2xl font-bold text-green-800">{kepatuhan}%</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700">Total Kelas</div>
                  <div className="text-2xl font-bold text-blue-800">{totalKelas}</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-sm text-indigo-700">Siswa Melaksanakan</div>
                  <div className="text-2xl font-bold text-indigo-800">{totalYa}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-700">Siswa Tidak</div>
                  <div className="text-2xl font-bold text-red-800">{totalTidak}</div>
                </div>
              </>
            );
          })()}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Melaksanakan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tidak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kepatuhan (%)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recapLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat recap...</td>
                </tr>
              ) : recapError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-600">{recapError}</td>
                </tr>
              ) : !selectedTugas || !tanggal ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Pilih tugas dan tanggal untuk melihat rekap harian</td>
                </tr>
              ) : dailyRecap.length > 0 ? (
                dailyRecap.map((item) => (
                  <tr key={`${item.id_kelas}-${item.tanggal}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_kelas}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_siswa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.siswa_melaksanakan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.siswa_tidak_melaksanakan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.persentase_kepatuhan}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada data recap untuk filter ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Ekspor Bulanan dihapus (disederhanakan) */}

      {/* Tabel detail monitoring dihapus untuk penyederhanaan tampilan guru */}
    </div>
  );
}