"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Users, BookOpen } from "lucide-react";

interface SiswaFormData {
  nis: string;
  nama_lengkap: string;
  nama_kelas: string;
}

interface HalaqohMapEntry {
  halaqoh?: number;
  guruNik?: string;
}

interface TargetHalaqoh {
  id_target_hafalan: number;
  nis: string;
  target_baris_perpertemuan: number;
  status: "Aktif" | "Non-aktif";
}

export default function HalaqohPage() {
  const [students, setStudents] = useState<SiswaFormData[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [kelasFilter, setKelasFilter] = useState<string>("");
  const [guruOptions, setGuruOptions] = useState<{ nik: string; nama: string }[]>([]);
  const [halaqohMap, setHalaqohMap] = useState<Record<string, HalaqohMapEntry>>({});
  const [targets, setTargets] = useState<Record<string, TargetHalaqoh | undefined>>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Muat map halaqoh dari localStorage
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("hafalan_halaqoh_map") : null;
      const parsed: Record<string, HalaqohMapEntry> = raw ? JSON.parse(raw) : {};
      setHalaqohMap(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [formDataResponse, siswaResponse, guruResponse, targetResponse] = await Promise.all([
        api.get("/v1/hafalan-form-data"),
        api.get("/v1/siswa", { params: { per_page: 1000 } }),
        api.get("/v1/guru", { params: { per_page: 1000 } }),
        api.get("/v1/target-hafalan-siswa", { params: { status: "Aktif", per_page: 1000 } }),
      ]);

      let siswaForm: SiswaFormData[] = [];
      try {
        if (formDataResponse?.data?.success) {
          siswaForm = formDataResponse?.data?.data?.siswa || [];
        }
      } catch {}

      let siswaAktif: SiswaFormData[] = [];
      try {
        const raw = siswaResponse?.data?.data?.data || siswaResponse?.data?.data || [];
        siswaAktif = (raw || []).map((s: any) => ({
          nis: String(s.nis),
          nama_lengkap: s.nama_lengkap || s.nama_siswa || s.nama,
          nama_kelas: s.nama_kelas || s.kelas || "",
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
      semuaSiswa.sort((a, b) => (a.nama_lengkap || "").localeCompare(b.nama_lengkap || ""));
      setStudents(semuaSiswa);

      const kelasSet = new Set<string>();
      semuaSiswa.forEach((s) => { if (s.nama_kelas) kelasSet.add(s.nama_kelas); });
      setKelasOptions(Array.from(kelasSet).sort());

      if (guruResponse?.data?.success) {
        const raw = guruResponse?.data?.data?.data || guruResponse?.data?.data || [];
        const gos: { nik: string; nama: string }[] = raw
          .filter((g: any) => (g.status ?? "Aktif") === "Aktif")
          .map((g: any) => ({ nik: String(g.nik_guru), nama: g.nama_lengkap }));
        setGuruOptions(gos);
      }

      if (targetResponse?.data?.success) {
        const list = targetResponse?.data?.data?.data || [];
        const map: Record<string, TargetHalaqoh> = {};
        list.forEach((t: any) => {
          if (t.status === "Aktif") {
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
    } catch (e) {
      console.error("Error loading Halaqoh page:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hafalan_halaqoh_map", JSON.stringify(halaqohMap));
      }
      alert("Data Halaqoh tersimpan.");
    } catch {}
  }

  const filtered = students.filter((s) => !kelasFilter || (s.nama_kelas || "") === kelasFilter);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="mr-3 text-teal-600" />
              Data Halaqoh
            </h1>
            <p className="text-gray-600 mt-2">
              Atur kelompok halaqoh dan guru/musyrif per siswa. Digunakan untuk default di menu Hafalan dan filter guru.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/keagamaan/hafalan"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Kembali
            </Link>
            <Link
              href="/keagamaan/hafalan/target"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Data Target
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Kelas + Simpan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Kelas:</span>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg"
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Simpan</button>
      </div>

      {/* Tabel Data Halaqoh */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">NIS</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nama</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kelas</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Halaqoh</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Guru/Musyrif</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr><td className="px-3 py-3" colSpan={5}>Memuat data...</td></tr>
              )}
              {!loading && filtered.map((s) => {
                const entry = halaqohMap[s.nis] || {};
                const hVal = entry.halaqoh ?? (targets[s.nis]?.target_baris_perpertemuan ?? undefined);
                const gVal = entry.guruNik ?? "";
                return (
                  <tr key={s.nis}>
                    <td className="px-3 py-2 text-sm text-gray-700">{s.nis}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{s.nama_lengkap}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{s.nama_kelas}</td>
                    <td className="px-3 py-2">
                      <select
                        className="px-2 py-1 border rounded"
                        value={hVal ?? ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || undefined;
                          setHalaqohMap((prev) => {
                            const next = { ...prev };
                            next[s.nis] = { ...(prev[s.nis] || {}), halaqoh: val };
                            return next;
                          });
                        }}
                      >
                        <option value="">-</option>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={7}>7</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="px-2 py-1 border rounded"
                        value={gVal}
                        onChange={(e) => {
                          const val = e.target.value || "";
                          setHalaqohMap((prev) => {
                            const next = { ...prev };
                            next[s.nis] = { ...(prev[s.nis] || {}), guruNik: val };
                            return next;
                          });
                        }}
                      >
                        <option value="">- Pilih Guru -</option>
                        {guruOptions.map((g) => (
                          <option key={g.nik} value={g.nik}>{g.nama}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}