<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LaporanController extends Controller
{
    /**
     * Get common form data for laporan filters
     */
    public function getFormData(Request $request)
    {
        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->select('id_tahun_ajaran', 'tahun_ajaran', 'semester', 'status')
                ->orderBy('id_tahun_ajaran', 'desc')
                ->get();

            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select('kelas.id_kelas', 'kelas.nama_kelas', 'jurusan.nama_jurusan')
                ->orderBy('kelas.tingkat', 'asc')
                ->orderBy('kelas.nama_kelas', 'asc')
                ->get();

            $statusPresensi = [
                ['value' => 'Hadir', 'label' => 'Hadir'],
                ['value' => 'Sakit', 'label' => 'Sakit'],
                ['value' => 'Izin', 'label' => 'Izin'],
                ['value' => 'Alpha', 'label' => 'Alpha'],
            ];

            $statusHafalan = [
                ['value' => 'Proses', 'label' => 'Proses'],
                ['value' => 'Selesai', 'label' => 'Selesai'],
                ['value' => 'Tertunda', 'label' => 'Tertunda'],
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data form laporan berhasil diambil',
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'kelas' => $kelas,
                    'status_presensi' => $statusPresensi,
                    'status_hafalan' => $statusHafalan,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form laporan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Laporan Presensi Harian - list and summary
     */
    public function presensi(Request $request)
    {
        try {
            $tanggalMulai = $request->get('tanggal_mulai');
            $tanggalSelesai = $request->get('tanggal_selesai');
            $kelas = $request->get('kelas');
            $status = $request->get('status');
            $perPage = $request->get('per_page', 10);

            $query = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'presensi_harian.id_presensi_harian',
                    'presensi_harian.nis',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan',
                    'presensi_harian.tanggal',
                    'presensi_harian.jam_masuk',
                    'presensi_harian.status',
                    'presensi_harian.metode_presensi'
                );

            if (!empty($tanggalMulai)) {
                $query->where('presensi_harian.tanggal', '>=', $tanggalMulai);
            }
            if (!empty($tanggalSelesai)) {
                $query->where('presensi_harian.tanggal', '<=', $tanggalSelesai);
            }
            if (!empty($kelas)) {
                $query->where('kelas.id_kelas', $kelas);
            }
            if (!empty($status)) {
                $query->where('presensi_harian.status', $status);
            }

            $query->orderBy('presensi_harian.tanggal', 'desc')->orderBy('presensi_harian.id_presensi_harian', 'desc');
            $data = $query->paginate($perPage);

            // Summary aggregations
            $summaryQuery = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas');
            if (!empty($tanggalMulai)) {
                $summaryQuery->where('presensi_harian.tanggal', '>=', $tanggalMulai);
            }
            if (!empty($tanggalSelesai)) {
                $summaryQuery->where('presensi_harian.tanggal', '<=', $tanggalSelesai);
            }
            if (!empty($kelas)) {
                $summaryQuery->where('kelas.id_kelas', $kelas);
            }

            $total = (clone $summaryQuery)->count();
            $hadir = (clone $summaryQuery)->where('presensi_harian.status', 'Hadir')->count();
            $sakit = (clone $summaryQuery)->where('presensi_harian.status', 'Sakit')->count();
            $izin = (clone $summaryQuery)->where('presensi_harian.status', 'Izin')->count();
            $alpha = (clone $summaryQuery)->where('presensi_harian.status', 'Alpha')->count();
            $persentaseHadir = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

            return response()->json([
                'success' => true,
                'message' => 'Laporan presensi berhasil diambil',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total(),
                ],
                'summary' => [
                    'total' => $total,
                    'hadir' => $hadir,
                    'sakit' => $sakit,
                    'izin' => $izin,
                    'alpha' => $alpha,
                    'persentase_hadir' => $persentaseHadir,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan presensi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Laporan Hafalan - list and summary
     */
    public function tahfidz(Request $request)
    {
        try {
            $tahunAjaran = $request->get('id_tahun_ajaran');
            $kelas = $request->get('kelas');
            $statusHafalan = $request->get('status_hafalan');
            $perPage = $request->get('per_page', 10);

            $query = DB::table('hafalan')
                ->leftJoin('siswa', 'hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select(
                    'hafalan.id_hafalan',
                    'hafalan.nis',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'hafalan.nama_surah as surah_mulai',
                    'hafalan.ayat_mulai',
                    'hafalan.surah_selesai',
                    'hafalan.ayat_selesai',
                    'hafalan.total_baris',
                    'hafalan.tanggal_mulai',
                    'hafalan.tanggal_selesai',
                    'hafalan.status_hafalan'
                );

            if (!empty($tahunAjaran)) {
                $query->where('hafalan.id_tahun_ajaran', $tahunAjaran);
            }
            if (!empty($kelas)) {
                $query->where('kelas.id_kelas', $kelas);
            }
            if (!empty($statusHafalan)) {
                $query->where('hafalan.status_hafalan', $statusHafalan);
            }

            $query->orderBy('hafalan.tanggal_mulai', 'desc');
            $data = $query->paginate($perPage);

            // Summary
            $summaryQuery = DB::table('hafalan')
                ->leftJoin('siswa', 'hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas');
            if (!empty($tahunAjaran)) {
                $summaryQuery->where('hafalan.id_tahun_ajaran', $tahunAjaran);
            }
            if (!empty($kelas)) {
                $summaryQuery->where('kelas.id_kelas', $kelas);
            }

            $total = (clone $summaryQuery)->count();
            $selesai = (clone $summaryQuery)->where('hafalan.status_hafalan', 'Selesai')->count();
            $proses = (clone $summaryQuery)->where('hafalan.status_hafalan', 'Proses')->count();
            $tertunda = (clone $summaryQuery)->where('hafalan.status_hafalan', 'Tertunda')->count();
            $rataRataBaris = (clone $summaryQuery)->avg('hafalan.total_baris');
            $rataRataBaris = $rataRataBaris ? round($rataRataBaris, 1) : 0;

            return response()->json([
                'success' => true,
                'message' => 'Laporan tahfidz berhasil diambil',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total(),
                ],
                'summary' => [
                    'total' => $total,
                    'selesai' => $selesai,
                    'proses' => $proses,
                    'tertunda' => $tertunda,
                    'rata_rata_baris' => $rataRataBaris,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan tahfidz',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Laporan Statistik sekolah - aggregated metrics
     */
    public function statistik(Request $request)
    {
        try {
            // Global counts
            $totalSiswa = DB::table('siswa')->where('status', 'Aktif')->count();
            $totalGuru = DB::table('guru')->where('status', 'Aktif')->count();
            $totalKelas = DB::table('kelas')->count();
            $totalMapel = DB::table('mata_pelajaran')->where('status', 'Aktif')->count();

            // Presensi metrics
            $totalPresensi = DB::table('presensi_harian')->count();
            $hadirPresensi = DB::table('presensi_harian')->where('status', 'Hadir')->count();
            $persentaseHadir = $totalPresensi > 0 ? round(($hadirPresensi / $totalPresensi) * 100, 1) : 0;

            // Hafalan metrics
            $totalHafalan = DB::table('hafalan')->count();
            $hafalanSelesai = DB::table('hafalan')->where('status_hafalan', 'Selesai')->count();
            $rataRataBaris = DB::table('hafalan')->avg('total_baris');
            $rataRataBaris = $rataRataBaris ? round($rataRataBaris, 1) : 0;

            // Nilai metrics
            $avgNilaiFinal = DB::table('nilai')->where('status', 'Final')->avg('nilai');
            $avgNilaiFinal = $avgNilaiFinal ? round($avgNilaiFinal, 1) : 0;

            $stats = [
                'total_siswa' => $totalSiswa,
                'total_guru' => $totalGuru,
                'total_kelas' => $totalKelas,
                'total_mapel' => $totalMapel,
                'presensi_total' => $totalPresensi,
                'presensi_hadir_persen' => $persentaseHadir,
                'hafalan_total' => $totalHafalan,
                'hafalan_selesai' => $hafalanSelesai,
                'hafalan_rata_baris' => $rataRataBaris,
                'nilai_rata_final' => $avgNilaiFinal,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Statistik laporan berhasil diambil',
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik laporan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}