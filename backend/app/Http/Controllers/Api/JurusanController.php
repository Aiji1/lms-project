<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class JurusanController extends Controller
{
    /**
     * Display a listing of jurusan
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $status = $request->get('status', '');

            $query = DB::table('jurusan')
                ->select([
                    'id_jurusan',
                    'nama_jurusan',
                    'status'
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where('nama_jurusan', 'LIKE', "%{$search}%");
            }

            // Status filter
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // Order by ID
            $query->orderBy('id_jurusan', 'asc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data jurusan berhasil diambil',
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
                'message' => 'Gagal mengambil data jurusan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created jurusan
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_jurusan' => 'required|string|max:100|unique:jurusan,nama_jurusan',
            'status' => 'required|in:Aktif,Non-aktif'
        ], [
            'nama_jurusan.required' => 'Nama jurusan wajib diisi',
            'nama_jurusan.unique' => 'Nama jurusan sudah ada',
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
            $jurusanId = DB::table('jurusan')->insertGetId([
                'nama_jurusan' => $request->nama_jurusan,
                'status' => $request->status
            ]);

            $jurusan = DB::table('jurusan')
                ->where('id_jurusan', $jurusanId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Jurusan berhasil ditambahkan',
                'data' => $jurusan
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jurusan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified jurusan
     */
    public function show($id)
    {
        try {
            $jurusan = DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->first();

            if (!$jurusan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jurusan tidak ditemukan'
                ], 404);
            }

            // Get statistics
            $stats = [
                'total_siswa' => DB::table('siswa')
                    ->where('id_jurusan', $id)
                    ->where('status', 'Aktif')
                    ->count(),
                'total_kelas' => DB::table('kelas')
                    ->where('id_jurusan', $id)
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data jurusan berhasil diambil',
                'data' => [
                    'jurusan' => $jurusan,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jurusan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified jurusan
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama_jurusan' => 'required|string|max:100|unique:jurusan,nama_jurusan,' . $id . ',id_jurusan',
            'status' => 'required|in:Aktif,Non-aktif'
        ], [
            'nama_jurusan.required' => 'Nama jurusan wajib diisi',
            'nama_jurusan.unique' => 'Nama jurusan sudah ada',
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
            $jurusan = DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->first();

            if (!$jurusan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jurusan tidak ditemukan'
                ], 404);
            }

            DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->update([
                    'nama_jurusan' => $request->nama_jurusan,
                    'status' => $request->status
                ]);

            $updatedJurusan = DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Jurusan berhasil diperbarui',
                'data' => $updatedJurusan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jurusan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified jurusan
     */
    public function destroy($id)
    {
        try {
            $jurusan = DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->first();

            if (!$jurusan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jurusan tidak ditemukan'
                ], 404);
            }

            // Check if jurusan is being used
            $isUsedBySiswa = DB::table('siswa')
                ->where('id_jurusan', $id)
                ->exists();

            $isUsedByKelas = DB::table('kelas')
                ->where('id_jurusan', $id)
                ->exists();

            if ($isUsedBySiswa || $isUsedByKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jurusan tidak dapat dihapus karena sedang digunakan'
                ], 422);
            }

            DB::table('jurusan')
                ->where('id_jurusan', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jurusan berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jurusan: ' . $e->getMessage()
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
                'A1' => 'nama_jurusan',
                'B1' => 'status'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            // Sample data
            $sheet->setCellValue('A2', 'Tahfizh');
            $sheet->setCellValue('B2', 'Aktif');
            $sheet->setCellValue('A3', 'Digital');
            $sheet->setCellValue('B3', 'Aktif');
            $sheet->setCellValue('A4', 'Teknik Informatika');
            $sheet->setCellValue('B4', 'Aktif');

            // Instructions
            $sheet->setCellValue('A6', 'Petunjuk:');
            $sheet->setCellValue('A7', '1. nama_jurusan: Nama jurusan bebas (maksimal 100 karakter)');
            $sheet->setCellValue('A8', '2. status: Aktif atau Non-aktif');
            $sheet->setCellValue('A9', '3. Nama jurusan tidak boleh duplikat');

            // Auto-size columns
            foreach (range('A', 'B') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $filename = 'template_jurusan_' . date('Y-m-d_H-i-s') . '.xlsx';
            
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
     * Import jurusan from Excel
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
                $rowNumber = $index + 2;
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Validate row data
                $namaJurusan = trim($row[0] ?? '');
                $status = trim($row[1] ?? '');

                if (empty($namaJurusan) || empty($status)) {
                    $errors[] = "Baris {$rowNumber}: Data tidak lengkap";
                    $errorCount++;
                    continue;
                }

                // Clean and validate nama_jurusan
                if (strlen($namaJurusan) > 100) {
                    $errors[] = "Baris {$rowNumber}: Nama jurusan terlalu panjang (maksimal 100 karakter)";
                    $errorCount++;
                    continue;
                }

                // Validate status
                if (!in_array($status, ['Aktif', 'Non-aktif'])) {
                    $errors[] = "Baris {$rowNumber}: Status harus 'Aktif' atau 'Non-aktif'";
                    $errorCount++;
                    continue;
                }

                // Check if jurusan already exists - skip instead of error
                $exists = DB::table('jurusan')
                    ->where('nama_jurusan', $namaJurusan)
                    ->exists();

                if ($exists) {
                    $skippedData[] = [
                        'row' => $rowNumber,
                        'nama_jurusan' => $namaJurusan,
                        'status' => $status,
                        'reason' => 'Jurusan sudah ada'
                    ];
                    $skippedCount++;
                    continue;
                }

                try {
                    DB::table('jurusan')->insert([
                        'nama_jurusan' => $namaJurusan,
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
                    'jurusan_options' => [
                        ['value' => 'Tahfizh', 'label' => 'Tahfizh'],
                        ['value' => 'Digital', 'label' => 'Digital'],
                        ['value' => 'Billingual', 'label' => 'Billingual'],
                        ['value' => 'Reguler', 'label' => 'Reguler'],
                        ['value' => 'IPA', 'label' => 'IPA'],
                        ['value' => 'IPS', 'label' => 'IPS']
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