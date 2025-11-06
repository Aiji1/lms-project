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

    /**
     * Export monitoring sholat bulanan ke Excel
     * Query params:
     * - month: wajib, format YYYY-MM
     * - kelas: opsional, id_kelas
     * - jenis_sholat: opsional, salah satu dari Dhuha, Dhuhur, Asar
     *   Jika tidak diberikan, akan diekspor semua jenis dalam sheet terpisah
     */
    public function exportMonthly(Request $request)
    {
        try {
            // Role enforcement: hanya Admin/Guru
            $currentUser = $request->attributes->get('authenticated_user');
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            if (!in_array($currentUser->user_type, ['Admin', 'Guru'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru atau admin yang dapat mengekspor data'
                ], 403);
            }

            $monthStr = $request->get('month'); // YYYY-MM
            $kelasFilter = $request->get('kelas');
            $jenisFilter = $request->get('jenis_sholat');
            if (empty($monthStr) || !preg_match('/^\d{4}-\d{2}$/', $monthStr)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter month wajib (format YYYY-MM)'
                ], 422);
            }

            [$year, $month] = [intval(substr($monthStr, 0, 4)), intval(substr($monthStr, 5, 2))];
            $startDate = sprintf('%04d-%02d-01', $year, $month);
            $endDate = date('Y-m-t', strtotime($startDate));
            $daysInMonth = (int) date('t', strtotime($startDate));

            // Siswa aktif (opsional filter kelas)
            $students = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select(['siswa.nis', 'siswa.nama_lengkap as nama_siswa', 'kelas.nama_kelas', 'kelas.id_kelas'])
                ->orderBy('kelas.nama_kelas')
                ->orderBy('siswa.nama_lengkap')
                ->get();

            // Ambil monitoring dalam periode
            $baseQuery = DB::table('monitoring_sholat')
                ->join('siswa', 'monitoring_sholat.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->whereBetween('monitoring_sholat.tanggal', [$startDate, $endDate])
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select([
                    'monitoring_sholat.nis',
                    'monitoring_sholat.tanggal',
                    'monitoring_sholat.jenis_sholat',
                    'monitoring_sholat.status_kehadiran',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas'
                ])
                ->orderBy('monitoring_sholat.tanggal');

            // Kita fokus pada dua jenis: Dhuhur dan Asar (sesuai kebutuhan)
            $targetJenis = ['Dhuhur', 'Asar'];

            // Siapkan spreadsheet
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

            $monthNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            $kelasNama = null;
            if (!empty($kelasFilter)) {
                $kelasRow = DB::table('kelas')->where('id_kelas', $kelasFilter)->first();
                $kelasNama = $kelasRow ? ($kelasRow->nama_kelas ?? null) : null;
            }

            // Ambil semua response Dhuhur/Asar
            $responses = (clone $baseQuery)
                ->whereIn('monitoring_sholat.jenis_sholat', $targetJenis)
                ->get();

            // Pivot: per siswa, per hari, dua jenis
            $presence = [];
            foreach ($responses as $r) {
                $day = (int) date('j', strtotime($r->tanggal));
                if (!isset($presence[$r->nis])) {
                    $presence[$r->nis] = [];
                    for ($d = 1; $d <= $daysInMonth; $d++) {
                        $presence[$r->nis][$d] = ['Dhuhur' => 0, 'Asar' => 0];
                    }
                }
                if (in_array($r->jenis_sholat, $targetJenis)) {
                    $presence[$r->nis][$day][$r->jenis_sholat] = $r->status_kehadiran === 'Hadir' ? 1 : 0;
                }
            }

            // Satu sheet dengan sub-kolom per hari (Dhuhur, Asar)
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle(($monthNames[$month] ?? $month) . ' ' . $year);

            // Header judul dan info
            $sheet->mergeCells('B1:AJ1');
            $sheet->setCellValue('B1', 'REKAPAN SHOLAT SISWA');
            $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('B1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('C2', 'Kelas:');
            $sheet->setCellValue('E2', $kelasNama ?: 'Semua Kelas');
            $sheet->setCellValue('I2', 'Bulan:');
            $sheet->setCellValue('K2', ($monthNames[$month] ?? $month));
            $sheet->setCellValue('O2', 'Tahun:');
            $sheet->setCellValue('Q2', $year);

            // Header tabel
            $sheet->setCellValue('A4', 'No');
            $sheet->setCellValue('B4', 'Nama Siswa');
            $sheet->setCellValue('C4', 'Komponen');
            $startColIndex = 4; // D
            // Baris 4: tanggal (merge dua kolom)
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $baseIdx = $startColIndex + (($d - 1) * 2);
                $col1 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx);
                $col2 = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx + 1);
                $sheet->mergeCells($col1 . '4:' . $col2 . '4');
                $sheet->setCellValue($col1 . '4', $d);
            }
            $totalDhCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth * 2);
            $totalAsCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth * 2 + 1);
            $grandTotalCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth * 2 + 2);
            $sheet->mergeCells($totalDhCol . '4:' . $totalDhCol . '5');
            $sheet->mergeCells($totalAsCol . '4:' . $totalAsCol . '5');
            $sheet->mergeCells($grandTotalCol . '4:' . $grandTotalCol . '5');
            $sheet->setCellValue($totalDhCol . '4', 'Total Dhuhur');
            $sheet->setCellValue($totalAsCol . '4', 'Total Asar');
            $sheet->setCellValue($grandTotalCol . '4', 'Total Keseluruhan');

            // Baris 5: nama hari per sub-kolom
            $dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
                $dow = (int) date('w', strtotime($dateStr));
                $label = $dayNames[$dow] ?? '';
                $baseIdx = $startColIndex + (($d - 1) * 2);
                $colDh = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx);
                $colAs = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx + 1);
                $sheet->setCellValue($colDh . '5', 'Dhuhur');
                $sheet->setCellValue($colAs . '5', 'Asar');
            }
            $sheet->mergeCells('A4:A5');
            $sheet->mergeCells('B4:B5');
            $sheet->mergeCells('C4:C5');
            $headerRange = 'A4:' . $grandTotalCol . '5';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
            $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
                ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

            // Data siswa
            $currentRow = 6;
            $studentIndex = 1;
            foreach ($students as $s) {
                $sheet->setCellValue('A' . $currentRow, $studentIndex);
                $sheet->setCellValue('B' . $currentRow, $s->nama_siswa);
                $sheet->setCellValue('C' . $currentRow, 'Kehadiran');
                // nilai harian
                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $baseIdx = $startColIndex + (($d - 1) * 2);
                    $colDh = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx);
                    $colAs = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($baseIdx + 1);
                    $valDh = $presence[$s->nis][$d]['Dhuhur'] ?? '';
                    $valAs = $presence[$s->nis][$d]['Asar'] ?? '';
                    $sheet->setCellValue($colDh . $currentRow, $valDh);
                    $sheet->setCellValue($colAs . $currentRow, $valAs);
                }
                // Total per jenis
                $sumDhStart = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex) . $currentRow;
                $sumDhEnd   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth * 2 - 2) . $currentRow;
                $sumAsStart = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + 1) . $currentRow;
                $sumAsEnd   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth * 2 - 1) . $currentRow;
                // SUM kolom berjarak 2: gunakan SUM setiap dua kolom dengan helper tidak tersedia, pakai rumus manual
                // Untuk kesederhanaan, isi nilai total via perhitungan PHP
                $totalDh = 0; $totalAs = 0;
                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $totalDh += $presence[$s->nis][$d]['Dhuhur'] ?? 0;
                    $totalAs += $presence[$s->nis][$d]['Asar'] ?? 0;
                }
                $sheet->setCellValue($totalDhCol . $currentRow, $totalDh);
                $sheet->setCellValue($totalAsCol . $currentRow, $totalAs);
                $sheet->setCellValue($grandTotalCol . $currentRow, $totalDh + $totalAs);

                $sheet->getStyle('A' . $currentRow . ':' . $grandTotalCol . $currentRow)
                    ->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                $sheet->getStyle('C' . $currentRow . ':' . $grandTotalCol . $currentRow)
                    ->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                $studentIndex++;
                $currentRow++;
            }

            // Auto-size
            foreach (['A','B','C',$totalDhCol,$totalAsCol,$grandTotalCol] as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            for ($i = $startColIndex; $i < $startColIndex + $daysInMonth * 2; $i++) {
                $sheet->getColumnDimension(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i))->setWidth(3.5);
            }

            // Legend
            $legendStartColIndex = $startColIndex + $daysInMonth * 2 + 4;
            $lgNo = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex);
            $lgKet = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex + 1);
            $sheet->setCellValue($lgNo . '6', 'Keterangan');
            $sheet->setCellValue($lgKet . '6', 'Dhuhur/Asar: Hadir = 1, Tidak Hadir = 0');

            // Stream sebagai file unduhan
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'Rekapan_Sholat_Siswa_' . ($monthNames[$month] ?? $month) . '_' . $year . '.xlsx';
            return response()->stream(
                function () use ($writer) {
                    $writer->save('php://output');
                },
                200,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'max-age=0',
                ]
            );
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor monitoring sholat bulanan: ' . $e->getMessage()
            ], 500);
        }
    }
}