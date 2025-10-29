"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FileText, BookOpen, User } from "lucide-react";
import { api } from "@/lib/api";

interface ApiTugas {
  id_tugas: number;
  judul_tugas: string;
  deskripsi_tugas?: string;
  tanggal_pemberian: string;
  tanggal_deadline: string;
  status: "Aktif" | "Non-aktif";
  tipe_tugas: "Semua_Siswa" | "Siswa_Terpilih";
  mata_pelajaran?: {
    id_mata_pelajaran: number;
    nama_mata_pelajaran: string;
  };
  guru?: {
    nik_guru: string;
    nama_lengkap: string;
  };
  // relation filtered to current siswa (added in backend)
  tugas_siswa?: Array<{ status_pengumpulan: "Belum" | "Sudah" | "Terlambat" }>; // may come as tugasSiswa
  tugasSiswa?: Array<{ status_pengumpulan: "Belum" | "Sudah" | "Terlambat" }>;
}

type SubjectCard = {
  id_mata_pelajaran: number;
  nama_mata_pelajaran: string;
  guru_nama: string; // single or summary
  total_tugas: number;
  tugas_baru: number; // aktif dan belum mengumpulkan
};

export default function TugasMenuSiswaPage() {
  const [loading, setLoading] = useState(true);
  const [tugas, setTugas] = useState<ApiTugas[]>([]);

  useEffect(() => {
    const fetchTugas = async () => {
      try {
        setLoading(true);
        const response = await api.get("/v1/tugas");
        const list = Array.isArray(response?.data?.data?.data)
          ? response.data.data.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        setTugas(list);
      } catch (e) {
        console.error("Error fetching tugas siswa:", e);
        setTugas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTugas();
  }, []);

  const subjectCards: SubjectCard[] = useMemo(() => {
    const map = new Map<number, SubjectCard & { guruSet: Set<string> }>();
    tugas.forEach((t) => {
      const mp = t.mata_pelajaran;
      if (!mp) return;
      const id = mp.id_mata_pelajaran;
      const nama = mp.nama_mata_pelajaran;
      const guruNama = t.guru?.nama_lengkap || "-";
      const rel = (t.tugasSiswa || t.tugas_siswa || []) as Array<{
        status_pengumpulan: "Belum" | "Sudah" | "Terlambat";
      }>;
      const isAktif = t.status === "Aktif";
      const belum = rel.length > 0 && rel[0]?.status_pengumpulan === "Belum";

      if (!map.has(id)) {
        map.set(id, {
          id_mata_pelajaran: id,
          nama_mata_pelajaran: nama,
          guru_nama: guruNama,
          total_tugas: 1,
          tugas_baru: isAktif && belum ? 1 : 0,
          guruSet: new Set(guruNama !== "-" ? [guruNama] : []),
        });
      } else {
        const cur = map.get(id)!;
        cur.total_tugas += 1;
        if (isAktif && belum) cur.tugas_baru += 1;
        if (guruNama !== "-") cur.guruSet.add(guruNama);
        map.set(id, cur);
      }
    });

    return Array.from(map.values()).map((v) => {
      const gurus = Array.from(v.guruSet);
      let guru_nama = "-";
      if (gurus.length === 1) guru_nama = gurus[0];
      else if (gurus.length > 1) guru_nama = `${gurus[0]} dan lainnya`;
      return {
        id_mata_pelajaran: v.id_mata_pelajaran,
        nama_mata_pelajaran: v.nama_mata_pelajaran,
        guru_nama,
        total_tugas: v.total_tugas,
        tugas_baru: v.tugas_baru,
      };
    });
  }, [tugas]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Tugas</h1>
          <p className="text-gray-600 mt-1">Akses tugas per mata pelajaran</p>
        </div>
      </div>

      {subjectCards.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada tugas</h3>
          <p className="text-gray-600">Belum ada tugas yang ditugaskan kepada Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectCards.map((card) => (
            <Link
              key={card.id_mata_pelajaran}
              href={`/pembelajaran/tugas?search=${encodeURIComponent(card.nama_mata_pelajaran)}`}
              className="relative bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              {/* Badge jumlah tugas baru */}
              {card.tugas_baru > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-bold text-white bg-red-600 rounded-full border border-white shadow">
                  {card.tugas_baru}
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{card.nama_mata_pelajaran}</h3>
                  <div className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Guru: {card.guru_nama}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Total tugas: {card.total_tugas}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}