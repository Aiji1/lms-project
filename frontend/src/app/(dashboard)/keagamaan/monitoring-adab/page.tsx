"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Users, UserCheck, Filter, Calendar, BookOpen, Eye, CheckCircle, XCircle, BarChart3, FileDown, PlusCircle, Trash2, Edit } from "lucide-react";
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
  const dateInputRef = useRef<HTMLInputElement>(null);
  // Toast notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  };
  // Task management states (Teacher/Admin)
  const [taId, setTaId] = useState<number | null>(null);
  const [newTaskNama, setNewTaskNama] = useState<string>("");
  const [newTaskDeskripsi, setNewTaskDeskripsi] = useState<string>("");
  const [newTaskStatus, setNewTaskStatus] = useState<string>("Aktif");
  // Export bulanan kuesioner (Admin/Guru)
  const [showMonthlyExport, setShowMonthlyExport] = useState<boolean>(false);
  const [exportMonth, setExportMonth] = useState<string>(""); // YYYY-MM
  const [exportKelas, setExportKelas] = useState<string>("");
  // Export 3 bulan (Admin/Guru)
  const [showQuarterExport, setShowQuarterExport] = useState<boolean>(false);
  const [quarterStartMonth, setQuarterStartMonth] = useState<string>(""); // YYYY-MM
  const [quarterKelas, setQuarterKelas] = useState<string>("");

  const openMonthlyExport = () => {
    setShowMonthlyExport(true);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!exportMonth) setExportMonth(ym);
    if (!exportKelas && kelasId) setExportKelas(kelasId);
  };

  const closeMonthlyExport = () => {
    setShowMonthlyExport(false);
  };

  const handleDownloadMonthly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportMonth) { alert('Silakan pilih bulan'); return; }
    try {
      const res = await api.get(`/v1/adab-questionnaire/export-monthly`, {
        params: { month: exportMonth, kelas: exportKelas || undefined },
        responseType: 'blob' as any,
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekapan_Adab_Siswa_${exportMonth}${exportKelas ? `_Kelas_${exportKelas}` : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowMonthlyExport(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Gagal mengunduh export bulanan');
    }
  };

  const openQuarterExport = () => {
    setShowQuarterExport(true);
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!quarterStartMonth) setQuarterStartMonth(ym);
    if (!quarterKelas && kelasId) setQuarterKelas(kelasId);
  };

  const closeQuarterExport = () => {
    setShowQuarterExport(false);
  };

  const handleDownloadQuarterly = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!quarterStartMonth) { alert('Silakan pilih bulan awal'); return; }
      const res = await api.get(`/v1/adab-questionnaire/export-quarterly`, {
        params: { month: quarterStartMonth, kelas: quarterKelas || undefined },
        responseType: 'blob' as any,
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekapan_Adab_Siswa_${quarterStartMonth}_3_Bulan${quarterKelas ? `_Kelas_${quarterKelas}` : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowQuarterExport(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Gagal mengunduh export 3 bulan');
    }
  };

  // Student view states
  const [studentInfo, setStudentInfo] = useState<{ nis: string; nama: string; kelasId?: number; kelasNama?: string } | null>(null);
  const [studentStatusMap, setStudentStatusMap] = useState<Record<number, "Ya" | "Tidak" | undefined>>({});
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  // Roster siswa per kelas untuk tampilan guru/admin
  const [classStudents, setClassStudents] = useState<{ nis: string; nama: string }[]>([]);
  const [rosterLoading, setRosterLoading] = useState<boolean>(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  // Pemetaan status monitoring per NIS berdasarkan hasil monitoring-details saat ini
  const statusByNis = useMemo(() => {
    const map: Record<string, "Ya" | "Tidak" | undefined> = {};
    details.forEach((d) => {
      if (d.nis) {
        map[d.nis] = (d.status_pelaksanaan as "Ya" | "Tidak" | null) || undefined;
      }
    });
    return map;
  }, [details]);

  // Komponen kuesioner (CRUD + persist ke backend)
  interface QuestionItem { id: number; text: string }
  interface ComponentItem { id: number; title: string; questions: QuestionItem[] }
  const [components, setComponents] = useState<ComponentItem[]>([]);
  // Inline forms (to avoid window.prompt in Trae)
  const [showAddComponentForm, setShowAddComponentForm] = useState<boolean>(false);
  const [newComponentTitle, setNewComponentTitle] = useState<string>("");
  const [pendingQuestionComponentId, setPendingQuestionComponentId] = useState<number | null>(null);
  const [newQuestionText, setNewQuestionText] = useState<string>("");

  const loadComponents = async () => {
    try {
      const res = await api.get(`/v1/adab-components`, { params: { include_questions: true } });
      const data = res.data?.data || res.data; // handle resource or plain
      const mapped: ComponentItem[] = (data || []).map((c: any) => ({
        id: Number(c.id_component ?? c.id ?? c.id_component_id ?? c.idComponent ?? c.id),
        title: String(c.nama_component ?? c.title ?? c.nama),
        questions: (c.questions || c.pertanyaan || []).map((q: any) => ({
          id: Number(q.id_question ?? q.id ?? q.id_question_id ?? q.idQuestion ?? q.id),
          text: String(q.teks_pertanyaan ?? q.text ?? q.teks),
        })),
      }));
      setComponents(mapped);
    } catch (err) {
      // ignore for now
    }
  };

  useEffect(() => { loadComponents(); }, []);

  // Defaultkan tanggal ke hari ini untuk Admin/Guru agar rekap tidak kosong
  useEffect(() => {
    if (isTeacherOrAdmin && !tanggal) {
      setTanggal(todayStr);
    }
  }, [isTeacherOrAdmin, tanggal, todayStr]);

  const addComponent = () => {
    setShowAddComponentForm(true);
    setNewComponentTitle("");
  };

  const submitNewComponent = async () => {
    const title = newComponentTitle.trim();
    if (!title) { alert('Nama komponen wajib diisi'); return; }
    try {
      const res = await api.post(`/v1/adab-components`, { nama_component: title, urutan: (components.length || 0) + 1, status: 'Aktif' });
      const c = res.data?.data || res.data;
      const newItem: ComponentItem = { id: Number(c.id_component ?? c.id), title: String(c.nama_component ?? title), questions: [] };
      setComponents((prev) => [...prev, newItem]);
      setShowAddComponentForm(false);
      setNewComponentTitle("");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menambah komponen");
    }
  };

  const cancelNewComponent = () => {
    setShowAddComponentForm(false);
    setNewComponentTitle("");
  };

  const editComponentTitle = async (id: number) => {
    const current = components.find((c) => c.id === id);
    const title = window.prompt("Nama komponen", current?.title || "");
    if (title == null) return;
    try {
      await api.put(`/v1/adab-components/${id}`, { nama_component: title });
      setComponents((prev) => prev.map((c) => c.id === id ? { ...c, title } : c));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal mengedit komponen");
    }
  };

  const viewComponent = (id: number) => {
    const c = components.find((x) => x.id === id);
    if (!c) return;
    alert(`${c.title}\n\n${c.questions.map((q, i) => `${i+1}. ${q.text}`).join("\n")}`);
  };

  const deleteComponent = async (id: number) => {
    if (!window.confirm("Yakin hapus komponen ini?")) return;
    try {
      await api.delete(`/v1/adab-components/${id}`);
      setComponents((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menghapus komponen");
    }
  };

  const startAddQuestion = (id: number) => {
    setPendingQuestionComponentId(id);
    setNewQuestionText("");
  };

  const submitNewQuestion = async () => {
    const id = pendingQuestionComponentId;
    const text = newQuestionText.trim();
    if (!id) return;
    if (!text) { alert('Teks pertanyaan wajib diisi'); return; }
    try {
      const comp = components.find((c) => c.id === id);
      const urutan = (comp?.questions.length || 0) + 1;
      const res = await api.post(`/v1/adab-questions`, { id_component: id, teks_pertanyaan: text, urutan, status: 'Aktif' });
      const q = res.data?.data || res.data;
      const newQ: QuestionItem = { id: Number(q.id_question ?? q.id), text };
      setComponents((prev) => prev.map((c) => c.id === id ? { ...c, questions: [...c.questions, newQ] } : c));
      setPendingQuestionComponentId(null);
      setNewQuestionText("");
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menambah pertanyaan");
    }
  };

  const cancelNewQuestion = () => {
    setPendingQuestionComponentId(null);
    setNewQuestionText("");
  };

  const editQuestion = async (id: number, idx: number) => {
    const c = components.find((x) => x.id === id);
    const current = c?.questions[idx];
    const text = window.prompt("Edit pertanyaan", current?.text || "");
    if (text == null || !current) return;
    try {
      await api.put(`/v1/adab-questions/${current.id}`, { teks_pertanyaan: text });
      setComponents((prev) => prev.map((c) => c.id === id ? { ...c, questions: c.questions.map((q, i) => i === idx ? { ...q, text } : q) } : c));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal mengedit pertanyaan");
    }
  };

  const viewQuestion = (id: number, idx: number) => {
    const c = components.find((x) => x.id === id);
    const q = c?.questions[idx];
    if (!q) return;
    alert(q.text);
  };

  const deleteQuestion = async (id: number, idx: number) => {
    const c = components.find((x) => x.id === id);
    const q = c?.questions[idx];
    if (!q) return;
    if (!window.confirm("Yakin hapus pertanyaan ini?")) return;
    try {
      await api.delete(`/v1/adab-questions/${q.id}`);
      setComponents((prev) => prev.map((c) => c.id === id ? { ...c, questions: c.questions.filter((_, i) => i !== idx) } : c));
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Gagal menghapus pertanyaan");
    }
  };

  const [answers, setAnswers] = useState<Record<string, "Ya" | "Tidak" | undefined>>({});
  const setAnswer = (catIndex: number, qIndex: number, value: "Ya" | "Tidak") => {
    const key = `c${catIndex}-q${qIndex}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };
  const totalYes = useMemo(() => Object.values(answers).filter((v) => v === "Ya").length, [answers]);
  const totalQs = useMemo(() => components.reduce((acc, c) => acc + c.questions.length, 0), [components]);

  const handleExportTemplate = () => {
    const headers = ["Komponen", "Pertanyaan"];
    const rows: string[][] = [];
    components.forEach((c) => {
      c.questions.forEach((q) => rows.push([c.title, q.text]));
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Template_Kuesioner_Adab_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const resetAnswers = () => {
    setAnswers({});
  };

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
        if (!selectedTugas && data.length > 0) {
          setSelectedTugas(String(data[0].id_tugas_adab));
        }
      } catch {}
    };
    loadTugasOptions();
  }, []);

  // Ambil roster siswa berdasarkan kelas terpilih (untuk tampilan guru/admin)
  useEffect(() => {
    const fetchRoster = async () => {
      if (!kelasId) { setClassStudents([]); return; }
      setRosterLoading(true);
      setRosterError(null);
      try {
        const resp = await api.get(`/v1/tugas/siswa/${kelasId}`);
        const siswaList = Array.isArray(resp.data?.data) ? resp.data.data : [];
        const mapped = siswaList.map((s: any) => ({
          nis: s.nis,
          nama: s.nama_lengkap || s.nama_siswa || s.nama || "",
        }));
        setClassStudents(mapped);
      } catch (err: any) {
        // Fallback: ambil semua siswa lalu filter berdasarkan id_kelas
        try {
          const resp2 = await api.get('/siswa', { params: { per_page: 1000 } });
          const list = Array.isArray(resp2.data?.data?.data)
            ? resp2.data.data.data
            : (Array.isArray(resp2.data?.data) ? resp2.data.data : []);
          const filtered = list
            .filter((s: any) => String(s.id_kelas) === String(kelasId))
            .map((s: any) => ({ nis: s.nis, nama: s.nama_lengkap || s.nama || '' }));
          setClassStudents(filtered);
        } catch (e2: any) {
          setRosterError(err?.response?.data?.message || 'Gagal memuat daftar siswa');
        }
      } finally {
        setRosterLoading(false);
      }
    };
    fetchRoster();
  }, [kelasId]);

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
      alert("Setel tanggal terlebih dahulu");
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
      showToast('Berhasil menyimpan monitoring hari ini.', 'success');
      // Set tanggal ke hari ini agar rekap langsung memuat
      if (!tanggal) {
        setTanggal(todayStr);
      }
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.message || 'Gagal menyimpan monitoring', 'error');
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
                <button
                  type="button"
                  onClick={openMonthlyExport}
                  className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export Bulanan
                </button>
                <button
                  type="button"
                  onClick={openQuarterExport}
                  className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export 3 Bulan
                </button>
                <button
                  type="button"
                  onClick={addComponent}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tambah Komponen
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

          {/* Checklist Adab Hari Ini dihapus untuk menghindari kebingungan */}

          {/* Kuesioner 12 Pertanyaan (3 komponen x 4 pertanyaan) - layout tiga kartu */}
          <div className="bg-purple-100 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Kuesioner Adab Harian</h3>
              <div className="text-sm text-purple-800">Skor hari ini: <span className="font-semibold">{totalYes}</span> dari {totalQs}</div>
            </div>
            {isTeacherOrAdmin && showAddComponentForm && (
              <div className="mb-4 bg-white rounded-lg p-4 shadow flex items-center gap-2">
                <input
                  type="text"
                  value={newComponentTitle}
                  onChange={(e) => setNewComponentTitle(e.target.value)}
                  placeholder="Nama komponen baru"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button type="button" onClick={submitNewComponent} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                <button type="button" onClick={cancelNewComponent} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {components.map((cat, ci) => (
                <div key={cat.id} className="bg-white rounded-lg p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-700" />
                      <h4 className="font-semibold text-purple-800">{cat.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTeacherOrAdmin && (
                        <>
                          <button title="Tambah Pertanyaan" onClick={() => startAddQuestion(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><PlusCircle className="h-4 w-4" /></button>
                          <button title="Lihat Komponen" onClick={() => viewComponent(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><Eye className="h-4 w-4" /></button>
                          <button title="Edit Komponen" onClick={() => editComponentTitle(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><Edit className="h-4 w-4" /></button>
                          <button title="Hapus Komponen" onClick={() => deleteComponent(cat.id)} className="p-1 rounded hover:bg-purple-50 text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </div>
                  {isTeacherOrAdmin && pendingQuestionComponentId === cat.id && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Teks pertanyaan baru"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      <button type="button" onClick={submitNewQuestion} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                      <button type="button" onClick={cancelNewQuestion} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                    </div>
                  )}
                  <div className="border-t mb-3"></div>
                  <div className="space-y-3">
                    {cat.questions.map((q, qi) => {
                      const key = `c${ci}-q${qi}`;
                      const val = answers[key];
                      return (
                        <div key={qi} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm text-gray-800">{qi + 1}. {q.text}</p>
                            <div className="flex items-center gap-2">
                              {isTeacherOrAdmin && (
                                <>
                                  <button title="Lihat Pertanyaan" onClick={() => viewQuestion(cat.id, qi)} className="p-1 rounded hover:bg-gray-100 text-gray-700"><Eye className="h-4 w-4" /></button>
                                  <button title="Edit Pertanyaan" onClick={() => editQuestion(cat.id, qi)} className="p-1 rounded hover:bg-gray-100 text-gray-700"><Edit className="h-4 w-4" /></button>
                                  <button title="Hapus Pertanyaan" onClick={() => deleteQuestion(cat.id, qi)} className="p-1 rounded hover:bg-gray-100 text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <label className="inline-flex items-center gap-2"><input type="radio" name={key} value="Ya" checked={val === "Ya"} onChange={() => setAnswer(ci, qi, "Ya")} /> <span>Ya</span></label>
                            <label className="inline-flex items-center gap-2"><input type="radio" name={key} value="Tidak" checked={val === "Tidak"} onChange={() => setAnswer(ci, qi, "Tidak")} /> <span>Tidak</span></label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
              {/* Hanya tampilkan tombol Simpan Data untuk user siswa */}
              {isStudent && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (!studentInfo) { showToast('Data siswa tidak tersedia', 'error'); return; }
                    const entries: { id_question: number; jawaban: string }[] = [];
                    components.forEach((c, ci) => {
                      c.questions.forEach((q, qi) => {
                        const key = `c${ci}-q${qi}`;
                        const val = answers[key];
                        if (val) entries.push({ id_question: q.id, jawaban: val });
                      });
                    });
                    if (entries.length === 0) { showToast('Isi kuesioner terlebih dahulu', 'error'); return; }
                    await api.post('/adab-questionnaire-responses', {
                      nis: studentInfo.nis,
                      tanggal: todayStr,
                      entries,
                    });
                    // Sinkronkan ke rekap harian tugas adab yang dipilih
                    if (selectedTugas) {
                      const statusForMonitoring = (entries.length > 0 && entries.some((e) => e.jawaban === 'Ya')) ? 'Ya' : 'Tidak';
                      await api.post(`/v1/tugas-adab/${selectedTugas}/monitoring-submit`, {
                        tanggal: todayStr,
                        entries: [{ nis: studentInfo.nis, status_dilaksanakan: statusForMonitoring }],
                      });
                    }
                    showToast('Kuesioner berhasil disimpan', 'success');
                    if (!tanggal) setTanggal(todayStr);
                  } catch (e: any) {
                    showToast(e?.response?.data?.message || e?.message || 'Gagal menyimpan kuesioner', 'error');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Simpan Data
              </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter dipindahkan ke bagian Rekap Harian */}

      {/* Kelola Tugas Adab dihapus untuk penyederhanaan tampilan guru */}

      {/* Tugas Adab Aktif - tampilkan sebagai tiga kartu seperti gambar 2 */}
      {!isStudent && (
        <div className="bg-purple-100 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-700" />
              Tugas Adab Aktif (Preview Kuesioner)
            </h2>
            <div className="text-sm text-purple-800">Skor contoh: <span className="font-semibold">{totalYes}</span> dari {totalQs}</div>
          </div>
          {isTeacherOrAdmin && showAddComponentForm && (
            <div className="mb-4 bg-white rounded-lg p-4 shadow flex items-center gap-2">
              <input
                type="text"
                value={newComponentTitle}
                onChange={(e) => setNewComponentTitle(e.target.value)}
                placeholder="Nama komponen baru"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button type="button" onClick={submitNewComponent} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
              <button type="button" onClick={cancelNewComponent} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {components.map((cat, ci) => (
              <div key={cat.id} className="bg-white rounded-lg p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-700" />
                    <h3 className="font-semibold text-purple-800">{cat.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeacherOrAdmin && (
                      <>
                        <button title="Tambah Pertanyaan" onClick={() => startAddQuestion(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><PlusCircle className="h-4 w-4" /></button>
                        <button title="Lihat Komponen" onClick={() => viewComponent(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><Eye className="h-4 w-4" /></button>
                        <button title="Edit Komponen" onClick={() => editComponentTitle(cat.id)} className="p-1 rounded hover:bg-purple-50 text-purple-700"><Edit className="h-4 w-4" /></button>
                        <button title="Hapus Komponen" onClick={() => deleteComponent(cat.id)} className="p-1 rounded hover:bg-purple-50 text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                {isTeacherOrAdmin && pendingQuestionComponentId === cat.id && (
                  <div className="mb-3 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Teks pertanyaan baru"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <button type="button" onClick={submitNewQuestion} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
                    <button type="button" onClick={cancelNewQuestion} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                  </div>
                )}
                <div className="border-t mb-3"></div>
                <div className="space-y-3">
                  {cat.questions.map((q, i) => {
                    const key = `c${ci}-q${i}`;
                    const val = answers[key];
                    return (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm text-gray-800">{i + 1}. {q.text}</p>
                          <div className="flex items-center gap-2">
                            {isTeacherOrAdmin && (
                              <>
                                <button title="Lihat Pertanyaan" onClick={() => viewQuestion(cat.id, i)} className="p-1 rounded hover:bg-gray-100 text-gray-700"><Eye className="h-4 w-4" /></button>
                                <button title="Edit Pertanyaan" onClick={() => editQuestion(cat.id, i)} className="p-1 rounded hover:bg-gray-100 text-gray-700"><Edit className="h-4 w-4" /></button>
                                <button title="Hapus Pertanyaan" onClick={() => deleteQuestion(cat.id, i)} className="p-1 rounded hover:bg-gray-100 text-red-600"><Trash2 className="h-4 w-4" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <label className="inline-flex items-center gap-2"><input type="radio" name={key} value="Ya" checked={val === 'Ya'} onChange={() => setAnswer(ci, i, 'Ya')} /> <span>Ya</span></label>
                          <label className="inline-flex items-center gap-2"><input type="radio" name={key} value="Tidak" checked={val === 'Tidak'} onChange={() => setAnswer(ci, i, 'Tidak')} /> <span>Tidak</span></label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Untuk preview guru/admin: hilangkan tombol Simpan Data dan biarkan utilitas lain bila diperlukan */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <a href="#rekap-harian" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center">Lihat Statistik</a>
            <button type="button" onClick={handleExportTemplate} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Export ke Excel</button>
            <button type="button" onClick={resetAnswers} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Reset Form</button>
          </div>
        </div>
      )}

      {/* Rekap Harian per Kelas - teacher/admin only */}
      {isTeacherOrAdmin && (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b" id="rekap-harian">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Rekap Harian per Kelas
          </h2>
          <p className="text-gray-600 text-sm mt-1">Ringkasan pelaksanaan tugas per kelas pada tanggal terpilih.</p>
        </div>
        {/* Filter Controls */}
        <div className="p-6 border-b">
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <div className="relative" onClick={() => {
                  const el = dateInputRef.current;
                  if (!el) return;
                  // @ts-ignore
                  if (typeof el.showPicker === 'function') {
                    // @ts-ignore
                    el.showPicker();
                  } else {
                    el.focus();
                  }
                }}>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    ref={dateInputRef}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
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
              ) : !tanggal ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Setel tanggal untuk melihat rekap harian</td>
                </tr>
              ) : dailyRecap.length > 0 ? (
                dailyRecap.map((item) => (
                  <tr key={`${item.id_kelas}-${item.tanggal}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_kelas || '-'}</td>
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
        {/* Daftar nama siswa pada kelas terpilih */}
        {tanggal && kelasId && (
          <div className="p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-700" />
              Daftar Siswa – Kelas Terpilih
            </h3>
            {rosterLoading ? (
              <p className="text-gray-500">Memuat daftar siswa...</p>
            ) : rosterError ? (
              <p className="text-red-600">{rosterError}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {classStudents && classStudents.length > 0 ? (
                      classStudents.map((s, idx) => {
                        const status = statusByNis[s.nis];
                        return (
                          <tr key={s.nis} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nama}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.nis}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {status === 'Ya' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-green-800 bg-green-100 text-xs">Ya</span>
                              )}
                              {status === 'Tidak' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-orange-800 bg-orange-100 text-xs">Tidak</span>
                              )}
                              {!status && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-red-800 bg-red-100 text-xs">Belum</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada data siswa untuk filter ini</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Modal Export Bulanan */}
      {showMonthlyExport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Export Bulanan</h3>
            <form onSubmit={handleDownloadMonthly} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                <input
                  type="month"
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas (opsional)</label>
                <select
                  value={exportKelas}
                  onChange={(e) => setExportKelas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k.id_kelas} value={String(k.id_kelas)}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeMonthlyExport} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Unduh Excel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Export 3 Bulan */}
      {showQuarterExport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Export 3 Bulan</h3>
            <form onSubmit={handleDownloadQuarterly} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Awal</label>
                <input
                  type="month"
                  value={quarterStartMonth}
                  onChange={(e) => setQuarterStartMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Akan menggabungkan data 3 bulan berturut-turut.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas (opsional)</label>
                <select
                  value={quarterKelas}
                  onChange={(e) => setQuarterKelas(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Semua Kelas</option>
                  {kelasOptions.map((k) => (
                    <option key={k.id_kelas} value={String(k.id_kelas)}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closeQuarterExport} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Unduh Excel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel detail monitoring dihapus untuk penyederhanaan tampilan guru */}
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}