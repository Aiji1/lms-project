<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdabQuestionnaireResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdabQuestionnaireResponseController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string',
            'tanggal' => 'required|date',
            'entries' => 'required|array|min:1',
            'entries.*.id_question' => 'required|integer',
            'entries.*.jawaban' => 'required|string|in:Ya,Tidak',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $nis = $request->input('nis');
        $tanggal = $request->input('tanggal');
        $entries = $request->input('entries');

        // Hapus jawaban sebelumnya untuk nis + tanggal agar idempotent
        AdabQuestionnaireResponse::where('nis', $nis)->where('tanggal', $tanggal)->delete();

        $payload = [];
        foreach ($entries as $e) {
            $payload[] = [
                'nis' => $nis,
                'tanggal' => $tanggal,
                'id_question' => $e['id_question'],
                'jawaban' => $e['jawaban'],
            ];
        }
        AdabQuestionnaireResponse::insert($payload);

        return response()->json(['message' => 'Jawaban kuesioner tersimpan', 'count' => count($payload)]);
    }

    /**
     * Export kuesioner adab bulanan per siswa (filter kelas opsional)
     * Query params:
     * - month: wajib, format YYYY-MM
     * - kelas: opsional, id_kelas
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
            if (empty($monthStr) || !preg_match('/^\d{4}-\d{2}$/', $monthStr)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter month wajib (format YYYY-MM)'
                ], 422);
            }

            [$year, $month] = [intval(substr($monthStr, 0, 4)), intval(substr($monthStr, 5, 2))];
            $startDate = sprintf('%04d-%02d-01', $year, $month);
            $endDate = date('Y-m-t', strtotime($startDate));

            // Ambil daftar pertanyaan aktif sebagai kolom dinamis
            $questions = DB::table('adab_questions')
                ->where('status', 'Aktif')
                ->orderBy('id_component')
                ->orderBy('id_question')
                ->get();

            // Map pertanyaan untuk akses cepat
            $questionIds = $questions->pluck('id_question')->all();

            // Ambil komponen aktif dan kelompokkan pertanyaan per komponen
            $components = DB::table('adab_components')
                ->where('status', 'Aktif')
                ->orderBy('urutan')
                ->orderBy('id_component')
                ->get();
            $questionsByComponent = [];
            foreach ($components as $comp) {
                $questionsByComponent[$comp->id_component] = $questions->where('id_component', $comp->id_component)->values();
            }

            // Ambil siswa aktif (filter kelas bila ada)
            $students = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select(['siswa.nis', 'siswa.nama_lengkap as nama_siswa', 'kelas.nama_kelas', 'kelas.id_kelas'])
                ->get();

            // Ambil jawaban dalam bulan terpilih
            $responses = DB::table('adab_questionnaire_responses')
                ->join('siswa', 'adab_questionnaire_responses.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->whereBetween('adab_questionnaire_responses.tanggal', [$startDate, $endDate])
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select([
                    'adab_questionnaire_responses.nis',
                    'adab_questionnaire_responses.tanggal',
                    'adab_questionnaire_responses.id_question',
                    'adab_questionnaire_responses.jawaban',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas'
                ])
                ->orderBy('adab_questionnaire_responses.tanggal')
                ->get();

            // Bentuk struktur pivot: per siswa per tanggal
            $byStudentDate = [];
            foreach ($responses as $r) {
                $key = $r->nis . '|' . $r->tanggal;
                if (!isset($byStudentDate[$key])) {
                    $byStudentDate[$key] = [
                        'nis' => $r->nis,
                        'nama' => $r->nama_siswa,
                        'kelas' => $r->nama_kelas,
                        'tanggal' => $r->tanggal,
                        'answers' => []
                    ];
                }
                $byStudentDate[$key]['answers'][$r->id_question] = $r->jawaban === 'Ya' ? 1 : 0;
            }

            // Siapkan spreadsheet dengan format REKAPAN ADAB SISWA (days x components)
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Nama bulan (ID)
            $monthNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];

            // Info kelas
            $kelasNama = null;
            if (!empty($kelasFilter)) {
                $kelasRow = DB::table('kelas')->where('id_kelas', $kelasFilter)->first();
                $kelasNama = $kelasRow ? ($kelasRow->nama_kelas ?? null) : null;
            }

            // Bangun header judul (rentang diperluas untuk mengakomodasi kolom tambahan)
            $sheet->mergeCells('B1:AJ1');
            $sheet->setCellValue('B1', 'REKAPAN ADAB SISWA');
            $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('B1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Baris info Kelas / Bulan / Tahun
            $sheet->setCellValue('C2', 'Kelas:');
            $sheet->setCellValue('E2', $kelasNama ?: 'Semua Kelas');
            $sheet->setCellValue('I2', 'Bulan:');
            $sheet->setCellValue('K2', ($monthNames[$month] ?? $month));
            $sheet->setCellValue('O2', 'Tahun:');
            $sheet->setCellValue('Q2', $year);

            // Header tabel: No | Nama Siswa | Komponen | 1..30 | Total | Total Keseluruhan
            $sheet->setCellValue('A4', 'No');
            $sheet->setCellValue('B4', 'Nama Siswa');
            $sheet->setCellValue('C4', 'Komponen');
            $daysInMonth = (int) date('t', strtotime($startDate));
            $startColIndex = 4; // D
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                $sheet->setCellValue($colLetter . '4', $d);
            }
            $totalColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth);
            $sheet->setCellValue($totalColLetter . '4', 'Total');
            $grandTotalColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth + 1);
            $sheet->setCellValue($grandTotalColLetter . '4', 'Total Keseluruhan');

            // Baris hari (Sen, Sel, Rab, ...)
            $dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
                $dow = (int) date('w', strtotime($dateStr)); // 0=Sun
                $label = $dayNames[$dow] ?? '';
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                $sheet->setCellValue($colLetter . '5', $label);
            }
            $sheet->mergeCells('A4:A5');
            $sheet->mergeCells('B4:B5');
            $sheet->mergeCells('C4:C5');
            $sheet->mergeCells($totalColLetter . '4:' . $totalColLetter . '5');
            $sheet->mergeCells($grandTotalColLetter . '4:' . $grandTotalColLetter . '5');

            // Style header tabel
            $headerRange = 'A4:' . $grandTotalColLetter . '5';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
            $sheet->getStyle($headerRange)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

            // Persiapkan pivot jawaban: per siswa, per pertanyaan, per hari
            $answersByStudentQuestionDay = [];
            foreach ($responses as $r) {
                $day = (int) date('j', strtotime($r->tanggal));
                $answersByStudentQuestionDay[$r->nis][$r->id_question][$day] = ($r->jawaban === 'Ya') ? 1 : 0;
            }

            // Warna per komponen (berulang jika lebih banyak komponen)
            $componentColors = [
                'FFFDEBD0','FFFADBD8','FFE8DAEF','FFD6EAF8','FFD4EFDF','FFFCF3CF',
                'FFEBDEF0','FFD5F5E3','FFF2D7D5','FFE5E8E8'
            ];

            // Tulis data per siswa (blok beberapa baris per siswa)
            $currentRow = 6; // mulai setelah header
            $studentIndex = 1;
            foreach ($students as $s) {
                $blockStart = $currentRow;
                $compIdx = 0;
                foreach ($components as $comp) {
                    $compColor = $componentColors[$compIdx % count($componentColors)];
                    $qIdx = 0;
                    foreach ($questionsByComponent[$comp->id_component] as $q) {
                        $qid = $q->id_question;
                        // Kolom label komponen: angka reset per komponen
                        $sheet->setCellValue('C' . $currentRow, ($qIdx + 1));
                        // Isi per hari
                        for ($d = 1; $d <= $daysInMonth; $d++) {
                            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                            $val = $answersByStudentQuestionDay[$s->nis][$qid][$d] ?? '';
                            $sheet->setCellValue($colLetter . $currentRow, $val);
                        }
                        // Total baris ini
                        $rowTotalStart = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex) . $currentRow;
                        $rowTotalEnd   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth - 1) . $currentRow;
                        $sheet->setCellValue($totalColLetter . $currentRow, "=SUM($rowTotalStart:$rowTotalEnd)");
                        // Warna latar per komponen (satu warna untuk semua pertanyaan pada komponen)
                        $sheet->getStyle('C' . $currentRow . ':' . $totalColLetter . $currentRow)
                            ->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setARGB($compColor);
                        $currentRow++;
                        $qIdx++;
                    }
                    $compIdx++;
                }
                $blockEnd = $currentRow - 1;
                // Merge No dan Nama Siswa untuk blok ini
                $sheet->mergeCells('A' . $blockStart . ':A' . $blockEnd);
                $sheet->mergeCells('B' . $blockStart . ':B' . $blockEnd);
                $sheet->setCellValue('A' . $blockStart, $studentIndex);
                $sheet->setCellValue('B' . $blockStart, $s->nama_siswa);
                // Center alignment untuk No dan Nama Siswa
                $sheet->getStyle('A' . $blockStart . ':A' . $blockEnd)->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                    ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                $sheet->getStyle('B' . $blockStart . ':B' . $blockEnd)->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                    ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                // Total keseluruhan per siswa: jumlah dari kolom Total dalam blok
                $sheet->mergeCells($grandTotalColLetter . $blockStart . ':' . $grandTotalColLetter . $blockEnd);
                $sheet->setCellValue($grandTotalColLetter . $blockStart, "=SUM($totalColLetter$blockStart:$totalColLetter$blockEnd)");
                $sheet->getStyle($grandTotalColLetter . $blockStart . ':' . $grandTotalColLetter . $blockEnd)->getAlignment()
                    ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                    ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                $sheet->getStyle($grandTotalColLetter . $blockStart)->getFont()->setBold(true);
                $studentIndex++;
            }

            // Auto-size beberapa kolom
            foreach (['A','B','C',$totalColLetter,$grandTotalColLetter] as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            for ($i = $startColIndex; $i < $startColIndex + $daysInMonth; $i++) {
                $sheet->getColumnDimension(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i))->setWidth(3.5);
            }

            // Border area data
            $lastDataRow = $currentRow - 1;
            if ($lastDataRow >= 6) {
                $sheet->getStyle('A6:' . $grandTotalColLetter . $lastDataRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            }

            // Tambahkan keterangan per komponen di samping kanan tabel
            $legendStartColIndex = $startColIndex + $daysInMonth + 4; // Total + Total Keseluruhan + 2 kolom spasi
            $lgNo = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex);
            $lgPert = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex + 1);
            $lgWarna = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex + 2);
            $sheet->setCellValue($lgPert . '4', 'Keterangan Komponen');
            $sheet->mergeCells($lgPert . '4:' . $lgWarna . '4');
            $sheet->getStyle($lgPert . '4')->getFont()->setBold(true);
            $sheet->setCellValue($lgNo . '5', 'No');
            $sheet->setCellValue($lgPert . '5', 'Pertanyaan');
            $sheet->setCellValue($lgWarna . '5', 'Warna');
            $legendRow = 6;
            $compIdx = 0;
            foreach ($components as $comp) {
                $compColor = $componentColors[$compIdx % count($componentColors)];
                // Judul komponen dengan warna full baris (rapih)
                $sheet->setCellValue($lgPert . $legendRow, (string)($comp->nama_component ?? 'Komponen'));
                $sheet->getStyle($lgPert . $legendRow)->getFont()->setBold(true);
                $sheet->getStyle($lgNo . $legendRow . ':' . $lgWarna . $legendRow)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB($compColor);
                $legendRow++;
                // Pertanyaan dalam komponen, penomoran reset
                $qIdx = 1;
                foreach ($questionsByComponent[$comp->id_component] as $q) {
                    $sheet->setCellValue($lgNo . $legendRow, $qIdx);
                    $sheet->setCellValue($lgPert . $legendRow, trim((string)($q->teks_pertanyaan ?? ('Pertanyaan ' . $q->id_question))));
                    // Warna full satu baris legenda
                    $sheet->getStyle($lgNo . $legendRow . ':' . $lgWarna . $legendRow)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setARGB($compColor);
                    $legendRow++;
                    $qIdx++;
                }
                $compIdx++;
            }
            // Border legenda
            $sheet->getStyle($lgNo . '5:' . $lgWarna . ($legendRow - 1))->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            // Lebar kolom dan wrapping agar lebih rapi
            $sheet->getColumnDimension($lgPert)->setWidth(60);
            $sheet->getStyle($lgPert . '6:' . $lgPert . ($legendRow - 1))->getAlignment()->setWrapText(true);

            // Stream sebagai file unduhan (nama file sesuai contoh)
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'Rekapan_Adab_Siswa_' . ($monthNames[$month] ?? $month) . '_' . $year . ($kelasNama ? ('_Kelas_' . preg_replace('/\s+/', '_', $kelasNama)) : '') . '.xlsx';

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
                'message' => 'Gagal mengekspor kuesioner adab: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export kuesioner adab untuk 3 bulan berturut-turut dalam satu workbook.
     * Query params:
     * - month: wajib, format YYYY-MM (bulan awal)
     * - kelas: opsional, id_kelas
     */
    public function exportQuarterly(Request $request)
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
            if (empty($monthStr) || !preg_match('/^\d{4}-\d{2}$/', $monthStr)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter month wajib (format YYYY-MM)'
                ], 422);
            }

            $baseYear = intval(substr($monthStr, 0, 4));
            $baseMonth = intval(substr($monthStr, 5, 2));

            // Pertanyaan aktif (dipakai di semua bulan)
            $questions = DB::table('adab_questions')
                ->where('status', 'Aktif')
                ->orderBy('id_component')
                ->orderBy('id_question')
                ->get();
            $questionIds = $questions->pluck('id_question')->all();

            // Komponen aktif dan mapping pertanyaan per komponen
            $components = DB::table('adab_components')
                ->where('status', 'Aktif')
                ->orderBy('urutan')
                ->orderBy('id_component')
                ->get();
            $questionsByComponent = [];
            foreach ($components as $comp) {
                $questionsByComponent[$comp->id_component] = $questions->where('id_component', $comp->id_component)->values();
            }

            // Siswa aktif (dipakai di semua bulan)
            $students = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select(['siswa.nis', 'siswa.nama_lengkap as nama_siswa', 'kelas.nama_kelas', 'kelas.id_kelas'])
                ->get();

            $monthNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            // Bangun sheet untuk setiap bulan: base, base+1, base+2
            for ($offset = 0; $offset < 3; $offset++) {
                $year = (int) date('Y', strtotime(sprintf('%04d-%02d-01', $baseYear, $baseMonth) . " +{$offset} month"));
                $month = (int) date('n', strtotime(sprintf('%04d-%02d-01', $baseYear, $baseMonth) . " +{$offset} month"));
                $startDate = sprintf('%04d-%02d-01', $year, $month);
                $endDate = date('Y-m-t', strtotime($startDate));

                // Ambil jawaban untuk periode
                $responses = DB::table('adab_questionnaire_responses')
                    ->join('siswa', 'adab_questionnaire_responses.nis', '=', 'siswa.nis')
                    ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                    ->whereBetween('adab_questionnaire_responses.tanggal', [$startDate, $endDate])
                    ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                        return $q->where('kelas.id_kelas', $kelasFilter);
                    })
                    ->select([
                        'adab_questionnaire_responses.nis',
                        'adab_questionnaire_responses.tanggal',
                        'adab_questionnaire_responses.id_question',
                        'adab_questionnaire_responses.jawaban',
                        'siswa.nama_lengkap as nama_siswa',
                        'kelas.nama_kelas'
                    ])
                    ->orderBy('adab_questionnaire_responses.tanggal')
                    ->get();

                // Pivot per siswa per tanggal
                $byStudentDate = [];
                foreach ($responses as $r) {
                    $key = $r->nis . '|' . $r->tanggal;
                    if (!isset($byStudentDate[$key])) {
                        $byStudentDate[$key] = [
                            'nis' => $r->nis,
                            'nama' => $r->nama_siswa,
                            'kelas' => $r->nama_kelas,
                            'tanggal' => $r->tanggal,
                            'answers' => []
                        ];
                    }
                    $byStudentDate[$key]['answers'][$r->id_question] = $r->jawaban === 'Ya' ? 1 : 0;
                }

                // Buat sheet untuk bulan ini dengan format grid harian
                $sheet = $offset === 0 ? $spreadsheet->getActiveSheet() : $spreadsheet->createSheet($offset);
                $sheet->setTitle(($monthNames[$month] ?? $month) . ' ' . $year);

                // Header judul (rentang diperluas untuk kolom tambahan)
                $sheet->mergeCells('B1:AJ1');
                $sheet->setCellValue('B1', 'REKAPAN ADAB SISWA');
                $sheet->getStyle('B1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('B1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

                // Info kelas / bulan / tahun
                $kelasNama = null;
                if (!empty($kelasFilter)) {
                    $kelasRow = DB::table('kelas')->where('id_kelas', $kelasFilter)->first();
                    $kelasNama = $kelasRow ? ($kelasRow->nama_kelas ?? null) : null;
                }
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
                $daysInMonth = (int) date('t', strtotime(sprintf('%04d-%02d-01', $year, $month)));
                $startColIndex = 4; // D
                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                    $sheet->setCellValue($colLetter . '4', $d);
                }
                $totalColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth);
                $sheet->setCellValue($totalColLetter . '4', 'Total');
                $grandTotalColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth + 1);
                $sheet->setCellValue($grandTotalColLetter . '4', 'Total Keseluruhan');

                // Baris nama hari
                $dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
                for ($d = 1; $d <= $daysInMonth; $d++) {
                    $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
                    $dow = (int) date('w', strtotime($dateStr));
                    $label = $dayNames[$dow] ?? '';
                    $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                    $sheet->setCellValue($colLetter . '5', $label);
                }
                $sheet->mergeCells('A4:A5');
                $sheet->mergeCells('B4:B5');
                $sheet->mergeCells('C4:C5');
                $sheet->mergeCells($totalColLetter . '4:' . $totalColLetter . '5');
                $sheet->mergeCells($grandTotalColLetter . '4:' . $grandTotalColLetter . '5');
                $headerRange = 'A4:' . $grandTotalColLetter . '5';
                $sheet->getStyle($headerRange)->getFont()->setBold(true);
                $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                $sheet->getStyle($headerRange)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                // Pivot jawaban: per siswa, per pertanyaan, per hari
                $answersByStudentQuestionDay = [];
                foreach ($byStudentDate as $entry) {
                    // entry di sini berkelompok per siswa per tanggal; perlu pecah lagi per pertanyaan
                }
                foreach ($responses as $r) {
                    $day = (int) date('j', strtotime($r->tanggal));
                    $answersByStudentQuestionDay[$r->nis][$r->id_question][$day] = ($r->jawaban === 'Ya') ? 1 : 0;
                }

                // Palet warna per komponen
                $componentColors = [
                    'FFFDEBD0','FFFADBD8','FFE8DAEF','FFD6EAF8','FFD4EFDF','FFFCF3CF',
                    'FFEBDEF0','FFD5F5E3','FFF2D7D5','FFE5E8E8'
                ];

                // Tulis data per siswa
                $currentRow = 6;
                $studentIndex = 1;
                foreach ($students as $s) {
                    $blockStart = $currentRow;
                    $compIdx = 0;
                    foreach ($components as $comp) {
                        $compColor = $componentColors[$compIdx % count($componentColors)];
                        $qIdx = 0;
                        foreach ($questionsByComponent[$comp->id_component] as $q) {
                            $qid = $q->id_question;
                            $sheet->setCellValue('C' . $currentRow, ($qIdx + 1));
                            for ($d = 1; $d <= $daysInMonth; $d++) {
                                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + ($d - 1));
                                $val = $answersByStudentQuestionDay[$s->nis][$qid][$d] ?? '';
                                $sheet->setCellValue($colLetter . $currentRow, $val);
                            }
                            $rowTotalStart = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex) . $currentRow;
                            $rowTotalEnd   = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startColIndex + $daysInMonth - 1) . $currentRow;
                            $sheet->setCellValue($totalColLetter . $currentRow, "=SUM($rowTotalStart:$rowTotalEnd)");
                            $sheet->getStyle('C' . $currentRow . ':' . $totalColLetter . $currentRow)
                                ->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                                ->getStartColor()->setARGB($compColor);
                            $currentRow++;
                            $qIdx++;
                        }
                        $compIdx++;
                    }
                    $blockEnd = $currentRow - 1;
                    $sheet->mergeCells('A' . $blockStart . ':A' . $blockEnd);
                    $sheet->mergeCells('B' . $blockStart . ':B' . $blockEnd);
                    $sheet->setCellValue('A' . $blockStart, $studentIndex);
                    $sheet->setCellValue('B' . $blockStart, $s->nama_siswa);
                    // Center alignment untuk No dan Nama Siswa
                    $sheet->getStyle('A' . $blockStart . ':A' . $blockEnd)->getAlignment()
                        ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    $sheet->getStyle('B' . $blockStart . ':B' . $blockEnd)->getAlignment()
                        ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    // Total keseluruhan per siswa
                    $sheet->mergeCells($grandTotalColLetter . $blockStart . ':' . $grandTotalColLetter . $blockEnd);
                    $sheet->setCellValue($grandTotalColLetter . $blockStart, "=SUM($totalColLetter$blockStart:$totalColLetter$blockEnd)");
                    $sheet->getStyle($grandTotalColLetter . $blockStart . ':' . $grandTotalColLetter . $blockEnd)->getAlignment()
                        ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    $sheet->getStyle($grandTotalColLetter . $blockStart)->getFont()->setBold(true);
                    $studentIndex++;
                }

                // Auto-size / width
                foreach (['A','B','C',$totalColLetter,$grandTotalColLetter] as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                for ($i = $startColIndex; $i < $startColIndex + $daysInMonth; $i++) {
                    $sheet->getColumnDimension(\PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i))->setWidth(3.5);
                }

                // Border area data
                $lastDataRow = $currentRow - 1;
                if ($lastDataRow >= 6) {
                    $sheet->getStyle('A6:' . $grandTotalColLetter . $lastDataRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                }

                // Tambahkan legenda komponen di samping kanan (judul komponen lalu pertanyaan bernomor reset)
                $legendStartColIndex = $startColIndex + $daysInMonth + 4; // geser karena ada kolom Grand Total
                $lgNo = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex);
                $lgPert = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex + 1);
                $lgWarna = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($legendStartColIndex + 2);
                $sheet->setCellValue($lgPert . '4', 'Keterangan Komponen');
                $sheet->mergeCells($lgPert . '4:' . $lgWarna . '4');
                $sheet->getStyle($lgPert . '4')->getFont()->setBold(true);
                $sheet->setCellValue($lgNo . '5', 'No');
                $sheet->setCellValue($lgPert . '5', 'Pertanyaan');
                $sheet->setCellValue($lgWarna . '5', 'Warna');
                $legendRow = 6;
                $compIdx = 0;
                foreach ($components as $comp) {
                    $compColor = $componentColors[$compIdx % count($componentColors)];
                    $sheet->setCellValue($lgPert . $legendRow, (string)($comp->nama_component ?? 'Komponen'));
                    $sheet->getStyle($lgPert . $legendRow)->getFont()->setBold(true);
                    $sheet->getStyle($lgNo . $legendRow . ':' . $lgWarna . $legendRow)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setARGB($compColor);
                    $legendRow++;
                    $qIdx = 1;
                    foreach ($questionsByComponent[$comp->id_component] as $q) {
                        $sheet->setCellValue($lgNo . $legendRow, $qIdx);
                        $sheet->setCellValue($lgPert . $legendRow, trim((string)($q->teks_pertanyaan ?? ('Pertanyaan ' . $q->id_question))));
                        $sheet->getStyle($lgNo . $legendRow . ':' . $lgWarna . $legendRow)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setARGB($compColor);
                        $legendRow++;
                        $qIdx++;
                    }
                    $compIdx++;
                }
                $sheet->getStyle($lgNo . '5:' . $lgWarna . ($legendRow - 1))->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                // Lebar kolom pertanyaan dan wrap text agar rapi
                $sheet->getColumnDimension($lgPert)->setWidth(60);
                $sheet->getStyle($lgPert . '6:' . $lgPert . ($legendRow - 1))->getAlignment()->setWrapText(true);
            }

            // Stream sebagai file unduhan
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $filename = 'Rekapan_Adab_Siswa_' . ($monthNames[$baseMonth] ?? $baseMonth) . '_' . $baseYear . '_3_Bulan.xlsx';
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
                'message' => 'Gagal mengekspor kuesioner adab (3 bulan): ' . $e->getMessage()
            ], 500);
        }
    }
}