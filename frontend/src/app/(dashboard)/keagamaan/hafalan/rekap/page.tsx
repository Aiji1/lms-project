"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BarChart3 } from "lucide-react";

interface Hafalan {
  id_hafalan: number;
  nis: string;
  nama_siswa?: string;
  nama_kelas?: string;
  nama_surah: string;
  ayat_mulai: number;
  ayat_selesai: number;
  jumlah_baris: number;
  tanggal_setoran: string; // YYYY-MM-DD
}

interface HalaqohMapEntry { halaqoh?: number; guruNik?: string; }
interface TargetHalaqoh { nis: string; target_baris_perpertemuan: number; status: "Aktif" | "Non-aktif"; }

export default function RekapPage() {
  const [hafalan, setHafalan] = useState<Hafalan[]>([]);
  const [halaqohMap, setHalaqohMap] = useState<Record<string, HalaqohMapEntry>>({});
  const [targets, setTargets] = useState<Record<string, TargetHalaqoh | undefined>>({});
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [guruOptions, setGuruOptions] = useState<{ nik: string; nama: string }[]>([]);
  const [kelasFilter, setKelasFilter] = useState<string>("X E1");
  const [guruFilter, setGuruFilter] = useState<string>("");
  const [bulan, setBulan] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [loading, setLoading] = useState(false);

  // Pastikan default kelas adalah 'X E1' bila tersedia; jika tidak, ambil kelas pertama
  useEffect(() => {
    if (kelasOptions.length) {
      if (!kelasOptions.includes(kelasFilter)) {
        if (kelasOptions.includes('X E1')) setKelasFilter('X E1');
        else setKelasFilter(kelasOptions[0]);
      }
    }
  }, [kelasOptions]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("hafalan_halaqoh_map") : null;
      const parsed: Record<string, HalaqohMapEntry> = raw ? JSON.parse(raw) : {};
      setHalaqohMap(parsed);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [hafalanRes, guruRes, targetRes] = await Promise.all([
        api.get("/v1/hafalan"),
        api.get("/v1/guru", { params: { per_page: 1000 } }),
        api.get("/v1/target-hafalan-siswa", { params: { status: "Aktif", per_page: 1000 } }),
      ]);
      const list: Hafalan[] = (hafalanRes?.data?.data?.data || []) as Hafalan[];
      setHafalan(list);
      const kelasSet = new Set<string>();
      list.forEach((h) => { if (h.nama_kelas) kelasSet.add(h.nama_kelas); });
      setKelasOptions(Array.from(kelasSet).sort());

      if (guruRes?.data?.success) {
        const raw = guruRes?.data?.data?.data || guruRes?.data?.data || [];
        const gos: { nik: string; nama: string }[] = raw
          .filter((g: any) => (g.status ?? "Aktif") === "Aktif")
          .map((g: any) => ({ nik: String(g.nik_guru), nama: g.nama_lengkap }));
        setGuruOptions(gos);
      }
      if (targetRes?.data?.success) {
        const raw = targetRes?.data?.data?.data || [];
        const map: Record<string, TargetHalaqoh> = {};
        raw.forEach((t: any) => {
          if (t.status === "Aktif") map[t.nis] = { nis: String(t.nis), target_baris_perpertemuan: t.target_baris_perpertemuan, status: t.status };
        });
        setTargets(map);
      }
    } catch (e) {
      console.error("Error loading rekap:", e);
    } finally {
      setLoading(false);
    }
  }

  const monthData = useMemo(() => {
    // Tentukan siswa yang diperbolehkan berdasarkan kelas dan membership musyrif
    const nisInMonth = new Set(hafalan.filter(h => h.tanggal_setoran.startsWith(bulan)).map(h => h.nis));
    const allowedNis = new Set<string>();
    // Gunakan kelas dari data hafalan bulan ini untuk opsi yang relevan
    const kelasFilterFn = (nis: string) => {
      if (!kelasFilter) return true;
      const any = hafalan.find(h => h.nis === nis && h.tanggal_setoran.startsWith(bulan));
      return (any?.nama_kelas || "") === kelasFilter;
    };
    const guruFilterFn = (nis: string) => !guruFilter || (halaqohMap[nis]?.guruNik || "") === guruFilter;
    Array.from(nisInMonth).forEach((nis) => { if (kelasFilterFn(nis) && guruFilterFn(nis)) allowedNis.add(nis); });

    const data = hafalan.filter(h => h.tanggal_setoran.startsWith(bulan) && allowedNis.has(h.nis));
    const dates = Array.from(new Set(data.map(d => d.tanggal_setoran))).sort();
    // Map per siswa per tanggal
    const byStudent = new Map<string, { nama: string; kelas?: string; entries: Record<string, Hafalan | undefined> }>();
    data.forEach(h => {
      if (!byStudent.has(h.nis)) byStudent.set(h.nis, { nama: h.nama_siswa || h.nis, kelas: h.nama_kelas, entries: {} });
      byStudent.get(h.nis)!.entries[h.tanggal_setoran] = h;
    });
    const rows = Array.from(byStudent.entries()).sort((a, b) => (a[1].nama || "").localeCompare(b[1].nama || ""));
    return { dates, rows };
  }, [hafalan, bulan, kelasFilter, guruFilter, halaqohMap]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="mr-3 text-indigo-600" />
              Data Rekap
            </h1>
            <p className="text-gray-600 mt-2">Menampilkan semua data tersimpan dengan format seperti hasil export.</p>
          </div>
          <Link href="/keagamaan/hafalan" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">Kembali</Link>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Bulan:</span>
            <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className="px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Kelas:</span>
            <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              {kelasOptions.map((k) => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Musyrif:</span>
            <select value={guruFilter} onChange={(e) => setGuruFilter(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Semua Musyrif</option>
              {guruOptions.map((g) => (<option key={g.nik} value={g.nik}>{g.nama}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Rekap */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700" rowSpan={2}>No</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700" rowSpan={2}>Nama Siswa</th>
              {monthData.dates.map((d) => (
                <th key={`top-${d}`} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-amber-50" colSpan={4}>{new Date(d).toLocaleDateString("id-ID")}</th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700" rowSpan={2}>Total Baris</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700" rowSpan={2}>Target Baris</th>
            </tr>
            <tr className="bg-slate-50">
              {monthData.dates.map((d) => (
                <React.Fragment key={`sub-${d}`}>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Surat</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Ayat Mulai</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Ayat Selesai</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Baris</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (<tr><td className="px-3 py-3" colSpan={2 + monthData.dates.length * 4 + 2}>Memuat data...</td></tr>)}
            {!loading && monthData.rows.map(([nis, info], idx) => {
              let total = 0; let pertemuan = 0;
              return (
                <tr key={nis}>
                  <td className="px-3 py-2 text-sm text-gray-700">{idx + 1}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{info.nama}</td>
                  {monthData.dates.map((d) => {
                    const h = info.entries[d];
                    const cells = [
                      <td key={`${nis}-${d}-s`} className="px-3 py-2 text-sm text-gray-700">{h?.nama_surah || ""}</td>,
                      <td key={`${nis}-${d}-m`} className="px-3 py-2 text-sm text-gray-700">{h?.ayat_mulai ?? ""}</td>,
                      <td key={`${nis}-${d}-e`} className="px-3 py-2 text-sm text-gray-700">{h?.ayat_selesai ?? ""}</td>,
                      <td key={`${nis}-${d}-b`} className="px-3 py-2 text-sm text-gray-700">{h?.jumlah_baris ?? ""}</td>,
                    ];
                    if (typeof h?.jumlah_baris === "number") total += h!.jumlah_baris;
                    if (h) pertemuan += 1;
                    return cells;
                  })}
                  <td className="px-3 py-2 text-sm text-gray-700">{total}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{(halaqohMap[nis]?.halaqoh ?? targets[nis]?.target_baris_perpertemuan ?? 0) * pertemuan}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}