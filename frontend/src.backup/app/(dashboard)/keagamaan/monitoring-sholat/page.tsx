"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

type KelasOption = { id_kelas: number; nama_kelas: string };

type StatsResponse = {
  success: boolean;
  data: {
    total_siswa: number;
    hadir: number;
    tidak_hadir: number;
    persentase_kehadiran: number;
  };
};

type DetailItem = {
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  kelas: string;
  status_kehadiran: string;
  tanggal_monitoring: string | null;
  // Opsional: jika API menyediakan jenis kelamin ('L' | 'P')
  jenis_kelamin?: 'L' | 'P' | string;
};

type RowItem = {
  nis: string;
  nama_siswa: string;
  kelas: string;
  status_dhuhur: string | null;
  tanggal_dhuhur: string | null;
  status_asar: string | null;
  tanggal_asar: string | null;
  // Opsional untuk pewarnaan baris berdasarkan jenis kelamin
  jenis_kelamin?: 'L' | 'P' | string;
};

export default function MonitoringSholatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string | null>(
    searchParams.get("kelas")
  );
  const [tanggal, setTanggal] = useState<string | null>(
    searchParams.get("tanggal") || new Date().toISOString().slice(0, 10)
  );
  const [jenisSholat, setJenisSholat] = useState<string>(
    searchParams.get("jenis_sholat") || "Dhuhur"
  );
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [detailsDhuhur, setDetailsDhuhur] = useState<DetailItem[]>([]);
  const [detailsAsar, setDetailsAsar] = useState<DetailItem[]>([]);
  const [submittingDhuhur, setSubmittingDhuhur] = useState(false);
  const [submittingAsar, setSubmittingAsar] = useState(false);
  const [genderMap, setGenderMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setError(null);
        // Ambil daftar kelas dari resource utama agar pasti berisi id_kelas & nama_kelas
        const resp = await api.get("/v1/kelas", { params: { per_page: 1000 } });
        const items = resp.data?.data || [];
        setKelasOptions(Array.isArray(items) ? items : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat data kelas");
      }
    };
    fetchFormData();
  }, []);

  // Muat daftar siswa untuk mendapatkan jenis kelamin, gunakan sekali dan cache di state
  useEffect(() => {
    const fetchStudentsGender = async () => {
      try {
        const resp = await api.get('/v1/siswa', { params: { per_page: 1000 } });
        const raw = resp?.data?.data?.data || resp?.data?.data || [];
        const map: Record<string, string> = {};
        (raw || []).forEach((s: any) => {
          if (s?.nis) {
            const jk = s?.jenis_kelamin ?? s?.jk ?? s?.gender;
            if (jk) map[String(s.nis)] = String(jk);
          }
        });
        setGenderMap(map);
      } catch {}
    };
    fetchStudentsGender();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (selectedKelas) params.kelas = Number(selectedKelas);
      if (tanggal) params.tanggal = tanggal;
      if (jenisSholat) params.jenis_sholat = jenisSholat;

      const statsResp = await api.get("/v1/monitoring-sholat/stats", {
        params,
      });
      setStats(statsResp.data.data);

      const [detailsResp, dhuhurResp, asarResp] = await Promise.all([
        api.get("/v1/monitoring-sholat/details", { params }),
        api.get("/v1/monitoring-sholat/details", {
          params: { ...params, jenis_sholat: "Dhuhur" },
        }),
        api.get("/v1/monitoring-sholat/details", {
          params: { ...params, jenis_sholat: "Asar" },
        }),
      ]);
      setDetails(detailsResp.data.data || []);
      setDetailsDhuhur(dhuhurResp.data.data || []);
      setDetailsAsar(asarResp.data.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Gagal memuat statistik dan detail monitoring"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKelas, tanggal, jenisSholat]);

  const goToInput = () => {
    const params = new URLSearchParams();
    if (selectedKelas) params.set("kelas", selectedKelas);
    if (tanggal) params.set("tanggal", tanggal);
    if (jenisSholat) params.set("jenis_sholat", jenisSholat);
    router.push(`/keagamaan/monitoring-sholat/input?${params.toString()}`);
  };

  const handleExportMonthly = async () => {
    try {
      const month = (tanggal || new Date().toISOString().slice(0, 10)).slice(0, 7); // YYYY-MM
      const params: any = { month };
      if (selectedKelas) params.kelas = Number(selectedKelas);

      const resp = await api.get("/v1/monitoring-sholat/export-monthly", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const kelasSuffix = selectedKelas ? `_kelas-${Number(selectedKelas)}` : "";
      a.href = url;
      a.download = `Monitoring-Sholat_${month}${kelasSuffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal mengunduh export monitoring sholat");
    }
  };

  const toggleKehadiran = (nis: string) => {
    setDetails((prev) =>
      prev.map((p) => {
        if (p.nis !== nis) return p;
        const next = p.status_kehadiran === "Hadir" ? "Tidak_Hadir" : "Hadir";
        return { ...p, status_kehadiran: next };
      })
    );
  };

  const submitDhuhurInline = async () => {
    try {
      setSubmittingDhuhur(true);
      const entriesDh = detailsDhuhur
        .filter((d) => d.status_kehadiran === "Hadir" || d.status_kehadiran === "Tidak_Hadir")
        .map((d) => ({ nis: d.nis, status_kehadiran: d.status_kehadiran }));
      if (entriesDh.length === 0) {
        alert("Tidak ada perubahan ceklist Dzuhur untuk disimpan");
        return;
      }
      await api.post("/v1/monitoring-sholat/submit", {
        tanggal,
        jenis_sholat: "Dhuhur",
        entries: entriesDh,
      });
      alert("Berhasil menyimpan ceklist Dzuhur");
      await refreshData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menyimpan ceklist Dzuhur");
    } finally {
      setSubmittingDhuhur(false);
    }
  };

  const submitAsarInline = async () => {
    try {
      setSubmittingAsar(true);
      const entriesAs = detailsAsar
        .filter((d) => d.status_kehadiran === "Hadir" || d.status_kehadiran === "Tidak_Hadir")
        .map((d) => ({ nis: d.nis, status_kehadiran: d.status_kehadiran }));
      if (entriesAs.length === 0) {
        alert("Tidak ada perubahan ceklist Asar untuk disimpan");
        return;
      }
      await api.post("/v1/monitoring-sholat/submit", {
        tanggal,
        jenis_sholat: "Asar",
        entries: entriesAs,
      });
      alert("Berhasil menyimpan ceklist Asar");
      await refreshData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menyimpan ceklist Asar");
    } finally {
      setSubmittingAsar(false);
    }
  };

  const buildRecap = (list: DetailItem[]) => {
    const map = new Map<string, { total: number; hadir: number }>();
    list.forEach((d) => {
      const key = d.kelas || "-";
      const prev = map.get(key) || { total: 0, hadir: 0 };
      prev.total += 1;
      if (d.status_kehadiran === "Hadir") prev.hadir += 1;
      map.set(key, prev);
    });
    const cards = Array.from(map.entries()).map(([kelas, v]) => {
      const pct = v.total > 0 ? Math.round((v.hadir / v.total) * 100) : 0;
      return { kelas, persentase: pct, hadir: v.hadir, total: v.total };
    });
    cards.sort((a, b) => b.persentase - a.persentase);
    return cards;
  };

  const recapDhuhurCards = useMemo(() => buildRecap(detailsDhuhur), [detailsDhuhur]);
  const recapAsarCards = useMemo(() => buildRecap(detailsAsar), [detailsAsar]);

  // Helper untuk membuat key pengurutan kelas: X < XI < XII, lalu huruf, lalu nomor
  const kelasSortKey = (kelas: string | null | undefined): number => {
    if (!kelas) return Number.MAX_SAFE_INTEGER;
    const raw = (kelas || "").trim().toUpperCase().replace(/\s+/g, " ");
    const romanMap: Record<string, number> = { X: 10, XI: 11, XII: 12 };
    const tryMatch = (pattern: RegExp) => {
      const m = raw.match(pattern);
      if (!m) return null;
      const roman = m[1];
      const letter = m[2];
      const numStr = m[3];
      const grade = romanMap[roman] ?? 999;
      const letterIdx = (letter.charCodeAt(0) - 64) || 0; // A=1
      const section = parseInt(numStr, 10) || 0;
      return grade * 1000 + letterIdx * 100 + section;
    };
    // Coba dengan spasi: "X E1" atau "X E 1"
    const withSpaces = tryMatch(/^(X|XI|XII)\s*([A-Z])\s*(\d+)$/);
    if (withSpaces !== null) return withSpaces;
    // Coba tanpa spasi: "XE1"
    const noSpaces = tryMatch(/^(X|XI|XII)([A-Z])(\d+)$/);
    if (noSpaces !== null) return noSpaces;
    // Fallback ke pengurutan alfabet
    return Number.MAX_SAFE_INTEGER;
  };

  // Gabungkan Dhuhur & Asar menjadi satu baris per siswa
  const rows: RowItem[] = useMemo(() => {
    const map = new Map<string, RowItem>();
    const collect = (list: DetailItem[], jenis: "Dhuhur" | "Asar") => {
      list.forEach((d) => {
        const cur = map.get(d.nis) || {
          nis: d.nis,
          nama_siswa: d.nama_siswa,
          kelas: d.kelas,
          status_dhuhur: null,
          tanggal_dhuhur: null,
          status_asar: null,
          tanggal_asar: null,
          jenis_kelamin: d.jenis_kelamin ?? genderMap[d.nis],
        };
        if (jenis === "Dhuhur") {
          cur.status_dhuhur = d.status_kehadiran || null;
          cur.tanggal_dhuhur = d.tanggal_monitoring;
        } else {
          cur.status_asar = d.status_kehadiran || null;
          cur.tanggal_asar = d.tanggal_monitoring;
        }
        map.set(d.nis, cur);
      });
    };
    collect(detailsDhuhur, "Dhuhur");
    collect(detailsAsar, "Asar");
    return Array.from(map.values()).sort((a, b) => {
      const ka = kelasSortKey(a.kelas);
      const kb = kelasSortKey(b.kelas);
      if (ka !== kb) return ka - kb;
      return a.nama_siswa.localeCompare(b.nama_siswa);
    });
  }, [detailsDhuhur, detailsAsar, genderMap]);

  const toggleDhuhur = (nis: string) => {
    setDetailsDhuhur((prev) =>
      prev.map((p) => {
        if (p.nis !== nis) return p;
        const next = p.status_kehadiran === "Hadir" ? "Tidak_Hadir" : "Hadir";
        return { ...p, status_kehadiran: next };
      })
    );
  };

  const toggleAsar = (nis: string) => {
    setDetailsAsar((prev) =>
      prev.map((p) => {
        if (p.nis !== nis) return p;
        const next = p.status_kehadiran === "Hadir" ? "Tidak_Hadir" : "Hadir";
        return { ...p, status_kehadiran: next };
      })
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Monitoring Sholat</h1>
        <button
          onClick={handleExportMonthly}
          className="px-3 py-2 bg-green-600 text-white rounded"
        >
          Export Bulanan (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kelas</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={selectedKelas ?? ""}
            onChange={(e) => setSelectedKelas(e.target.value || null)}
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={String((k as any).id_kelas ?? (k as any).id)} value={String((k as any).id_kelas ?? (k as any).id)}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tanggal</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={tanggal || ""}
            onChange={(e) => setTanggal(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jenis Sholat</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={jenisSholat}
            onChange={(e) => setJenisSholat(e.target.value)}
          >
            <option value="Dhuha">Dhuha</option>
            <option value="Dhuhur">Dhuhur</option>
            <option value="Asar">Asar</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={refreshData}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <div>Memuat...</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-white border rounded">
            <div className="text-sm text-gray-600">Total Siswa</div>
            <div className="text-lg font-semibold">{stats.total_siswa}</div>
          </div>
          <div className="p-3 bg-white border rounded">
            <div className="text-sm text-gray-600">Hadir</div>
            <div className="text-lg font-semibold">{stats.hadir}</div>
          </div>
          <div className="p-3 bg-white border rounded">
            <div className="text-sm text-gray-600">Tidak Hadir</div>
            <div className="text-lg font-semibold">{stats.tidak_hadir}</div>
          </div>
          <div className="p-3 bg-white border rounded">
            <div className="text-sm text-gray-600">Persentase Kehadiran</div>
            <div className="text-lg font-semibold">{stats.persentase_kehadiran}%</div>
          </div>
        </div>
      )}

      {/* Rekap harian per kelas untuk Dhuhur dan Asar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded">
          <div className="p-3 border-b font-medium">Rekap Kehadiran Harian (Dhuhur)</div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {recapDhuhurCards.map((card) => (
              <div key={`dhuhur-${card.kelas}`} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{card.kelas}</h3>
                  <span className="text-sm text-gray-600">
                    {card.hadir}/{card.total} hadir
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className={"h-2 rounded " + (card.persentase >= 75 ? "bg-green-500" : card.persentase >= 50 ? "bg-yellow-500" : "bg-red-500")}
                      style={{ width: `${card.persentase}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{card.persentase}% hadir</p>
                </div>
              </div>
            ))}
            {recapDhuhurCards.length === 0 && (
              <div className="text-sm text-gray-600">Belum ada data untuk rekap Dhuhur.</div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded">
          <div className="p-3 border-b font-medium">Rekap Kehadiran Harian (Asar)</div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {recapAsarCards.map((card) => (
              <div key={`asar-${card.kelas}`} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{card.kelas}</h3>
                  <span className="text-sm text-gray-600">
                    {card.hadir}/{card.total} hadir
                  </span>
                </div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className={"h-2 rounded " + (card.persentase >= 75 ? "bg-green-500" : card.persentase >= 50 ? "bg-yellow-500" : "bg-red-500")}
                      style={{ width: `${card.persentase}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{card.persentase}% hadir</p>
                </div>
              </div>
            ))}
            {recapAsarCards.length === 0 && (
              <div className="text-sm text-gray-600">Belum ada data untuk rekap Asar.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded">
        <div className="p-3 border-b font-medium">Detail Monitoring</div>
        <div className="p-3">
          <div className="flex items-center justify-end mb-3 gap-2">
            <button
              onClick={submitDhuhurInline}
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={submittingDhuhur}
            >
              {submittingDhuhur ? "Menyimpan..." : "Simpan Dzuhur"}
            </button>
            <button
              onClick={submitAsarInline}
              className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
              disabled={submittingAsar}
            >
              {submittingAsar ? "Menyimpan..." : "Simpan Asar"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">NIS</th>
                <th className="p-2">Nama</th>
                <th className="p-2">Kelas</th>
                <th className="p-2">Dzuhur</th>
                <th className="p-2">Asar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const nameBg = r.jenis_kelamin === 'P' ? 'bg-pink-50' : r.jenis_kelamin === 'L' ? 'bg-blue-50' : '';
                return (
                  <tr key={r.nis} className={`border-t`}>
                  <td className="p-2">{r.nis}</td>
                  <td className={`p-2 ${nameBg}`}>{r.nama_siswa}</td>
                  <td className="p-2">{r.kelas}</td>
                  <td className="p-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.status_dhuhur === "Hadir"}
                        onChange={() => toggleDhuhur(r.nis)}
                      />
                      <span>{r.status_dhuhur || "Belum Dimonitor"}</span>
                    </label>
                  </td>
                  <td className="p-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.status_asar === "Hadir"}
                        onChange={() => toggleAsar(r.nis)}
                      />
                      <span>{r.status_asar || "Belum Dimonitor"}</span>
                    </label>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="p-2" colSpan={5}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}