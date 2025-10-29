<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MonitoringSholatController extends Controller
{
    /**
     * Get monitoring statistics for sholat
     */
    public function getMonitoringStats(Request $request)
    {
        try {
            $tanggal = $request->get('tanggal');
            $jenis = $request->get('jenis_sholat');
            $kelasId = $request->get('kelas');

            // Total siswa aktif (optionally by kelas)
            $siswaQuery = DB::table('siswa')->where('status', 'Aktif');
            if (!empty($kelasId)) {
                $siswaQuery->where('id_kelas', $kelasId);
            }
            $totalSiswa = $siswaQuery->count();

            // Monitoring hadir/tidak hadir (by filters)
            $monitoringQuery = DB::table('monitoring_sholat');
            if (!empty($tanggal)) {
                $monitoringQuery->where('tanggal', $tanggal);
            }
            if (!empty($jenis)) {
                $monitoringQuery->where('jenis_sholat', $jenis);
            }
            if (!empty($kelasId)) {
                $monitoringQuery->join('siswa', 'monitoring_sholat.nis', '=', 'siswa.nis')
                                ->where('siswa.id_kelas', $kelasId);
            }

            $hadir = (clone $monitoringQuery)->where('status_kehadiran', 'Hadir')->count();
            $tidakHadir = (clone $monitoringQuery)->where('status_kehadiran', 'Tidak_Hadir')->count();

            $persentaseKehadiran = $totalSiswa > 0 ? round(($hadir / $totalSiswa) * 100, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_siswa' => $totalSiswa,
                    'hadir' => $hadir,
                    'tidak_hadir' => $tidakHadir,
                    'persentase_kehadiran' => $persentaseKehadiran
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil statistik monitoring sholat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed monitoring data for sholat
     */
    public function getMonitoringDetails(Request $request)
    {
        try {
            $tanggal = $request->get('tanggal');
            $kelasId = $request->get('kelas');
            $jenis = $request->get('jenis_sholat');

            $detailsQuery = DB::table('siswa')
                ->leftJoin('monitoring_sholat', function($join) use ($tanggal, $jenis) {
                    $join->on('siswa.nis', '=', 'monitoring_sholat.nis');
                    if (!empty($tanggal)) {
                        $join->where('monitoring_sholat.tanggal', '=', $tanggal);
                    }
                    if (!empty($jenis)) {
                        $join->where('monitoring_sholat.jenis_sholat', '=', $jenis);
                    }
                })
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap as nama',
                    'kelas.nama_kelas',
                    'monitoring_sholat.status_kehadiran',
                    'monitoring_sholat.tanggal'
                )
                ->when(!empty($kelasId), function($q) use ($kelasId) {
                    return $q->where('siswa.id_kelas', $kelasId);
                })
                ->orderBy('kelas.nama_kelas')
                ->orderBy('siswa.nama_lengkap')
                ->get();

            $details = $detailsQuery->map(function($item) {
                return [
                    'id_siswa' => $item->nis,
                    'nama_siswa' => $item->nama,
                    'nis' => $item->nis,
                    'kelas' => $item->nama_kelas,
                    'status_kehadiran' => $item->status_kehadiran ?? 'Belum Dimonitor',
                    'tanggal_monitoring' => $item->tanggal
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $details
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail monitoring sholat',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit monitoring sholat input
     */
    public function submitMonitoring(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tanggal' => 'required|date',
            'jenis_sholat' => 'required|in:Dhuha,Dhuhur,Asar',
            'entries' => 'required|array|min:1',
            'entries.*.nis' => 'required|exists:siswa,nis',
            'entries.*.status_kehadiran' => 'required|in:Hadir,Tidak_Hadir'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Ambil user dari middleware
            $user = $request->attributes->get('authenticated_user');
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            // Hanya guru yang boleh input (harus referensi ke guru)
            if ($user->user_type !== 'Guru' || empty($user->reference_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru yang dapat menginput monitoring sholat'
                ], 403);
            }

            $nikGuru = $user->reference_id;
            $existsGuru = DB::table('guru')->where('nik_guru', $nikGuru)->exists();
            if (!$existsGuru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak valid untuk input'
                ], 422);
            }

            $tanggal = $request->tanggal;
            $jenis = $request->jenis_sholat;
            $entries = $request->entries;

            $saved = 0;
            foreach ($entries as $entry) {
                $nis = $entry['nis'];
                $status = $entry['status_kehadiran'];

                $updated = DB::table('monitoring_sholat')->updateOrInsert(
                    [
                        'nis' => $nis,
                        'tanggal' => $tanggal,
                        'jenis_sholat' => $jenis,
                    ],
                    [
                        'status_kehadiran' => $status,
                        'nik_guru_input' => $nikGuru
                    ]
                );

                if ($updated) {
                    $saved++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Monitoring sholat berhasil disimpan',
                'data' => [
                    'processed' => count($entries),
                    'saved' => $saved
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan monitoring sholat',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}