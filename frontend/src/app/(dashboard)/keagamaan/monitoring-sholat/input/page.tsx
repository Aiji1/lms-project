"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type KelasOption = { id_kelas: number; nama_kelas: string };

type DetailItem = {
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  kelas: string;
  status_kehadiran: string;
  tanggal_monitoring: string | null;
};

export default function MonitoringSholatInputPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string | null>(
    searchParams.get("kelas")
  );
  const [tanggal, setTanggal] = useState<string>(
    searchParams.get("tanggal") || new Date().toISOString().slice(0, 10)
  );
  const [jenisSholat, setJenisSholat] = useState<string>(
    searchParams.get("jenis_sholat") || "Dhuhur"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setError(null);
        const resp = await api.get("/v1/kelas-form-data");
        const raw = resp.data?.data;
        let options: any[] = [];
        if (Array.isArray(raw)) {
          options = raw;
        } else if (raw && Array.isArray(raw.kelasOptions)) {
          options = raw.kelasOptions;
        } else if (raw && Array.isArray(raw.kelas_options)) {
          options = raw.kelas_options;
        } else if (raw && Array.isArray(raw.kelas)) {
          options = raw.kelas;
        }
        setKelasOptions(Array.isArray(options) ? options : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Gagal memuat data kelas");
      }
    };
    fetchFormData();
  }, []);

  const refreshDetails = async () => {
    if (!selectedKelas) {
      setDetails([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = {
        kelas: selectedKelas,
        tanggal,
        jenis_sholat: jenisSholat,
      };
      const resp = await api.get("/v1/monitoring-sholat/details", { params });
      const rows: DetailItem[] = resp.data?.data || [];
      setDetails(rows);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat detail siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKelas, tanggal, jenisSholat]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const entries = details
        .filter((d) => d.status_kehadiran === "Hadir" || d.status_kehadiran === "Tidak_Hadir")
        .map((d) => ({ nis: d.nis, status_kehadiran: d.status_kehadiran }));

      const payload = {
        tanggal,
        jenis_sholat: jenisSholat,
        entries,
      };

      const resp = await api.post("/v1/monitoring-sholat/submit", payload);

      alert(resp.data?.message || "Berhasil menyimpan monitoring sholat");
      router.push(
        `/keagamaan/monitoring-sholat?kelas=${selectedKelas || ""}&tanggal=${tanggal}&jenis_sholat=${jenisSholat}`
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Gagal menyimpan monitoring sholat"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Input Monitoring Sholat</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          Batal
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
            <option value="">Pilih Kelas</option>
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
            value={tanggal}
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
      </div>

      {!selectedKelas && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          Pilih kelas terlebih dahulu untuk menampilkan daftar siswa.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading && <div>Memuat...</div>}

      {selectedKelas && (
        <div className="bg-white border rounded">
          <div className="p-3 border-b font-medium">Daftar Siswa</div>
          <div className="p-3 space-y-2">
            {details.map((d) => (
              <div key={d.nis} className="flex items-center justify-between border-b py-2">
                <div>
                  <div className="font-medium">{d.nama_siswa}</div>
                  <div className="text-xs text-gray-600">NIS: {d.nis} • {d.kelas}</div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name={`status-${d.nis}`}
                      checked={d.status_kehadiran === "Hadir"}
                      onChange={() => {
                        setDetails((prev) =>
                          prev.map((p) =>
                            p.nis === d.nis ? { ...p, status_kehadiran: "Hadir" } : p
                          )
                        );
                      }}
                    />
                    <span>Hadir</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      name={`status-${d.nis}`}
                      checked={d.status_kehadiran === "Tidak_Hadir"}
                      onChange={() => {
                        setDetails((prev) =>
                          prev.map((p) =>
                            p.nis === d.nis ? { ...p, status_kehadiran: "Tidak_Hadir" } : p
                          )
                        );
                      }}
                    />
                    <span>Tidak Hadir</span>
                  </label>
                </div>
              </div>
            ))}
            {details.length === 0 && (
              <div className="text-sm text-gray-600">Tidak ada data siswa untuk kelas ini.</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          disabled={submitting}
          onClick={() => router.back()}
          className="px-4 py-2 border rounded"
        >
          Batal
        </button>
        <button
          disabled={submitting || !selectedKelas}
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Simpan Monitoring"}
        </button>
      </div>
    </div>
  );
}