<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class TahunAjaranController extends Controller
{
    /**
     * Display a listing of tahun ajaran
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $status = $request->get('status', '');

            $query = DB::table('tahun_ajaran')
                ->select([
                    'id_tahun_ajaran',
                    'tahun_ajaran',
                    'semester',
                    'tanggal_mulai',
                    'tanggal_selesai',
                    'status'
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('tahun_ajaran', 'LIKE', "%{$search}%")
                      ->orWhere('semester', 'LIKE', "%{$search}%");
                });
            }

            // Status filter
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // Order by newest first
            $query->orderBy('id_tahun_ajaran', 'desc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data tahun ajaran berhasil diambil',
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
                'message' => 'Gagal mengambil data tahun ajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created tahun ajaran
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tahun_ajaran' => 'required|string|max:10',
            'semester' => 'required|in:Ganjil,Genap',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:Aktif,Non-aktif'
        ], [
            'tahun_ajaran.required' => 'Tahun ajaran wajib diisi',
            'semester.required' => 'Semester wajib dipilih',
            'semester.in' => 'Semester harus Ganjil atau Genap',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi',
            'tanggal_selesai.required' => 'Tanggal selesai wajib diisi',
            'tanggal_selesai.after' => 'Tanggal selesai harus setelah tanggal mulai',
            'status.required' => 'Status wajib dipilih'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if combination of tahun_ajaran + semester already exists
            $existingCombination = DB::table('tahun_ajaran')
                ->where('tahun_ajaran', $request->tahun_ajaran)
                ->where('semester', $request->semester)
                ->exists();

            if ($existingCombination) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kombinasi tahun ajaran ' . $request->tahun_ajaran . ' semester ' . $request->semester . ' sudah ada'
                ], 422);
            }

            // Check if there's already an active tahun ajaran with same semester
            if ($request->status === 'Aktif') {
                $existingActive = DB::table('tahun_ajaran')
                    ->where('status', 'Aktif')
                    ->where('semester', $request->semester)
                    ->exists();

                if ($existingActive) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sudah ada tahun ajaran aktif untuk semester ' . $request->semester
                    ], 422);
                }
            }

            $tahunAjaranId = DB::table('tahun_ajaran')->insertGetId([
                'tahun_ajaran' => $request->tahun_ajaran,
                'semester' => $request->semester,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status' => $request->status
            ]);

            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $tahunAjaranId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Tahun ajaran berhasil ditambahkan',
                'data' => $tahunAjaran
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan tahun ajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified tahun ajaran
     */
    public function show($id)
    {
        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->first();

            if (!$tahunAjaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tahun ajaran tidak ditemukan'
                ], 404);
            }

            // Get statistics
            $stats = [
                'total_kelas' => DB::table('kelas')
                    ->where('id_tahun_ajaran', $id)
                    ->count(),
                'total_siswa' => DB::table('siswa')
                    ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                    ->where('kelas.id_tahun_ajaran', $id)
                    ->count(),
                'total_kurikulum' => DB::table('kurikulum')
                    ->where('id_tahun_ajaran', $id)
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data tahun ajaran berhasil diambil',
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tahun ajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified tahun ajaran
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tahun_ajaran' => 'required|string|max:10',
            'semester' => 'required|in:Ganjil,Genap',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after:tanggal_mulai',
            'status' => 'required|in:Aktif,Non-aktif'
        ], [
            'tahun_ajaran.required' => 'Tahun ajaran wajib diisi',
            'semester.required' => 'Semester wajib dipilih',
            'tanggal_selesai.after' => 'Tanggal selesai harus setelah tanggal mulai'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->first();

            if (!$tahunAjaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tahun ajaran tidak ditemukan'
                ], 404);
            }

            // Check if combination of tahun_ajaran + semester already exists (excluding current record)
            $existingCombination = DB::table('tahun_ajaran')
                ->where('tahun_ajaran', $request->tahun_ajaran)
                ->where('semester', $request->semester)
                ->where('id_tahun_ajaran', '!=', $id)
                ->exists();

            if ($existingCombination) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kombinasi tahun ajaran ' . $request->tahun_ajaran . ' semester ' . $request->semester . ' sudah ada'
                ], 422);
            }

            // Check active status constraint
            if ($request->status === 'Aktif') {
                $existingActive = DB::table('tahun_ajaran')
                    ->where('status', 'Aktif')
                    ->where('semester', $request->semester)
                    ->where('id_tahun_ajaran', '!=', $id)
                    ->exists();

                if ($existingActive) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Sudah ada tahun ajaran aktif untuk semester ' . $request->semester
                    ], 422);
                }
            }

            DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->update([
                    'tahun_ajaran' => $request->tahun_ajaran,
                    'semester' => $request->semester,
                    'tanggal_mulai' => $request->tanggal_mulai,
                    'tanggal_selesai' => $request->tanggal_selesai,
                    'status' => $request->status
                ]);

            $updatedTahunAjaran = DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Tahun ajaran berhasil diperbarui',
                'data' => $updatedTahunAjaran
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui tahun ajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified tahun ajaran
     */
    public function destroy($id)
    {
        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->first();

            if (!$tahunAjaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tahun ajaran tidak ditemukan'
                ], 404);
            }

            // Check if tahun ajaran is being used
            $isUsed = DB::table('kelas')
                ->where('id_tahun_ajaran', $id)
                ->exists();

            if ($isUsed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tahun ajaran tidak dapat dihapus karena sedang digunakan'
                ], 422);
            }

            DB::table('tahun_ajaran')
                ->where('id_tahun_ajaran', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tahun ajaran berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus tahun ajaran: ' . $e->getMessage()
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
                'A1' => 'tahun_ajaran',
                'B1' => 'semester', 
                'C1' => 'tanggal_mulai',
                'D1' => 'tanggal_selesai',
                'E1' => 'status'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            // Sample data
            $sheet->setCellValue('A2', '2025/2026');
            $sheet->setCellValue('B2', 'Ganjil');
            $sheet->setCellValue('C2', '2025-07-15');
            $sheet->setCellValue('D2', '2025-12-20');
            $sheet->setCellValue('E2', 'Aktif');

            // Instructions
            $sheet->setCellValue('A4', 'Petunjuk:');
            $sheet->setCellValue('A5', '1. Format tahun_ajaran: YYYY/YYYY (contoh: 2025/2026)');
            $sheet->setCellValue('A6', '2. Semester: Ganjil atau Genap');
            $sheet->setCellValue('A7', '3. Format tanggal: YYYY-MM-DD');
            $sheet->setCellValue('A8', '4. Status: Aktif atau Non-aktif');

            // Auto-size columns
            foreach (range('A', 'E') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $filename = 'template_tahun_ajaran_' . date('Y-m-d_H-i-s') . '.xlsx';
            
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
     * Import tahun ajaran from Excel
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:xlsx,xls,csv|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak valid',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->path());
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

                // Validate row data
                $tahunAjaran = trim($row[0] ?? '');
                $semester = trim($row[1] ?? '');
                $tanggalMulai = trim($row[2] ?? '');
                $tanggalSelesai = trim($row[3] ?? '');
                $status = trim($row[4] ?? '');

                if (empty($tahunAjaran) || empty($semester) || empty($tanggalMulai) || empty($tanggalSelesai) || empty($status)) {
                    $errors[] = "Baris {$rowNumber}: Data tidak lengkap";
                    $errorCount++;
                    continue;
                }

                // Validate semester
                if (!in_array($semester, ['Ganjil', 'Genap'])) {
                    $errors[] = "Baris {$rowNumber}: Semester harus 'Ganjil' atau 'Genap'";
                    $errorCount++;
                    continue;
                }

                // Validate status
                if (!in_array($status, ['Aktif', 'Non-aktif'])) {
                    $errors[] = "Baris {$rowNumber}: Status harus 'Aktif' atau 'Non-aktif'";
                    $errorCount++;
                    continue;
                }

                // Check if tahun ajaran + semester combination already exists - skip instead of error
                $exists = DB::table('tahun_ajaran')
                    ->where('tahun_ajaran', $tahunAjaran)
                    ->where('semester', $semester)
                    ->exists();

                if ($exists) {
                    $skippedData[] = [
                        'row' => $rowNumber,
                        'tahun_ajaran' => $tahunAjaran,
                        'semester' => $semester,
                        'reason' => 'Kombinasi tahun ajaran dan semester sudah ada'
                    ];
                    $skippedCount++;
                    continue;
                }

                try {
                    DB::table('tahun_ajaran')->insert([
                        'tahun_ajaran' => $tahunAjaran,
                        'semester' => $semester,
                        'tanggal_mulai' => $tanggalMulai,
                        'tanggal_selesai' => $tanggalSelesai,
                        'status' => $status
                    ]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Baris {$rowNumber}: " . $e->getMessage();
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
                'message' => 'Gagal import data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data (dropdown options)
     */
    public function getFormData()
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'semester_options' => [
                        ['value' => 'Ganjil', 'label' => 'Ganjil'],
                        ['value' => 'Genap', 'label' => 'Genap']
                    ],
                    'status_options' => [
                        ['value' => 'Aktif', 'label' => 'Aktif'],
                        ['value' => 'Non-aktif', 'label' => 'Non-aktif']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form: ' . $e->getMessage()
            ], 500);
        }
    }
}