<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class KelasController extends Controller
{
    /**
     * Display a listing of kelas
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $tingkat = $request->get('tingkat', '');
            $jurusan = $request->get('jurusan', '');
            $tahunAjaran = $request->get('tahun_ajaran', '');

            $query = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('tahun_ajaran', 'kelas.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'kelas.wali_kelas', '=', 'guru.nik_guru')
                ->select([
                    'kelas.id_kelas',
                    'kelas.ruangan',
                    'kelas.nama_kelas',
                    'kelas.tingkat',
                    'kelas.kapasitas_maksimal',
                    'kelas.wali_kelas',
                    'jurusan.nama_jurusan',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'guru.nama_lengkap as nama_wali_kelas',
                    DB::raw('(SELECT COUNT(*) FROM siswa WHERE siswa.id_kelas = kelas.id_kelas AND siswa.status = "Aktif") as jumlah_siswa')
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('kelas.nama_kelas', 'LIKE', "%{$search}%")
                      ->orWhere('kelas.ruangan', 'LIKE', "%{$search}%")
                      ->orWhere('jurusan.nama_jurusan', 'LIKE', "%{$search}%")
                      ->orWhere('guru.nama_lengkap', 'LIKE', "%{$search}%");
                });
            }

            // Tingkat filter
            if (!empty($tingkat)) {
                $query->where('kelas.tingkat', $tingkat);
            }

            // Jurusan filter
            if (!empty($jurusan)) {
                $query->where('kelas.id_jurusan', $jurusan);
            }

            // Tahun ajaran filter
            if (!empty($tahunAjaran)) {
                $query->where('kelas.id_tahun_ajaran', $tahunAjaran);
            }

            // Order by tingkat, then nama_kelas
            $query->orderBy('kelas.tingkat', 'asc')
                  ->orderBy('kelas.nama_kelas', 'asc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data kelas berhasil diambil',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'total_pages' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $total,
                    'has_next' => $data->hasMorePages(),
                    'has_prev' => $data->currentPage() > 1
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created kelas
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'ruangan' => 'required|in:1,2,3,4,5,6,7,8,9,10,11,12',
                'nama_kelas' => 'required|string|max:20',
                'tingkat' => 'required|in:10,11,12',
                'id_jurusan' => 'required|integer|exists:jurusan,id_jurusan',
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'kapasitas_maksimal' => 'required|integer|min:1|max:50',
                'wali_kelas' => 'nullable|string|exists:guru,nik_guru'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if combination of ruangan, tingkat, and tahun_ajaran already exists
            $existingKelas = DB::table('kelas')
                ->where('ruangan', $request->ruangan)
                ->where('tingkat', $request->tingkat)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->exists();

            if ($existingKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruangan ' . $request->ruangan . ' untuk tingkat ' . $request->tingkat . ' pada tahun ajaran ini sudah ada'
                ], 422);
            }

            // Check if nama_kelas already exists for the same tahun_ajaran
            $existingNamaKelas = DB::table('kelas')
                ->where('nama_kelas', $request->nama_kelas)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->exists();

            if ($existingNamaKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama kelas ' . $request->nama_kelas . ' pada tahun ajaran ini sudah ada'
                ], 422);
            }

            $kelasId = DB::table('kelas')->insertGetId([
                'ruangan' => $request->ruangan,
                'nama_kelas' => $request->nama_kelas,
                'tingkat' => $request->tingkat,
                'id_jurusan' => $request->id_jurusan,
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'kapasitas_maksimal' => $request->kapasitas_maksimal,
                'wali_kelas' => $request->wali_kelas
            ]);

            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('tahun_ajaran', 'kelas.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'kelas.wali_kelas', '=', 'guru.nik_guru')
                ->select([
                    'kelas.*',
                    'jurusan.nama_jurusan',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'guru.nama_lengkap as nama_wali_kelas'
                ])
                ->where('kelas.id_kelas', $kelasId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Kelas berhasil ditambahkan',
                'data' => $kelas
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified kelas
     */
    public function show($id)
    {
        try {
            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('tahun_ajaran', 'kelas.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'kelas.wali_kelas', '=', 'guru.nik_guru')
                ->select([
                    'kelas.*',
                    'jurusan.nama_jurusan',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'guru.nama_lengkap as nama_wali_kelas'
                ])
                ->where('kelas.id_kelas', $id)
                ->first();

            if (!$kelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan'
                ], 404);
            }

            // Get statistics
            $stats = [
                'total_siswa' => DB::table('siswa')
                    ->where('id_kelas', $id)
                    ->where('status', 'Aktif')
                    ->count(),
                'total_jadwal' => DB::table('jadwal_pelajaran')
                    ->where('id_kelas', $id)
                    ->count(),
                'total_tugas' => DB::table('tugas')
                    ->where('id_kelas', $id)
                    ->where('status', 'Aktif')
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data kelas berhasil diambil',
                'data' => [
                    'kelas' => $kelas,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified kelas
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'ruangan' => 'required|in:1,2,3,4,5,6,7,8,9,10,11,12',
                'nama_kelas' => 'required|string|max:20',
                'tingkat' => 'required|in:10,11,12',
                'id_jurusan' => 'required|integer|exists:jurusan,id_jurusan',
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'kapasitas_maksimal' => 'required|integer|min:1|max:50',
                'wali_kelas' => 'nullable|string|exists:guru,nik_guru'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $existingKelas = DB::table('kelas')->where('id_kelas', $id)->first();
            if (!$existingKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan'
                ], 404);
            }

            // Check if combination of ruangan, tingkat, and tahun_ajaran already exists (excluding current record)
            $existingRuangan = DB::table('kelas')
                ->where('ruangan', $request->ruangan)
                ->where('tingkat', $request->tingkat)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_kelas', '!=', $id)
                ->exists();

            if ($existingRuangan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruangan ' . $request->ruangan . ' untuk tingkat ' . $request->tingkat . ' pada tahun ajaran ini sudah ada'
                ], 422);
            }

            // Check if nama_kelas already exists for the same tahun_ajaran (excluding current record)
            $existingNamaKelas = DB::table('kelas')
                ->where('nama_kelas', $request->nama_kelas)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_kelas', '!=', $id)
                ->exists();

            if ($existingNamaKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama kelas ' . $request->nama_kelas . ' pada tahun ajaran ini sudah ada'
                ], 422);
            }

            DB::table('kelas')
                ->where('id_kelas', $id)
                ->update([
                    'ruangan' => $request->ruangan,
                    'nama_kelas' => $request->nama_kelas,
                    'tingkat' => $request->tingkat,
                    'id_jurusan' => $request->id_jurusan,
                    'id_tahun_ajaran' => $request->id_tahun_ajaran,
                    'kapasitas_maksimal' => $request->kapasitas_maksimal,
                    'wali_kelas' => $request->wali_kelas
                ]);

            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('tahun_ajaran', 'kelas.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'kelas.wali_kelas', '=', 'guru.nik_guru')
                ->select([
                    'kelas.*',
                    'jurusan.nama_jurusan',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'guru.nama_lengkap as nama_wali_kelas'
                ])
                ->where('kelas.id_kelas', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Kelas berhasil diperbarui',
                'data' => $kelas
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified kelas
     */
    public function destroy($id)
    {
        try {
            $kelas = DB::table('kelas')->where('id_kelas', $id)->first();
            if (!$kelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan'
                ], 404);
            }

            // Check if kelas has students
            $hasStudents = DB::table('siswa')
                ->where('id_kelas', $id)
                ->where('status', 'Aktif')
                ->exists();

            if ($hasStudents) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus kelas yang masih memiliki siswa aktif'
                ], 422);
            }

            // Check if kelas has jadwal
            $hasJadwal = DB::table('jadwal_pelajaran')
                ->where('id_kelas', $id)
                ->exists();

            if ($hasJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus kelas yang masih memiliki jadwal pelajaran'
                ], 422);
            }

            DB::table('kelas')->where('id_kelas', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Kelas berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for kelas
     */
    public function getFormData()
    {
        try {
            $data = [
                'ruangan_options' => [
                    ['value' => '1', 'label' => 'Ruangan 1'],
                    ['value' => '2', 'label' => 'Ruangan 2'],
                    ['value' => '3', 'label' => 'Ruangan 3'],
                    ['value' => '4', 'label' => 'Ruangan 4'],
                    ['value' => '5', 'label' => 'Ruangan 5'],
                    ['value' => '6', 'label' => 'Ruangan 6'],
                    ['value' => '7', 'label' => 'Ruangan 7'],
                    ['value' => '8', 'label' => 'Ruangan 8'],
                    ['value' => '9', 'label' => 'Ruangan 9'],
                    ['value' => '10', 'label' => 'Ruangan 10'],
                    ['value' => '11', 'label' => 'Ruangan 11'],
                    ['value' => '12', 'label' => 'Ruangan 12']
                ],
                'tingkat_options' => [
                    ['value' => '10', 'label' => 'Kelas 10'],
                    ['value' => '11', 'label' => 'Kelas 11'],
                    ['value' => '12', 'label' => 'Kelas 12']
                ],
                'jurusan_options' => DB::table('jurusan')
                    ->where('status', 'Aktif')
                    ->select('id_jurusan as value', 'nama_jurusan as label')
                    ->get()
                    ->toArray(),
                'tahun_ajaran_options' => DB::table('tahun_ajaran')
                    ->where('status', 'Aktif')
                    ->select('id_tahun_ajaran as value', 
                            DB::raw("CONCAT(tahun_ajaran, ' - ', semester) as label"))
                    ->get()
                    ->toArray(),
                'guru_options' => DB::table('guru')
                    ->where('status', 'Aktif')
                    ->select('nik_guru as value', 'nama_lengkap as label')
                    ->get()
                    ->toArray()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data form berhasil diambil',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download template Excel
     */
    public function downloadTemplate()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Header
            $headers = [
                'A1' => 'ruangan',
                'B1' => 'nama_kelas',
                'C1' => 'tingkat',
                'D1' => 'id_jurusan',
                'E1' => 'id_tahun_ajaran',
                'F1' => 'kapasitas_maksimal',
                'G1' => 'wali_kelas'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            // Sample data
            $sheet->setCellValue('A2', '1');
            $sheet->setCellValue('B2', 'XE1');
            $sheet->setCellValue('C2', '10');
            $sheet->setCellValue('D2', '1');
            $sheet->setCellValue('E2', '1');
            $sheet->setCellValue('F2', '30');
            $sheet->setCellValue('G2', '');

            // Instructions
            $sheet->setCellValue('A4', 'Petunjuk:');
            $sheet->setCellValue('A5', '1. ruangan: 1-12');
            $sheet->setCellValue('A6', '2. nama_kelas: Contoh XE1, XI.F1, XII.A1');
            $sheet->setCellValue('A7', '3. tingkat: 10, 11, atau 12');
            $sheet->setCellValue('A8', '4. id_jurusan: ID jurusan yang valid');
            $sheet->setCellValue('A9', '5. id_tahun_ajaran: ID tahun ajaran yang valid');
            $sheet->setCellValue('A10', '6. kapasitas_maksimal: 1-50');
            $sheet->setCellValue('A11', '7. wali_kelas: NIK guru (opsional)');

            // Auto-size columns
            foreach (range('A', 'G') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $filename = 'template_kelas_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            $writer = new Xlsx($spreadsheet);
            
            return response()->stream(
                function() use ($writer) {
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
                'message' => 'Gagal membuat template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import kelas from Excel
     */
    public function import(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
            $spreadsheet = $reader->load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Remove header row
            array_shift($rows);

            $imported = 0;
            $skippedCount = 0;
            $errorCount = 0;
            $errors = [];
            $skippedData = [];

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +2 because we removed header and array is 0-indexed

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $validator = Validator::make([
                    'ruangan' => $row[0] ?? '',
                    'nama_kelas' => $row[1] ?? '',
                    'tingkat' => $row[2] ?? '',
                    'id_jurusan' => $row[3] ?? '',
                    'id_tahun_ajaran' => $row[4] ?? '',
                    'kapasitas_maksimal' => $row[5] ?? '',
                    'wali_kelas' => $row[6] ?? null
                ], [
                    'ruangan' => 'required|in:1,2,3,4,5,6,7,8,9,10,11,12',
                    'nama_kelas' => 'required|string|max:20',
                    'tingkat' => 'required|in:10,11,12',
                    'id_jurusan' => 'required|integer|exists:jurusan,id_jurusan',
                    'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                    'kapasitas_maksimal' => 'required|integer|min:1|max:50',
                    'wali_kelas' => 'nullable|string|exists:guru,nik_guru'
                ]);

                if ($validator->fails()) {
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    $errorCount++;
                    continue;
                }

                // Check duplicates - skip instead of error
                $existingKelas = DB::table('kelas')
                    ->where('ruangan', $row[0])
                    ->where('tingkat', $row[2])
                    ->where('id_tahun_ajaran', $row[4])
                    ->exists();

                if ($existingKelas) {
                    $skippedData[] = [
                        'row' => $rowNumber,
                        'ruangan' => $row[0],
                        'nama_kelas' => $row[1],
                        'tingkat' => $row[2],
                        'reason' => 'Ruangan untuk tingkat sudah ada'
                    ];
                    $skippedCount++;
                    continue;
                }

                try {
                    DB::table('kelas')->insert([
                        'ruangan' => $row[0],
                        'nama_kelas' => $row[1],
                        'tingkat' => $row[2],
                        'id_jurusan' => $row[3],
                        'id_tahun_ajaran' => $row[4],
                        'kapasitas_maksimal' => $row[5],
                        'wali_kelas' => !empty($row[6]) ? $row[6] : null
                    ]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Baris {$rowNumber}: Gagal menyimpan data - " . $e->getMessage();
                    $errorCount++;
                }
            }

            $message = "Import selesai. {$imported} data berhasil diimpor";
            if ($skippedCount > 0) {
                $message .= ", {$skippedCount} data dilewati (sudah ada)";
            }
            if ($errorCount > 0) {
                $message .= ", {$errorCount} data gagal";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'success_count' => $imported,
                    'skipped_count' => $skippedCount,
                    'error_count' => $errorCount,
                    'errors' => $errors,
                    'skipped_data' => $skippedData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimport data: ' . $e->getMessage()
            ], 500);
        }
    }
}