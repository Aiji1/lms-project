'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';

interface Hafalan {
  id_hafalan: number;
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  nama_surah: string;
  ayat_mulai: number;
  ayat_selesai: number;
  jumlah_baris: number;
  tanggal_setoran: string;
  status_hafalan: 'Lancar' | 'Kurang_Lancar' | 'Belum_Lancar';
  nik_guru_penguji?: string;
  nama_guru_penguji?: string;
  catatan?: string;
}

type BarisKey = 3 | 5 | 7;

// Daftar surat Al-Qur'an (nama disederhanakan, urut dari awal sampai akhir)
const SURAH_INFO: { name: string; ayat: number }[] = [
  { name: 'Al Fatihah', ayat: 7 },
  { name: 'Al Baqarah', ayat: 286 },
  { name: 'Ali Imran', ayat: 200 },
  { name: 'An Nisa', ayat: 176 },
  { name: "Al Maidah", ayat: 120 },
  { name: "Al Anam", ayat: 165 },
  { name: "Al Araf", ayat: 206 },
  { name: "Al Anfal", ayat: 75 },
  { name: "At Taubah", ayat: 129 },
  { name: 'Yunus', ayat: 109 },
  { name: 'Hud', ayat: 123 },
  { name: 'Yusuf', ayat: 111 },
  { name: "Ar Rad", ayat: 43 },
  { name: 'Ibrahim', ayat: 52 },
  { name: 'Al Hijr', ayat: 99 },
  { name: 'An Nahl', ayat: 128 },
  { name: "Al Isra", ayat: 111 },
  { name: 'Al Kahfi', ayat: 110 },
  { name: 'Maryam', ayat: 98 },
  { name: 'Ta Ha', ayat: 135 },
  { name: 'Al Anbiya', ayat: 112 },
  { name: 'Al Hajj', ayat: 78 },
  { name: "Al Muminun", ayat: 118 },
  { name: 'An Nur', ayat: 64 },
  { name: 'Al Furqan', ayat: 77 },
  { name: "Asy Syuara", ayat: 227 },
  { name: 'An Naml', ayat: 93 },
  { name: 'Al Qasas', ayat: 88 },
  { name: "Al Ankabut", ayat: 69 },
  { name: 'Ar Rum', ayat: 60 },
  { name: 'Luqman', ayat: 34 },
  { name: 'As Sajdah', ayat: 30 },
  { name: 'Al Ahzab', ayat: 73 },
  { name: "Saba", ayat: 54 },
  { name: 'Fatir', ayat: 45 },
  { name: 'Ya Sin', ayat: 83 },
  { name: 'As Saffat', ayat: 182 },
  { name: 'Sad', ayat: 88 },
  { name: 'Az Zumar', ayat: 75 },
  { name: 'Ghafir', ayat: 85 },
  { name: 'Fussilat', ayat: 54 },
  { name: 'Asy Syura', ayat: 53 },
  { name: 'Az Zukhruf', ayat: 89 },
  { name: 'Ad Dukhan', ayat: 59 },
  { name: 'Al Jasiyah', ayat: 37 },
  { name: 'Al Ahqaf', ayat: 35 },
  { name: 'Muhammad', ayat: 38 },
  { name: 'Al Fath', ayat: 29 },
  { name: 'Al Hujurat', ayat: 18 },
  { name: 'Qaf', ayat: 45 },
  { name: 'Adz Dzariyat', ayat: 60 },
  { name: 'At Tur', ayat: 49 },
  { name: 'An Najm', ayat: 62 },
  { name: 'Al Qamar', ayat: 55 },
  { name: 'Ar Rahman', ayat: 78 },
  { name: "Al Waqiah", ayat: 96 },
  { name: 'Al Hadid', ayat: 29 },
  { name: 'Al Mujadilah', ayat: 22 },
  { name: 'Al Hasyr', ayat: 24 },
  { name: 'Al Mumtahanah', ayat: 13 },
  { name: 'As Saff', ayat: 14 },
  { name: 'Al Jumuah', ayat: 11 },
  { name: 'Al Munafiqun', ayat: 11 },
  { name: 'At Taghabun', ayat: 18 },
  { name: 'At Talaq', ayat: 12 },
  { name: 'At Tahrim', ayat: 12 },
  { name: 'Al Mulk', ayat: 30 },
  { name: 'Al Qalam', ayat: 52 },
  { name: 'Al Haqqah', ayat: 52 },
  { name: "Al Maarij", ayat: 44 },
  { name: 'Nuh', ayat: 28 },
  { name: 'Al Jinn', ayat: 28 },
  { name: 'Al Muzzammil', ayat: 20 },
  { name: 'Al Muddatsir', ayat: 56 },
  { name: 'Al Qiyamah', ayat: 40 },
  { name: 'Al Insan', ayat: 31 },
  { name: 'Al Mursalat', ayat: 50 },
  { name: 'An Naba', ayat: 40 },
  { name: 'An Naziat', ayat: 46 },
  { name: 'Abasa', ayat: 42 },
  { name: 'At Takwir', ayat: 29 },
  { name: 'Al Infitar', ayat: 19 },
  { name: 'Al Mutaffifin', ayat: 36 },
  { name: 'Al Insyiqaq', ayat: 25 },
  { name: 'Al Buruj', ayat: 22 },
  { name: 'At Tariq', ayat: 17 },
  { name: 'Al Ala', ayat: 19 },
  { name: 'Al Ghasyiyah', ayat: 26 },
  { name: 'Al Fajr', ayat: 30 },
  { name: 'Al Balad', ayat: 20 },
  { name: 'Asy Syams', ayat: 15 },
  { name: 'Al Lail', ayat: 21 },
  { name: 'Adh Dhuha', ayat: 11 },
  { name: 'Asy Syarh', ayat: 8 },
  { name: 'At Tin', ayat: 8 },
  { name: "Al Alaq", ayat: 19 },
  { name: 'Al Qadr', ayat: 5 },
  { name: 'Al Bayyinah', ayat: 8 },
  { name: 'Az Zalzalah', ayat: 8 },
  { name: "Al Adiyat", ayat: 11 },
  { name: 'Al Qariah', ayat: 11 },
  { name: 'At Takatsur', ayat: 8 },
  { name: 'Al Asr', ayat: 3 },
  { name: 'Al Humazah', ayat: 9 },
  { name: 'Al Fil', ayat: 5 },
  { name: 'Quraisy', ayat: 4 },
  { name: 'Al Maun', ayat: 7 },
  { name: 'Al Kausar', ayat: 3 },
  { name: 'Al Kafirun', ayat: 6 },
  { name: 'An Nasr', ayat: 3 },
  { name: 'Al Lahab', ayat: 5 },
  { name: 'Al Ikhlas', ayat: 4 },
  { name: 'Al Falaq', ayat: 5 },
  { name: 'An Nas', ayat: 6 },
];

interface TargetHalaqoh {
  id_target_hafalan: number;
  nis: string;
  target_baris_perpertemuan: number; // 3,5,7
  status: 'Aktif' | 'Non-aktif';
}

interface EvaluasiTarget {
  id_evaluasi: number;
  nis: string;
  periode_evaluasi: 'Bulanan' | '3_Bulanan' | 'Semesteran';
  bulan_periode?: string;
  target_surah_mulai?: string;
  target_ayat_mulai?: number;
  target_surah_selesai?: string;
  target_ayat_selesai?: number;
}

interface SiswaFormData {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface StudentRow {
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  latest?: Hafalan | null;
}

interface HalaqohMapEntry {
  halaqoh?: number;
  guruNik?: string;
}

export default function HafalanPage() {
  const [hafalan, setHafalan] = useState<Hafalan[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetHalaqoh | undefined>>({});
  const [evalTargets, setEvalTargets] = useState<Record<string, EvaluasiTarget | undefined>>({});
  const [students, setStudents] = useState<StudentRow[]>([]); // satu baris per siswa
  const [rowSelections, setRowSelections] = useState<Record<string, { kelompok?: string; musyrif?: string; halaqoh?: number; surat?: string; ayatMulai?: number; ayatSelesai?: number; baris?: number; target?: number; targetKey?: string }>>({});
  // Preferensi halaqoh per siswa (disimpan sekali lalu dipakai seterusnya)
  const [halaqohPrefs, setHalaqohPrefs] = useState<Record<string, number | undefined>>({});
  const [targetTemplates, setTargetTemplates] = useState<Record<BarisKey, { surat: string; ayat: number }[]>>({ 3: [], 5: [], 7: [] });
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [options, setOptions] = useState<{ musyrif: string[]; halaqoh: number[]; surah: string[]; ayatBySurah: Record<string, number[]> }>({ musyrif: [], halaqoh: [], surah: [], ayatBySurah: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [guruOptions, setGuruOptions] = useState<{ nik: string; nama: string }[]>([]);
  const [selectedPengujiNik, setSelectedPengujiNik] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHafalan, setSelectedHafalan] = useState<Hafalan | null>(null);
  const [selectedNis, setSelectedNis] = useState<string>('');
  const [exportMonth, setExportMonth] = useState<string>(''); // format YYYY-MM
  const [exportQuarterEndMonth, setExportQuarterEndMonth] = useState<string>(''); // format YYYY-MM
  const [showMonthlyExport, setShowMonthlyExport] = useState(false);
  const [showQuarterExport, setShowQuarterExport] = useState(false);
  const [exportKelas, setExportKelas] = useState<string>('');
  const [tanggalSetoran, setTanggalSetoran] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  // Track rows already saved for selected date, and per-row edit mode
  const [savedToday, setSavedToday] = useState<Record<string, number>>({}); // nis -> id_hafalan
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({}); // nis -> editing flag
  const [presenceToday, setPresenceToday] = useState<Record<string, boolean>>({}); // nis -> hadir flag
  // Data Halaqoh map: nis -> { halaqoh, guruNik }
  const [halaqohMap, setHalaqohMap] = useState<Record<string, HalaqohMapEntry>>({});
  // Modal Data Halaqoh
  // Modal Halaqoh dihilangkan; gunakan halaman terpisah untuk pengaturan Halaqoh
  // Filter Guru/Musyrif untuk tampilan siswa
  const [filterGuruNik, setFilterGuruNik] = useState<string>('');
  const auth = useAuth();

  // Ref ke SVG grafik bulanan untuk kebutuhan ekspor
  const monthlySvgRef = useRef<SVGSVGElement | null>(null);

  // Unduh grafik bulanan sebagai PNG
  function handleDownloadMonthlyGraph() {
    const svgEl = monthlySvgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const vb = svgEl.viewBox.baseVal;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(vb.width || svgEl.clientWidth || 800));
    canvas.height = Math.max(1, Math.floor(vb.height || svgEl.clientHeight || 420));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'grafik-bulanan.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
  }

  useEffect(() => {
    if (templatesLoaded) {
      fetchData();
    }
  }, [templatesLoaded]);

  // Auto-select Musyrif berdasarkan akun guru yang login, dan sinkronkan sebagai penguji default
  useEffect(() => {
    const nik = auth.user?.reference_id || '';
    if (auth.userRole === 'Guru' && nik) {
      if (!filterGuruNik) setFilterGuruNik(nik);
      if (!selectedPengujiNik) setSelectedPengujiNik(nik);
    }
  }, [auth.user, auth.userRole]);

  // Saat filter Musyrif berubah, sinkronkan juga ke penguji global (fallback saat simpan)
  useEffect(() => {
    if (filterGuruNik) setSelectedPengujiNik(filterGuruNik);
  }, [filterGuruNik]);

  // Saat modal Export Bulanan dibuka, isi bulan realtime dan kelas sesuai filter
  useEffect(() => {
    if (showMonthlyExport) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setExportMonth(`${y}-${m}`);
      setExportKelas(kelasFilter || '');
    }
  }, [showMonthlyExport, kelasFilter]);

  // Load target templates (3/5/7 baris) dari localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('hafalan_target_templates') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setTargetTemplates(p => ({ ...p, ...parsed }));
      } else {
        // Default contoh
        const sample = {
          3: [
            { surat: 'An Naba', ayat: 13 },
            { surat: 'An Naba', ayat: 24 },
            { surat: 'An Naba', ayat: 36 },
            { surat: 'An Naba', ayat: 40 },
          ],
          5: [
            { surat: 'An Naba', ayat: 13 },
            { surat: 'An Naba', ayat: 24 },
            { surat: 'An Naba', ayat: 36 },
            { surat: 'An Naba', ayat: 40 },
          ],
          7: [
            { surat: 'An Naba', ayat: 13 },
            { surat: 'An Naba', ayat: 24 },
            { surat: 'An Naba', ayat: 36 },
            { surat: 'An Naba', ayat: 40 },
          ],
        };
        setTargetTemplates(sample);
      }
    } catch {}
    setTemplatesLoaded(true);
  }, []);

  // Reset input dan penanda saat tanggal setoran berubah
  useEffect(() => {
    // Prefill halaqoh per siswa dari localStorage saat ganti hari
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('hafalan_halaqoh_pref') : null;
      const prefs: Record<string, number | undefined> = raw ? JSON.parse(raw) : {};
      const newSelections: typeof rowSelections = {};
      students.forEach((s) => {
        const h = prefs[s.nis];
        newSelections[s.nis] = h ? { halaqoh: h } : {};
      });
      // Rehydrate form rows yang pernah diisi pada tanggal ini jika ada
      try {
        const rowsRaw = typeof window !== 'undefined' ? localStorage.getItem(`hafalan_rows_${tanggalSetoran}`) : null;
        const parsed: typeof rowSelections | null = rowsRaw ? JSON.parse(rowsRaw) : null;
        setRowSelections(parsed || newSelections);
      } catch {
        setRowSelections(newSelections);
      }
    } catch {
      setRowSelections({});
    }
    // Matikan mode edit per baris
    setEditingRows({});
    // Reset status hadir untuk tanggal baru
    setPresenceToday({});
    // Hitung ulang baris yang tersimpan untuk tanggal baru
    const savedMap: Record<string, number> = {};
    hafalan.forEach((h) => {
      if (h.tanggal_setoran === tanggalSetoran) {
        savedMap[h.nis] = h.id_hafalan;
      }
    });
    setSavedToday(savedMap);

    // Prefill nilai yang tersimpan ke form agar tetap terlihat pada hari yang sama
    if (Object.keys(savedMap).length > 0) {
      const merged: typeof rowSelections = { ...rowSelections };
      hafalan.forEach((h) => {
        if (h.tanggal_setoran === tanggalSetoran) {
          merged[h.nis] = {
            ...merged[h.nis],
            surat: h.nama_surah,
            ayatMulai: h.ayat_mulai,
            ayatSelesai: h.ayat_selesai,
            baris: h.jumlah_baris,
          };
        }
      });
      setRowSelections(merged);
    }
  }, [tanggalSetoran, hafalan]);

  // Persist rowSelections agar tidak hilang saat refresh
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`hafalan_rows_${tanggalSetoran}`, JSON.stringify(rowSelections));
      }
    } catch {}
  }, [rowSelections, tanggalSetoran]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hafalanResponse, formDataResponse, targetResponse, evaluasiResponse, guruResponse] = await Promise.all([
        api.get('/v1/hafalan'),
        api.get('/v1/hafalan-form-data'),
        api.get('/v1/target-hafalan-siswa', { params: { status: 'Aktif', per_page: 1000 }}),
        api.get('/v1/evaluasi-hafalan', { params: { per_page: 1000 }}),
        api.get('/v1/guru', { params: { per_page: 1000 }})
      ]);

      // Simpan daftar baris siswa hasil agregasi hafalan agar bisa digabung dengan form data
      let studentRowsLocal: StudentRow[] = [];

      if (hafalanResponse.data.success) {
        const list: Hafalan[] = hafalanResponse.data.data.data || [];
        setHafalan(list);

        // Agregasi satu baris per siswa (rekaman terbaru berdasarkan tanggal_setoran)
        const latestByNis: Record<string, Hafalan> = {};
        list.forEach((r) => {
          const cur = latestByNis[r.nis];
          if (!cur || new Date(r.tanggal_setoran) > new Date(cur.tanggal_setoran)) {
            latestByNis[r.nis] = r;
          }
        });
        const studentsArrLatest = Object.values(latestByNis).sort((a, b) => (a.nama_siswa || '').localeCompare(b.nama_siswa || ''));
        const studentRows = studentsArrLatest.map((r) => ({
          nis: r.nis,
          nama_siswa: r.nama_siswa,
          nama_kelas: r.nama_kelas,
          latest: r,
        }));
        setStudents(studentRows);
        studentRowsLocal = studentRows;

        // Siapkan opsi dropdown dari data hafalan
        const musyrifSet = new Set<string>();
        const halaqohSet = new Set<number>();
        const surahSet = new Set<string>();
        list.forEach((r) => {
          if (r.nama_guru_penguji) musyrifSet.add(r.nama_guru_penguji);
          if (r.jumlah_baris) halaqohSet.add(r.jumlah_baris);
          if (r.nama_surah) surahSet.add(r.nama_surah);
        });
        // Default ayat untuk setiap surat berdasarkan jumlah ayat resminya
        const defaultAyatBySurah: Record<string, number[]> = Object.fromEntries(
          SURAH_INFO.map((info) => [info.name, Array.from({ length: info.ayat }, (_, i) => i + 1)])
        );
        setOptions({
          musyrif: Array.from(musyrifSet).sort(),
          halaqoh: Array.from(halaqohSet).sort((a, b) => a - b),
          surah: SURAH_INFO.map((s) => s.name),
          ayatBySurah: defaultAyatBySurah,
        });

        // Jangan mengosongkan input saat refresh data; biarkan tetap terlihat
        // Data harian tetap kosong saat ganti tanggal via useEffect tanggalSetoran

        // Tandai baris yang sudah tersimpan pada tanggal terpilih
        const savedMap: Record<string, number> = {};
        list.forEach((h) => {
          if (h.tanggal_setoran === tanggalSetoran) {
            savedMap[h.nis] = h.id_hafalan;
          }
        });
        setSavedToday(savedMap);

        // Prefill kolom Setoran Hari Ini dari data yang tersimpan pada tanggal terpilih
        if (Object.keys(savedMap).length > 0) {
          const merged: typeof rowSelections = { ...rowSelections };
          list.forEach((h) => {
            if (h.tanggal_setoran === tanggalSetoran) {
              merged[h.nis] = {
                ...merged[h.nis],
                surat: h.nama_surah,
                ayatMulai: h.ayat_mulai,
                ayatSelesai: h.ayat_selesai,
                baris: h.jumlah_baris,
              };
            }
          });
          setRowSelections(merged);
        }
      }

      // Guru options
      if (guruResponse?.data?.success) {
        const raw = guruResponse?.data?.data?.data || guruResponse?.data?.data || [];
        const gos: { nik: string; nama: string }[] = raw
          .filter((g: any) => (g.status ?? 'Aktif') === 'Aktif')
          .map((g: any) => ({ nik: String(g.nik_guru), nama: g.nama_lengkap }));
        setGuruOptions(gos);
        // Jika ada musyrif dari baris terbaru, coba cocokkan otomatis sebagai default
        const anyMusyrif = Object.values(rowSelections).find(r => r?.musyrif);
        if (anyMusyrif?.musyrif) {
          const guess = gos.find(g => g.nama === anyMusyrif?.musyrif);
          if (guess) setSelectedPengujiNik(guess.nik);
        }
      }

      // Gabungkan daftar siswa dari form-data dan daftar siswa aktif (selalu)
      {
        let siswaForm: SiswaFormData[] = [];
        let siswaAktif: SiswaFormData[] = [];
        try {
          if (formDataResponse?.data?.success) {
            siswaForm = formDataResponse?.data?.data?.siswa || [];
          }
        } catch {}
        try {
          const fallbackRes = await api.get('/v1/siswa', { params: { per_page: 1000 } });
          const raw = fallbackRes?.data?.data?.data || fallbackRes?.data?.data || [];
          siswaAktif = (raw || []).map((s: any) => ({
            nis: s.nis,
            nama_lengkap: s.nama_lengkap || s.nama_siswa || s.nama,
            nama_kelas: s.nama_kelas || s.kelas || '',
          }));
        } catch {}

        const semuaSiswa: SiswaFormData[] = [];
        const seen = new Set<string>();
        [...siswaForm, ...siswaAktif].forEach((s) => {
          if (!seen.has(s.nis)) {
            semuaSiswa.push(s);
            seen.add(s.nis);
          }
        });

        // Gabungkan daftar siswa dari hafalan terbaru dan daftar siswa (union)
        const map = new Map<string, StudentRow>();
        studentRowsLocal.forEach((row) => map.set(row.nis, row));
        semuaSiswa.forEach((s) => {
          const existing = map.get(s.nis);
          if (existing) {
            map.set(s.nis, {
              ...existing,
              nama_siswa: s.nama_lengkap,
              nama_kelas: s.nama_kelas,
            });
          } else {
            map.set(s.nis, {
              nis: s.nis,
              nama_siswa: s.nama_lengkap,
              nama_kelas: s.nama_kelas,
              latest: null,
            });
          }
        });

        const merged = Array.from(map.values()).sort((a, b) => (a.nama_siswa || '').localeCompare(b.nama_siswa || ''));
        setStudents(merged);

        // Opsi kelas untuk filter
        const kelasSet = new Set<string>();
        semuaSiswa.forEach((s) => { if (s.nama_kelas) kelasSet.add(s.nama_kelas); });
        setKelasOptions(Array.from(kelasSet).sort());

        // Prefill ulang selections untuk siswa yang belum punya hafalan
        setRowSelections((prev) => {
          const next = { ...prev };
          merged.forEach((row) => {
            if (!next[row.nis]) next[row.nis] = {};
            // Prefill halaqoh default jika belum ada: utamakan dari Data Halaqoh map
            if (next[row.nis].halaqoh === undefined) {
              const mapped = halaqohMap[row.nis]?.halaqoh;
              const pref = halaqohPrefs[row.nis];
              const def = mapped !== undefined ? mapped : (pref !== undefined ? pref : undefined);
              if (def !== undefined) {
                next[row.nis].halaqoh = def;
              }
            }
          });
          return next;
        });
      }

      if (targetResponse.data.success) {
        const list = targetResponse.data.data.data || [];
        const map: Record<string, TargetHalaqoh> = {};
        list.forEach((t: any) => {
          if (t.status === 'Aktif') {
            map[t.nis] = {
              id_target_hafalan: t.id_target_hafalan,
              nis: t.nis,
              target_baris_perpertemuan: t.target_baris_perpertemuan,
              status: t.status,
            };
          }
        });
        setTargets(map);
      }

      if (evaluasiResponse.data.success) {
        const list = evaluasiResponse.data.data.data || [];
        const map: Record<string, EvaluasiTarget> = {};
        list.forEach((e: any) => {
          const current = map[e.nis];
          if (!current || e.id_evaluasi > current.id_evaluasi) {
            map[e.nis] = {
              id_evaluasi: e.id_evaluasi,
              nis: e.nis,
              periode_evaluasi: e.periode_evaluasi,
              bulan_periode: e.bulan_periode,
              target_surah_mulai: e.target_surah_mulai,
              target_ayat_mulai: e.target_ayat_mulai,
              target_surah_selesai: e.target_surah_selesai,
              target_ayat_selesai: e.target_ayat_selesai,
            };
          }
        });
        setEvalTargets(map);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Muat preferensi halaqoh dari localStorage sekali saat awal
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('hafalan_halaqoh_pref') : null;
      const prefs: Record<string, number | undefined> = raw ? JSON.parse(raw) : {};
      setHalaqohPrefs(prefs);
    } catch {}
  }, []);

  // Muat Data Halaqoh map (halaqoh & guruNik) dari localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('hafalan_halaqoh_map') : null;
      const parsed: Record<string, HalaqohMapEntry> = raw ? JSON.parse(raw) : {};
      setHalaqohMap(parsed);
    } catch {}
  }, []);

  // Jika target aktif tersedia dan belum ada pada rowSelections, gunakan target sebagai default
  useEffect(() => {
    setRowSelections((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        const cur = next[s.nis] || {};
        if (cur.halaqoh === undefined) {
          const mapped = halaqohMap[s.nis]?.halaqoh;
          const pref = halaqohPrefs[s.nis];
          const def = mapped !== undefined ? mapped : (pref !== undefined ? pref : (targets[s.nis]?.target_baris_perpertemuan ?? undefined));
          if (def !== undefined) next[s.nis] = { ...cur, halaqoh: def };
        }
      });
      return next;
    });
  }, [students, targets, halaqohPrefs, halaqohMap]);

  const handleDelete = async () => {
    if (!selectedHafalan) return;

    try {
      const response = await api.delete(`/v1/hafalan/${selectedHafalan.id_hafalan}`);
      if (response.data.success) {
        await fetchData();
        setShowDeleteModal(false);
        setSelectedHafalan(null);
      }
    } catch (error) {
      console.error('Error deleting hafalan:', error);
    }
  };

  // Hapus semua data hafalan pada tanggal terpilih
  const handleDeleteBySelectedDate = async () => {
    const items = hafalan.filter(h => h.tanggal_setoran === tanggalSetoran);
    if (items.length === 0) {
      alert('Tidak ada data tersimpan pada tanggal ini.');
      return;
    }
    const ok = confirm(`Hapus ${items.length} data pada tanggal ${new Date(tanggalSetoran).toLocaleDateString('id-ID')}?`);
    if (!ok) return;
    let success = 0; let fail = 0;
    for (const h of items) {
      try {
        const res = await api.delete(`/v1/hafalan/${h.id_hafalan}`);
        if (res.data?.success) success++; else fail++;
      } catch {
        fail++;
      }
    }
    await fetchData();
    setRowSelections({});
    setEditingRows({});
    setPresenceToday({});
    alert(`Hapus selesai: ${success} berhasil, ${fail} gagal.`);
  };

  // Ambil rekaman terakhir relatif terhadap tanggal yang dipilih
  function getLatestUpToDate(nis: string): Hafalan | null {
    if (!tanggalSetoran) return null;
    const pivot = new Date(tanggalSetoran);
    let best: Hafalan | null = null;
    for (const h of hafalan) {
      if (h.nis !== nis) continue;
      const hd = new Date(h.tanggal_setoran);
      // Hanya ambil setoran SEBELUM tanggal yang dipilih (bukan di hari yang sama)
      if (hd < pivot && (!best || hd > new Date(best.tanggal_setoran))) {
        best = h;
      }
    }
    return best;
  }

  // Filter untuk tampilan siswa unik (berdasarkan data relatif tanggal yang dipilih)
  const filteredStudents = students.filter(item => {
    const latestRel = getLatestUpToDate(item.nis);
    const matchesSearch = 
      item.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (latestRel?.nama_surah || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || latestRel?.status_hafalan === statusFilter;
    const matchesKelas = !kelasFilter || (item.nama_kelas || '') === kelasFilter;
    const matchesGuru = !filterGuruNik || (halaqohMap[item.nis]?.guruNik === filterGuruNik);
    return matchesSearch && matchesStatus && matchesKelas && matchesGuru;
  });

  // --- Grafik Tuntas vs Tidak Tuntas (Line Chart 7 Hari) ---

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d);
    const tuntas = hafalan.filter(h => h.tanggal_setoran === key && h.status_hafalan === 'Lancar').length;
    const tidak = hafalan.filter(h => h.tanggal_setoran === key && h.status_hafalan !== 'Lancar').length;
    return { date: key, tuntas, tidak };
  });
  const maxLine = Math.max(...last7Days.map(d => Math.max(d.tuntas, d.tidak)), 1);

  // Perbandingan Halaqoh vs Baris (Hari Ini): setiap field terisi dihitung 1
  const todaySavedCount = hafalan.filter(h => h.tanggal_setoran === tanggalSetoran).length;
  const halaqohFilledUnsaved = Object.entries(rowSelections).filter(([nis, sel]) => sel.halaqoh && !savedToday[nis]).length;
  const barisFilledUnsaved   = Object.entries(rowSelections).filter(([nis, sel]) => sel.baris   && !savedToday[nis]).length;
  const totalHalaqohToday = todaySavedCount + halaqohFilledUnsaved;
  const totalBarisToday   = todaySavedCount + barisFilledUnsaved;
  const maxTodayTotal = Math.max(totalHalaqohToday, totalBarisToday, 1);
  const isTuntasToday = totalHalaqohToday === totalBarisToday && totalHalaqohToday > 0;

  // --- Grafik Bulanan per Siswa ---
  const selectedMonthKey = tanggalSetoran.slice(0, 7); // YYYY-MM
  // Gunakan daftar siswa yang sudah difilter agar grafik mengikuti filter kelas
  const monthlyPerStudent = filteredStudents.map((s) => {
    const entries = hafalan.filter((h) => h.nis === s.nis && h.tanggal_setoran.startsWith(selectedMonthKey));
    const pertemuanSaved = entries.length;
    // Tambahkan pertemuan realtime dari form hari ini (belum tersimpan) jika terisi lengkap
    const sel = rowSelections[s.nis] || {};
    const todayUnsavedFilled = sel.surat && sel.ayatMulai && sel.ayatSelesai && !hafalan.some(h => h.nis === s.nis && h.tanggal_setoran === tanggalSetoran) && tanggalSetoran.startsWith(selectedMonthKey);
    const pertemuanTotal = pertemuanSaved + (todayUnsavedFilled ? 1 : 0);

    // Halaqoh (target baris per pertemuan) × jumlah pertemuan
    const targetBaris = (sel.halaqoh as number)
      || (halaqohMap[s.nis]?.halaqoh ?? (targets[s.nis]?.target_baris_perpertemuan ?? 0));
    const halaqohTotal = pertemuanTotal * (targetBaris || 0);

    // Baris (capaian baris per pertemuan) × jumlah pertemuan
    const barisSavedSum = entries.reduce((acc, h) => acc + (h.jumlah_baris || 0), 0);
    const barisUnsaved = todayUnsavedFilled ? (Number(sel.baris) || 0) : 0;
    const barisTotal = barisSavedSum + barisUnsaved;

    return {
      nis: s.nis,
      nama: s.nama_siswa || s.nis,
      pertemuanTotal,
      halaqohTotal,
      barisTotal,
    };
  });
  // Grafik bulanan memakai Halaqoh×Pertemuan sebagai garis dan Baris×Pertemuan sebagai bar

  const maxMonthlyTotal = Math.max(
    ...monthlyPerStudent.map((x) => Math.max(x.halaqohTotal || 0, x.barisTotal || 0)),
    1
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Lancar': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Kurang_Lancar': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'Belum_Lancar': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Belum_Lancar'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_',' ')}
      </span>
    );
  };

  // Simpan satu baris untuk NIS tertentu
  async function handleSaveRow(nis: string) {
    const sel = rowSelections[nis] || {};
    if (!sel.surat || !sel.ayatMulai || !sel.ayatSelesai) {
      alert('Lengkapi Surat dan Ayat terlebih dahulu.');
      return;
    }

    const jumlah = sel.baris ?? sel.halaqoh ?? sel.target ?? (targets[nis]?.target_baris_perpertemuan ?? 0);
    if (!jumlah || jumlah < 1) {
      alert('Isi jumlah baris atau pilih halaqoh terlebih dahulu.');
      return;
    }

    // Cek apakah sudah ada data untuk tanggal ini
    const existingToday = hafalan.find(
      (h) => h.nis === nis && h.tanggal_setoran === tanggalSetoran
    );
    if (existingToday && !editingRows[nis]) {
      alert('Data pada tanggal ini sudah tersimpan. Klik Edit untuk mengubah.');
      return;
    }

    // Tentukan nik_guru_penguji: pakai pilihan global, kalau tidak ada gunakan Data Halaqoh map, lalu cocokkan nama musyrif
    const nik = selectedPengujiNik
      || (halaqohMap[nis]?.guruNik || '')
      || (sel.musyrif ? (guruOptions.find(g => g.nama === sel.musyrif)?.nik || '') : '');
    if (!nik) {
      alert('Pilih Guru Penguji terlebih dahulu di bagian atas.');
      return;
    }

    // Tentukan status tuntas berdasarkan kecocokan ayat dengan target
    let status: 'Lancar' | 'Belum_Lancar' = 'Belum_Lancar';
    if (sel.targetKey) {
      const [tSurat, tAyatStr] = String(sel.targetKey).split('|');
      const tAyat = Number(tAyatStr);
      if (sel.surat === tSurat && sel.ayatSelesai === tAyat) {
        status = 'Lancar';
      } else {
        status = 'Belum_Lancar';
      }
    }

    const payload = {
      nis,
      nama_surah: sel.surat,
      ayat_mulai: sel.ayatMulai,
      ayat_selesai: sel.ayatSelesai,
      jumlah_baris: jumlah,
      tanggal_setoran: tanggalSetoran,
      status_hafalan: status,
      nik_guru_penguji: nik,
      catatan: '',
    };

    try {
      if (existingToday) {
        const res = await api.put(`/v1/hafalan/${existingToday.id_hafalan}`, payload);
        if (res.data?.success) {
          await fetchData();
          setEditingRows((prev) => ({ ...prev, [nis]: false }));
          alert('Berhasil memperbarui data hafalan siswa.');
        } else {
          alert(res.data?.message || 'Gagal memperbarui data hafalan.');
        }
      } else {
        const res = await api.post('/v1/hafalan', payload);
        if (res.data?.success) {
          // Tandai sebagai tersimpan
          const newId = res.data?.data?.id_hafalan;
          if (newId) setSavedToday((prev) => ({ ...prev, [nis]: newId }));
          await fetchData();
          alert('Berhasil menyimpan data hafalan siswa.');
        } else {
          alert(res.data?.message || 'Gagal menyimpan data hafalan.');
        }
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Terjadi kesalahan menyimpan data.');
    }
  }

  // Simpan semua baris yang terisi
  async function handleSaveAll() {
    const candidates = filteredStudents
      .map((s) => ({ nis: s.nis, sel: rowSelections[s.nis] || {} }))
      .filter(({ sel }) => sel.surat && sel.ayatMulai && sel.ayatSelesai);

    if (candidates.length === 0) {
      alert('Tidak ada baris yang terisi untuk disimpan.');
      return;
    }

    let ok = 0;
    let fail = 0;
    for (const { nis, sel } of candidates) {
      // Skip jika sudah tersimpan di tanggal yang sama
      const already = hafalan.some(
        (h) => h.nis === nis && h.tanggal_setoran === tanggalSetoran
      );
      if (already) continue;

      const jumlah = sel.baris ?? sel.halaqoh ?? sel.target ?? (targets[nis]?.target_baris_perpertemuan ?? 0);
      if (!jumlah || jumlah < 1) { fail++; continue; }

      const nik = selectedPengujiNik
        || (halaqohMap[nis]?.guruNik || '')
        || (sel.musyrif ? (guruOptions.find(g => g.nama === sel.musyrif)?.nik || '') : '');
      if (!nik) { fail++; continue; }

      // Tentukan status tuntas berdasarkan kecocokan ayat dengan target
      let status: 'Lancar' | 'Belum_Lancar' = 'Belum_Lancar';
      if (sel.targetKey) {
        const [tSurat, tAyatStr] = String(sel.targetKey).split('|');
        const tAyat = Number(tAyatStr);
        if (sel.surat === tSurat && sel.ayatSelesai === tAyat) {
          status = 'Lancar';
        } else {
          status = 'Belum_Lancar';
        }
      }

      const payload = {
        nis,
        nama_surah: sel.surat,
        ayat_mulai: sel.ayatMulai,
        ayat_selesai: sel.ayatSelesai,
        jumlah_baris: jumlah,
        tanggal_setoran: tanggalSetoran,
        status_hafalan: status,
        nik_guru_penguji: nik,
        catatan: '',
      };
      try {
        const res = await api.post('/v1/hafalan', payload);
        if (res.data?.success) ok++; else fail++;
      } catch {
        fail++;
      }
    }
    await fetchData();
    alert(`Selesai: ${ok} tersimpan, ${fail} gagal.`);
  }

  // Ekspor tampilan saat ini ke CSV (bisa dibuka di Excel)
  // Helper membuat dan mengunduh workbook Excel
  function downloadXlsx(data: any[], sheetName: string, filename: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  // Ekspor bulanan (berdasarkan bulan dari tanggalSetoran)
  function handleExportMonthlyXLSX() {
    const d = new Date(tanggalSetoran);
    const monthStr = exportMonth && /^\d{4}-\d{2}$/.test(exportMonth)
      ? exportMonth
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Tentukan siswa yang masuk kelompok Musyrif terpilih (membership), bukan penguji di data hafalan
    const allowedNis = new Set(
      students
        .filter((s) => (!kelasFilter || (s.nama_kelas || '') === kelasFilter))
        .filter((s) => (!filterGuruNik || (halaqohMap[s.nis]?.guruNik || '') === filterGuruNik))
        .map((s) => s.nis)
    );

    // Ikuti filter bulan + membership siswa
    const data = hafalan.filter((h) =>
      h.tanggal_setoran.startsWith(monthStr) && allowedNis.has(h.nis)
    );

    // Kumpulkan tanggal unik di bulan (hanya yang ada isinya)
    const dateKeys = Array.from(new Set(data.map((h) => h.tanggal_setoran))).sort();

    // Helper: bangun sheet AoA dua baris header dengan merge per tanggal
    const buildSheetForDates = (dates: string[]) => {
      const byStudent = new Map<string, { nama: string; entries: Record<string, Hafalan | undefined> }>();
      for (const h of data) {
        if (!dates.includes(h.tanggal_setoran)) continue;
        const key = h.nis;
        const nama = h.nama_siswa || h.nis;
        if (!byStudent.has(key)) byStudent.set(key, { nama, entries: {} });
        byStudent.get(key)!.entries[h.tanggal_setoran] = h;
      }

      const students = Array.from(byStudent.entries());
      const headerTop: (string | number)[] = ['No', 'Nama Siswa'];
      dates.forEach((date) => { headerTop.push(date, '', '', ''); });
      headerTop.push('Total Baris', 'Target Baris');
      const headerSub: (string | number)[] = ['', ''];
      dates.forEach(() => { headerSub.push('Surat', 'Ayat Mulai', 'Ayat Selesai', 'Baris'); });
      headerSub.push('', '');
      const aoa: (string | number)[][] = [headerTop, headerSub];

      students.forEach(([nis, info], idx) => {
        const row: (string | number)[] = [idx + 1, info.nama];
        let totalBaris = 0; let pertemuan = 0;
        dates.forEach((date) => {
          const h = info.entries[date];
          row.push(h?.nama_surah || '');
          row.push(h?.ayat_mulai ?? '');
          row.push(h?.ayat_selesai ?? '');
          row.push(h?.jumlah_baris ?? '');
          if (typeof h?.jumlah_baris === 'number') totalBaris += h!.jumlah_baris;
          if (h) pertemuan += 1;
        });
        const perPertemuan = (halaqohMap[nis]?.halaqoh ?? targets[nis]?.target_baris_perpertemuan ?? 0);
        row.push(totalBaris);
        row.push(perPertemuan * pertemuan);
        aoa.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const merges: XLSX.Range[] = [];
      merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
      merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
      dates.forEach((_, idxDate) => {
        const startCol = 2 + idxDate * 4;
        merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 3 } });
      });
      const totalCol = 2 + dates.length * 4;
      merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });
      merges.push({ s: { r: 0, c: totalCol + 1 }, e: { r: 1, c: totalCol + 1 } });
      ws['!merges'] = merges as any;
      return ws;
    };

    // Buat workbook, untuk kelas tertentu pecah per pekan
    const heavyClasses = new Set<string>(['X E1', 'XI F1']);
    const wb = XLSX.utils.book_new();

    if (kelasFilter && heavyClasses.has(kelasFilter)) {
      // Kelompokkan tanggal menjadi pekan (minggu ke-1 dst)
      const weekMap = new Map<number, string[]>();
      for (const dk of dateKeys) {
        const dt = new Date(dk);
        const weekIdx = Math.floor((dt.getDate() - 1) / 7) + 1; // Pekan sederhana per 7 hari
        if (!weekMap.has(weekIdx)) weekMap.set(weekIdx, []);
        weekMap.get(weekIdx)!.push(dk);
      }
      const weeks = Array.from(weekMap.entries()).sort((a, b) => a[0] - b[0]);
      weeks.forEach(([w, dates]) => {
        const ws = buildSheetForDates(dates);
        XLSX.utils.book_append_sheet(wb, ws, `Pekan ${w}`);
      });
    } else {
      const ws = buildSheetForDates(dateKeys);
      XLSX.utils.book_append_sheet(wb, ws, `Bulanan ${monthStr}`);
    }

    XLSX.writeFile(wb, `hafalan_bulanan_${monthStr}.xlsx`);
  }

  // Ekspor 3 bulan terakhir (termasuk bulan aktif)
  function handleExportTriMonthlyXLSX() {
    const d = new Date(tanggalSetoran);
    const base = exportQuarterEndMonth && /^\d{4}-\d{2}$/.test(exportQuarterEndMonth)
      ? new Date(Number(exportQuarterEndMonth.slice(0, 4)), Number(exportQuarterEndMonth.slice(5, 7)) - 1, 1)
      : d;
    const months: { y: number; m: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const nd = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({ y: nd.getFullYear(), m: nd.getMonth() + 1 });
    }
    const keys = new Set(months.map(({ y, m }) => `${y}-${String(m).padStart(2, '0')}`));
    // Gunakan membership siswa terhadap Musyrif pada Data Halaqoh map
    const allowedNis = new Set(
      students
        .filter((s) => (!kelasFilter || (s.nama_kelas || '') === kelasFilter))
        .filter((s) => (!filterGuruNik || (halaqohMap[s.nis]?.guruNik || '') === filterGuruNik))
        .map((s) => s.nis)
    );

    const data = hafalan.filter((h) => keys.has(h.tanggal_setoran.slice(0, 7)) && allowedNis.has(h.nis));
    const allDates = Array.from(new Set(data.map(h => h.tanggal_setoran))).sort();

    const byStudent = new Map<string, { nama: string; entries: Record<string, Hafalan | undefined> }>();
    for (const h of data) {
      const key = h.nis;
      const nama = h.nama_siswa || h.nis;
      if (!byStudent.has(key)) byStudent.set(key, { nama, entries: {} });
      byStudent.get(key)!.entries[h.tanggal_setoran] = h;
    }

    const headerTop: (string | number)[] = ['No', 'Nama Siswa'];
    allDates.forEach((date) => { headerTop.push(date, '', '', ''); });
    headerTop.push('Total Baris', 'Target Baris');
    const headerSub: (string | number)[] = ['', ''];
    allDates.forEach(() => { headerSub.push('Surat', 'Ayat Mulai', 'Ayat Selesai', 'Baris'); });
    headerSub.push('', '');
    const aoa: (string | number)[][] = [headerTop, headerSub];

    let idx = 1;
    for (const [nis, info] of byStudent.entries()) {
      const row: (string | number)[] = [idx++, info.nama];
      let totalBaris = 0; let pertemuan = 0;
      for (const date of allDates) {
        const h = info.entries[date];
        row.push(h?.nama_surah || '');
        row.push(h?.ayat_mulai ?? '');
        row.push(h?.ayat_selesai ?? '');
        row.push(h?.jumlah_baris ?? '');
        if (typeof h?.jumlah_baris === 'number') totalBaris += h!.jumlah_baris;
        if (h) pertemuan += 1;
      }
      const perPertemuan = (halaqohMap[nis]?.halaqoh ?? targets[nis]?.target_baris_perpertemuan ?? 0);
      row.push(totalBaris);
      row.push(perPertemuan * pertemuan);
      aoa.push(row);
    }
    const endMonthKey = `${months[0].y}-${String(months[0].m).padStart(2, '0')}`;
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const merges: XLSX.Range[] = [];
    merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
    merges.push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
    allDates.forEach((_, idxDate) => {
      const startCol = 2 + idxDate * 4;
      merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 3 } });
    });
    const totalCol = 2 + allDates.length * 4;
    merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });
    merges.push({ s: { r: 0, c: totalCol + 1 }, e: { r: 1, c: totalCol + 1 } });
    ws['!merges'] = merges as any;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `s/d ${endMonthKey}`);
    XLSX.writeFile(wb, `hafalan_3bulan_sampai_${endMonthKey}.xlsx`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="p-6">
      <datalist id="surah-list">
        {SURAH_INFO.map((s) => (
          <option key={s.name} value={s.name} />
        ))}
      </datalist>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="mr-3 text-blue-600" />
              Manajemen Hafalan
            </h1>
            <p className="text-gray-600 mt-2">
              Rekap setoran hafalan Al-Qur'an siswa per guru dan halaqoh
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tombol 1: Data Target */}
            <Link
              href="/keagamaan/hafalan/target"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Data Target
            </Link>
            {/* Tombol 2: Evaluasi */}
            <Link
              href="/keagamaan/hafalan/evaluasi"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Evaluasi
          </Link>
            {/* Tombol 3: Data Rekap */}
            <Link
              href="/keagamaan/hafalan/rekap"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Data Rekap
            </Link>
            {/* Tombol 3: Data Halaqoh (Halaman) */}
            <Link
              href="/keagamaan/hafalan/halaqoh"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Data Halaqoh
            </Link>
          </div>
      </div>
    </div>

    {/* Modal Halaqoh dihapus: gunakan halaman khusus */}

      {/* Banner & Controls - Tahfizh Tracker */}
      <div className="mb-6">
        <div className="rounded-xl border bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Tahfizh Tracker</h2>
                <p className="text-sm opacity-90">Sistem pencatatan setoran hafalan Al-Qur'an</p>
              </div>
            </div>
            <button
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg"
              onClick={() => handleSaveAll()}
            >
              Simpan Semua Data
          </button>
        </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Kontrol tanggal dipindahkan ke area kontrol di bawah; elemen span+input dihapus */}
          </div>
        </div>
      </div>

      {/* Stats + Controls Row */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
          <div>
            <div className="text-3xl font-bold text-indigo-600">
              {Object.values(rowSelections).filter(r => r.surat && r.ayatMulai && r.ayatSelesai).length}
            </div>
            <div className="text-sm text-gray-500">Data Terisi</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">{students.length}</div>
            <div className="text-sm text-gray-500">Total Siswa</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-600">{hafalan.filter(h => h.tanggal_setoran === tanggalSetoran).length}</div>
          <div className="text-sm text-gray-500">Data Tersimpan</div>
        </div>
      </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Tombol Lihat Semua Riwayat dihapus sesuai permintaan */}
            <button
              onClick={() => setRowSelections({})}
              className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100"
            >Bersihkan Form</button>
            <button
              onClick={handleDeleteBySelectedDate}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >Hapus Data Tanggal Ini</button>
          </div>
        </div>
      </div>

      {/* Tabel utama sesuai desain */}
      {/* Grafik Tuntas vs Tidak Tuntas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <div>
            <div className="font-semibold">Grafik Tuntas vs Tidak Tuntas</div>
            <div className="text-xs text-gray-600">Hari terpilih: {new Date(tanggalSetoran).toLocaleDateString('id-ID')}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {/* Grafik Bulanan (Semua Siswa) - mirip gambar 2 */}
          <div className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Grafik Bulanan (Semua Siswa)</div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-600">Merah: Halaqoh×Pertemuan, Biru: Baris×Pertemuan</div>
                <button onClick={handleDownloadMonthlyGraph} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100">Download Grafik</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                const items = monthlyPerStudent;
                const left = 50; const right = 20; const top = 20; const bottom = 320; // sumbu X (garis)
                const labelBase = bottom + 260; // lebih banyak ruang untuk nama panjang
                const H = labelBase + 60; // total tinggi SVG diperbesar
                const perItemWidth = 44; // rapatkan antar batang dibanding sebelumnya (70)
                const W = Math.max(900, items.length * perItemWidth);
                const chartW = W - left - right;
                const chartH = bottom - top;
                const xStep = chartW / Math.max(items.length, 1);
                const barW = Math.min(xStep - 2, Math.max(14, xStep * 0.9)); // batang lebih lebar, jarak antar batang kecil
                const maxR = Math.max(5, Math.ceil(maxMonthlyTotal / 5) * 5);
                const toY = (v: number) => bottom - (v / maxR) * chartH;
                const xCenter = (i: number) => left + i * xStep + xStep / 2;
                const linePts = items.map((s, i) => `${xCenter(i)},${toY(s.halaqohTotal || 0)}`).join(' ');
                return (
                  <svg ref={monthlySvgRef} viewBox={`0 0 ${W} ${H}`} className="w-full" height={H}>
                    {/* Gridlines and axes */}
                    <line x1={left} y1={bottom} x2={W - right} y2={bottom} stroke="#e5e7eb" />
                    <line x1={left} y1={top} x2={left} y2={bottom} stroke="#e5e7eb" />
                    {Array.from({ length: Math.floor(maxR / 5) + 1 }, (_, k) => k * 5).map((v) => (
                      <g key={`grid-${v}`}>
                        <line x1={left} y1={toY(v)} x2={W - right} y2={toY(v)} stroke="#f3f4f6" />
                        <text x={left - 6} y={toY(v) + 3} fontSize="10" textAnchor="end" fill="#6b7280">{v}</text>
                      </g>
                    ))}

                    {/* Bars per student (CAPAIAN) */}
                    {items.map((s, i) => (
                      <g key={`bar-group-${s.nis}`}>
                        <rect
                          x={xCenter(i) - barW / 2}
                          y={toY(s.barisTotal || 0)}
                          width={barW}
                          height={bottom - toY(s.barisTotal || 0)}
                          fill="#3b82f6"
                        />
                        {/* value label above bar */}
                        <text x={xCenter(i)} y={toY((s.barisTotal || 0)) - 6} fontSize="11" textAnchor="middle" fill="#1f2937" fontWeight="600">
                          {s.barisTotal || 0}
                        </text>
                      </g>
                    ))}

                    {/* TARGET line (Halaqoh×Pertemuan) */}
                    <polyline points={linePts} fill="none" stroke="#ef4444" strokeWidth="2" />
                    {items.map((s, i) => (
                      <g key={`dot-group-${s.nis}`}>
                        <circle cx={xCenter(i)} cy={toY(s.halaqohTotal || 0)} r="3" fill="#ef4444" />
                        {/* value label above dot */}
                        <text x={xCenter(i)} y={toY(s.halaqohTotal || 0) - 6} fontSize="11" textAnchor="middle" fill="#ef4444" fontWeight="600">
                          {s.halaqohTotal || 0}
                        </text>
                      </g>
                    ))}

                    {/* Student names (vertical) - tanpa clip, seluruh nama di area khusus */}
                    {items.map((s, i) => (
                      <text key={`name-${s.nis}`} transform={`translate(${xCenter(i)},${labelBase - 2}) rotate(-90)`} fontSize="11" textAnchor="start" fill="#374151">
                        {s.nama || s.nis}
                      </text>
                    ))}

                    {/* Legend */}
                    <g>
                      <rect x={left} y={top - 10} width="10" height="10" fill="#3b82f6" />
                      <text x={left + 14} y={top} fontSize="10" fill="#374151">CAPAIAN</text>
                      <rect x={left + 80} y={top - 10} width="10" height="10" fill="#ef4444" />
                      <text x={left + 94} y={top} fontSize="10" fill="#374151">TARGET</text>
                    </g>

                  </svg>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol Tampilan: ditempatkan di antara grafik dan data setoran */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tanggal Setoran */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Tanggal:</span>
            <input
              type="date"
              className="px-3 py-2 rounded-lg text-gray-900 bg-white font-semibold border-2 border-yellow-300 shadow-sm"
              value={tanggalSetoran}
              onChange={(e) => setTanggalSetoran(e.target.value)}
            />
          </div>
          {/* Musyrif (Filter) */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Musyrif:</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              value={filterGuruNik}
              onChange={(e) => setFilterGuruNik(e.target.value)}
            >
              <option value="">Semua Musyrif</option>
              {guruOptions.map((g) => (
                <option key={g.nik} value={g.nik}>{g.nama}</option>
              ))}
            </select>
          </div>
          {/* Kelas (Filter) dipindahkan ke sini */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Kelas:</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          {/* Tombol Export Bulanan/3 Bulan dipindahkan ke baris kontrol bawah */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMonthlyExport(true)} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">Export Bulanan</button>
            <button onClick={() => setShowQuarterExport(true)} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100">Export 3 Bulan</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-slate-50 sticky top-0 z-20">
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-12 sticky left-0 bg-slate-50 z-30">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-12 bg-slate-50 z-30">Nama Siswa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Halaqoh</th>
                <th colSpan={4} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-amber-500">✎ Setoran Terakhir</th>
                <th colSpan={4} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider bg-emerald-600">✎ Setoran Hari Ini</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
              <tr className="bg-slate-50 sticky top-[57px] z-20">
                <th className="sticky left-0 bg-slate-50 z-30"></th>
                <th className="sticky left-12 bg-slate-50 z-30"></th>
                <th></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Surat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ayat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Surat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ayat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Baris</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Target</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Tidak ada data</p>
                  <p className="text-sm">Isi form untuk mulai mencatat setoran</p>
                </td>
              </tr>
              ) : (
                filteredStudents.map((item, idx) => {
                  const h = rowSelections[item.nis]?.halaqoh as BarisKey | undefined;
                  const targetList = h ? targetTemplates[h] : [];
                  const isSaved = !!savedToday[item.nis];
                  const isEditing = !!editingRows[item.nis];
                  return (
                  <tr key={item.nis} className={`hover:bg-gray-50 ${isSaved && !isEditing ? 'bg-emerald-50' : ''}`}>
                    <td className="px-3 py-3 text-sm text-gray-700 sticky left-0 bg-white z-10">{idx + 1}</td>
                    <td className="px-4 py-3 sticky left-12 bg-white z-10">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <span>{item.nama_siswa}</span>
                        {isSaved && !isEditing ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Tersimpan</span>
                        ) : null}
                        {isEditing ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Sedang edit</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-500">{item.nama_kelas}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 w-40"
                        value={
                          (rowSelections[item.nis]?.halaqoh !== undefined
                            ? rowSelections[item.nis]?.halaqoh
                            : (halaqohPrefs[item.nis] !== undefined
                                ? halaqohPrefs[item.nis]
                                : (targets[item.nis]?.target_baris_perpertemuan ?? '')))
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRowSelections((prev) => ({
                            ...prev,
                            [item.nis]: { ...prev[item.nis], halaqoh: isNaN(val) ? undefined : val },
                          }));
                          // Simpan preferensi halaqoh per siswa ke localStorage
                          try {
                            const raw = typeof window !== 'undefined' ? localStorage.getItem('hafalan_halaqoh_pref') : null;
                            const prefs: Record<string, number | undefined> = raw ? JSON.parse(raw) : {};
                            if (isNaN(val)) {
                              delete prefs[item.nis];
                            } else {
                              prefs[item.nis] = val;
                            }
                            if (typeof window !== 'undefined') localStorage.setItem('hafalan_halaqoh_pref', JSON.stringify(prefs));
                            setHalaqohPrefs(prefs);
                          } catch {}
                        }}
                      >
                        <option value="">Halaqoh...</option>
                        {[3,5,7].map((n) => (
                          <option key={n} value={n}>{n} Baris</option>
                        ))}
                      </select>
                    </td>
                    {(() => {
                      const latestRel = getLatestUpToDate(item.nis);
                      return (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {latestRel?.tanggal_setoran ? new Date(latestRel.tanggal_setoran).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{latestRel?.nama_surah || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {latestRel ? `${latestRel.ayat_mulai}-${latestRel.ayat_selesai}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{latestRel?.jumlah_baris ?? '-'}</td>
                        </>
                      );
                    })()}
                    <td className="px-4 py-3">
                      <input
                        list="surah-list"
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 w-44"
                        value={rowSelections[item.nis]?.surat ?? ''}
                        onChange={(e) => {
                          const surat = e.target.value;
                          setRowSelections((prev) => ({
                            ...prev,
                            [item.nis]: {
                              ...prev[item.nis],
                              surat: surat || undefined,
                            },
                          }));
                        }}
                        placeholder="-- Pilih Surat --"
                        disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={SURAH_INFO.find((s) => s.name === (rowSelections[item.nis]?.surat || ''))?.ayat || undefined}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 w-24"
                          value={rowSelections[item.nis]?.ayatMulai ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? undefined : Number(raw);
                            setRowSelections((prev) => ({
                              ...prev,
                              [item.nis]: { ...prev[item.nis], ayatMulai: val },
                            }));
                          }}
                          placeholder="Dari"
                          disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                        />
                        <span className="text-sm text-gray-500">s/d</span>
                        <input
                          type="number"
                          min={1}
                          max={SURAH_INFO.find((s) => s.name === (rowSelections[item.nis]?.surat || ''))?.ayat || undefined}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 w-24"
                          value={rowSelections[item.nis]?.ayatSelesai ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? undefined : Number(raw);
                            setRowSelections((prev) => ({
                              ...prev,
                              [item.nis]: { ...prev[item.nis], ayatSelesai: val },
                            }));
                          }}
                          placeholder="Samp"
                          disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 w-24"
                        value={rowSelections[item.nis]?.baris ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRowSelections((prev) => ({
                            ...prev,
                            [item.nis]: { ...prev[item.nis], baris: isNaN(val) ? undefined : val },
                          }));
                        }}
                        placeholder="Baris..."
                        disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 w-44"
                        value={rowSelections[item.nis]?.targetKey ?? ''}
                        onChange={(e) => {
                          const key = e.target.value;
                          // Target berdiri sendiri: tidak mengubah surat/ayat yang diisi manual
                          setRowSelections((prev) => ({
                            ...prev,
                            [item.nis]: {
                              ...prev[item.nis],
                              targetKey: key || undefined,
                            },
                          }));
                        }}
                        disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                      >
                        <option value="">-- Pilih Target --</option>
                        {targetList.map((t, i) => (
                          <option key={`${t.surat}-${t.ayat}-${i}`} value={`${t.surat}|${t.ayat}`}>
                            {t.surat} {t.ayat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          onClick={() => handleSaveRow(item.nis)}
                          disabled={!!savedToday[item.nis] && !editingRows[item.nis]}
                        >
                          Simpan
                        </button>
                        {savedToday[item.nis] ? (
                          <button
                            className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                            onClick={() => {
                              const todayRec = hafalan.find((h) => h.nis === item.nis && h.tanggal_setoran === tanggalSetoran);
                              if (todayRec) {
                                setRowSelections((prev) => ({
                                  ...prev,
                                  [item.nis]: {
                                    ...prev[item.nis],
                                    surat: todayRec.nama_surah,
                                    ayatMulai: todayRec.ayat_mulai,
                                    ayatSelesai: todayRec.ayat_selesai,
                                    baris: todayRec.jumlah_baris,
                                  },
                                }));
                              }
                              setEditingRows((prev) => ({ ...prev, [item.nis]: !prev[item.nis] }));
                            }}
                          >
                            {editingRows[item.nis] ? 'Batalkan Edit' : 'Edit'}
                          </button>
                        ) : null}
                        <button
                          className={`${presenceToday[item.nis] ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'} px-2 py-1 rounded-md`}
                          onClick={() => setPresenceToday((prev) => ({ ...prev, [item.nis]: !prev[item.nis] }))}
                        >
                          Hadir
                        </button>
                        <button
                          className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200"
                          onClick={() => setRowSelections((prev) => ({ ...prev, [item.nis]: {} }))}
                        >
                          Bersihkan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
  {showDeleteModal && selectedHafalan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus data hafalan untuk siswa{' '}
              <span className="font-medium">{selectedHafalan.nama_siswa}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedHafalan(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal Export Bulanan */}
    {showMonthlyExport && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <h3 className="text-lg font-semibold mb-4">Export Bulanan</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleExportMonthlyXLSX(); setShowMonthlyExport(false); }} className="space-y-4">
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
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowMonthlyExport(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
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
          <form onSubmit={(e) => { e.preventDefault(); handleExportTriMonthlyXLSX(); setShowQuarterExport(false); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Akhir</label>
              <input
                type="month"
                value={exportQuarterEndMonth}
                onChange={(e) => setExportQuarterEndMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">Akan menggabungkan data 3 bulan berturut-turut.</p>
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
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowQuarterExport(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Unduh Excel</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}