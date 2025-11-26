"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Plus, Trash, ArrowLeft } from "lucide-react";

type BarisKey = 3 | 5 | 7;
type TargetItem = { surat: string; ayat: number };

export default function DataTargetPage() {
  const [templates, setTemplates] = useState<Record<BarisKey, TargetItem[]>>({ 3: [], 5: [], 7: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("hafalan_target_templates") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setTemplates({
          3: parsed?.["3"] || [],
          5: parsed?.["5"] || [],
          7: parsed?.["7"] || [],
        });
      } else {
        const sample: Record<BarisKey, TargetItem[]> = {
          3: [
            { surat: "An Naba", ayat: 13 },
            { surat: "An Naba", ayat: 24 },
            { surat: "An Naba", ayat: 36 },
            { surat: "An Naba", ayat: 40 },
          ],
          5: [
            { surat: "An Naba", ayat: 13 },
            { surat: "An Naba", ayat: 24 },
            { surat: "An Naba", ayat: 36 },
            { surat: "An Naba", ayat: 40 },
          ],
          7: [
            { surat: "An Naba", ayat: 13 },
            { surat: "An Naba", ayat: 24 },
            { surat: "An Naba", ayat: 36 },
            { surat: "An Naba", ayat: 40 },
          ],
        };
        setTemplates(sample);
      }
    } catch {}
  }, []);

  const addRow = (k: BarisKey) => {
    setTemplates((prev) => ({ ...prev, [k]: [...prev[k], { surat: "", ayat: NaN }] }));
  };

  const removeRow = (k: BarisKey, idx: number) => {
    setTemplates((prev) => ({ ...prev, [k]: prev[k].filter((_, i) => i !== idx) }));
  };

  const updateCell = (k: BarisKey, idx: number, field: keyof TargetItem, value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [k]: prev[k].map((row, i) => (i === idx ? { ...row, [field]: field === "ayat" ? Number(value) : value } : row)),
    }));
  };

  const saveTemplates = async () => {
    setSaving(true);
    try {
      const payload = {
        3: templates[3].filter((t) => t.surat && !isNaN(t.ayat)),
        5: templates[5].filter((t) => t.surat && !isNaN(t.ayat)),
        7: templates[7].filter((t) => t.surat && !isNaN(t.ayat)),
      };
      localStorage.setItem("hafalan_target_templates", JSON.stringify(payload));
    } finally {
      setSaving(false);
    }
  };

  const Section = ({ k }: { k: BarisKey }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{k} Baris</h3>
        <button onClick={() => addRow(k)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center">
          <Plus className="w-4 h-4 mr-1" /> Tambah Baris
        </button>
      </div>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1 w-12">No</th>
            <th className="border px-2 py-1">Surat</th>
            <th className="border px-2 py-1 w-24">Ayat</th>
            <th className="border px-2 py-1 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {templates[k].map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1">
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  value={row.surat}
                  onChange={(e) => updateCell(k, idx, "surat", e.target.value)}
                  placeholder="Contoh: An Naba"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  type="number"
                  value={isNaN(row.ayat) ? "" : row.ayat}
                  onChange={(e) => updateCell(k, idx, "ayat", e.target.value)}
                  placeholder="Contoh: 13"
                />
              </td>
              <td className="border px-2 py-1 text-center">
                <button onClick={() => removeRow(k, idx)} className="text-red-600 hover:text-red-700">
                  <Trash className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Data Target</h2>
          <p className="text-sm text-gray-600">Isi daftar target berdasarkan jumlah baris (3/5/7). Dropdown Target pada halaman Hafalan akan mengikuti data di sini.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveTemplates} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center" disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Menyimpan..." : "Simpan"}
          </button>
          <Link href="/keagamaan/hafalan" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section k={3} />
        <Section k={5} />
        <Section k={7} />
      </div>
    </div>
  );
}