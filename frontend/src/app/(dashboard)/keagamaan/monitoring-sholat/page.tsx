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
  const [submittingInline, setSubmittingInline] = useState(false);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setError(null);
        // gunakan endpoint kelas-form-data untuk mengambil list kelas
        const resp = await api.get("/v1/kelas-form-data");
        const raw = resp.data?.data;
        let options: any[] = [];
        // handle jika API mengembalikan array langsung
        if (Array.isArray(raw)) {
          options = raw;
        } else if (raw && Array.isArray(raw.kelasOptions)) {
          options = raw.kelasOptions;
        } else if (raw && Array.isArray(raw.kelas_options)) {
          options = raw.kelas_options;
        } else if (raw && Array.isArray(raw.kelas)) {
          options = raw.kelas;
        }
        // pastikan terakhir tetap array
        setKelasOptions(Array.isArray(options) ? options : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat data kelas");
      }
    };
    fetchFormData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (selectedKelas) params.kelas = selectedKelas;
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

  const toggleKehadiran = (nis: string) => {
    setDetails((prev) =>
      prev.map((p) => {
        if (p.nis !== nis) return p;
        const next = p.status_kehadiran === "Hadir" ? "Tidak_Hadir" : "Hadir";
        return { ...p, status_kehadiran: next };
      })
    );
  };

  const submitInline = async () => {
    try {
      setSubmittingInline(true);
      const entries = details
        .filter((d) => d.status_kehadiran === "Hadir" || d.status_kehadiran === "Tidak_Hadir")
        .map((d) => ({ nis: d.nis, status_kehadiran: d.status_kehadiran }));

      const payload = {
        tanggal: tanggal,
        jenis_sholat: jenisSholat,
        entries,
      };
      const resp = await api.post("/v1/monitoring-sholat/submit", payload);
      alert(resp.data?.message || "Berhasil menyimpan monitoring sholat");
      await refreshData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menyimpan monitoring sholat");
    } finally {
      setSubmittingInline(false);
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Monitoring Sholat</h1>
        <button
          onClick={goToInput}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Input Monitoring
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kelas</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={selectedKelas || ""}
            onChange={(e) => setSelectedKelas(e.target.value || null)}
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k.id_kelas} value={k.id_kelas}>
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
              onClick={submitInline}
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              disabled={submittingInline}
            >
              {submittingInline ? "Menyimpan..." : "Simpan Ceklist"}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">NIS</th>
                <th className="p-2">Nama</th>
                <th className="p-2">Kelas</th>
                <th className="p-2">Status</th>
                <th className="p-2">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr key={d.nis} className="border-t">
                  <td className="p-2">{d.nis}</td>
                  <td className="p-2">{d.nama_siswa}</td>
                  <td className="p-2">{d.kelas}</td>
                  <td className="p-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.status_kehadiran === "Hadir"}
                        onChange={() => toggleKehadiran(d.nis)}
                      />
                      <span>{d.status_kehadiran || "Belum Dimonitor"}</span>
                    </label>
                  </td>
                  <td className="p-2">{d.tanggal_monitoring || "-"}</td>
                </tr>
              ))}
              {details.length === 0 && (
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