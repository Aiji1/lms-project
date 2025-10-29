<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class MataPelajaranController extends Controller
{
    /**
     * Display a listing of mata pelajaran
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $kategori = $request->get('kategori', '');
            $status = $request->get('status', '');

            $query = DB::table('mata_pelajaran')
                ->select([
                    'id_mata_pelajaran',
                    'nama_mata_pelajaran',
                    'kode_mata_pelajaran',
                    'kategori',
                    'status'
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('nama_mata_pelajaran', 'LIKE', "%{$search}%")
                      ->orWhere('kode_mata_pelajaran', 'LIKE', "%{$search}%");
                });
            }

            // Kategori filter
            if (!empty($kategori)) {
                $query->where('kategori', $kategori);
            }

            // Status filter
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // Order by nama_mata_pelajaran
            $query->orderBy('nama_mata_pelajaran', 'asc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data mata pelajaran berhasil diambil',
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
                'message' => 'Gagal mengambil data mata pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created mata pelajaran
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:100|unique:mata_pelajaran,nama_mata_pelajaran',
                'kode_mata_pelajaran' => 'required|string|max:10|unique:mata_pelajaran,kode_mata_pelajaran',
                'kategori' => 'required|in:Wajib,Umum,Peminatan,TL,Agama,Mulok',
                'status' => 'required|in:Aktif,Non-aktif'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mataPelajaranId = DB::table('mata_pelajaran')->insertGetId([
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'status' => $request->status
            ]);

            $mataPelajaran = DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $mataPelajaranId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Data mata pelajaran berhasil ditambahkan',
                'data' => $mataPelajaran
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan data mata pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified mata pelajaran
     */
    public function show($id)
    {
        try {
            $mataPelajaran = DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->first();

            if (!$mataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data mata pelajaran tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data mata pelajaran berhasil diambil',
                'data' => $mataPelajaran
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data mata pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified mata pelajaran
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if mata pelajaran exists
            $mataPelajaran = DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->first();

            if (!$mataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data mata pelajaran tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:100|unique:mata_pelajaran,nama_mata_pelajaran,' . $id . ',id_mata_pelajaran',
                'kode_mata_pelajaran' => 'required|string|max:10|unique:mata_pelajaran,kode_mata_pelajaran,' . $id . ',id_mata_pelajaran',
                'kategori' => 'required|in:Wajib,Umum,Peminatan,TL,Agama,Mulok',
                'status' => 'required|in:Aktif,Non-aktif'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->update([
                    'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                    'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                    'kategori' => $request->kategori,
                    'status' => $request->status
                ]);

            $updatedMataPelajaran = DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Data mata pelajaran berhasil diperbarui',
                'data' => $updatedMataPelajaran
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui data mata pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified mata pelajaran
     */
    public function destroy($id)
    {
        try {
            // Check if mata pelajaran exists
            $mataPelajaran = DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->first();

            if (!$mataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data mata pelajaran tidak ditemukan'
                ], 404);
            }

            // Check if mata pelajaran is being used in other tables
            $isUsedInKurikulum = DB::table('kurikulum')
                ->where('id_mata_pelajaran', $id)
                ->exists();

            $isUsedInGuruMataPelajaran = DB::table('guru_mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->exists();

            if ($isUsedInKurikulum || $isUsedInGuruMataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data mata pelajaran tidak dapat dihapus karena masih digunakan dalam kurikulum atau guru mata pelajaran'
                ], 422);
            }

            DB::table('mata_pelajaran')
                ->where('id_mata_pelajaran', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Data mata pelajaran berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data mata pelajaran: ' . $e->getMessage()
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
                'A1' => 'nama_mata_pelajaran',
                'B1' => 'kode_mata_pelajaran',
                'C1' => 'kategori',
                'D1' => 'status'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            // Sample data
            $sheet->setCellValue('A2', 'Matematika');
            $sheet->setCellValue('B2', 'MTK');
            $sheet->setCellValue('C2', 'Wajib');
            $sheet->setCellValue('D2', 'Aktif');

            $sheet->setCellValue('A3', 'Bahasa Indonesia');
            $sheet->setCellValue('B3', 'BIND');
            $sheet->setCellValue('C3', 'Wajib');
            $sheet->setCellValue('D3', 'Aktif');

            $sheet->setCellValue('A4', 'Fisika');
            $sheet->setCellValue('B4', 'FIS');
            $sheet->setCellValue('C4', 'Peminatan');
            $sheet->setCellValue('D4', 'Aktif');

            // Instructions
            $sheet->setCellValue('A6', 'Petunjuk:');
            $sheet->setCellValue('A7', '1. nama_mata_pelajaran: Nama mata pelajaran (maksimal 100 karakter)');
            $sheet->setCellValue('A8', '2. kode_mata_pelajaran: Kode mata pelajaran (maksimal 10 karakter)');
            $sheet->setCellValue('A9', '3. kategori: Wajib, Umum, Peminatan, TL, Agama, atau Mulok');
            $sheet->setCellValue('A10', '4. status: Aktif atau Non-aktif');
            $sheet->setCellValue('A11', '5. Nama dan kode mata pelajaran tidak boleh duplikat');

            // Auto-size columns
            foreach (range('A', 'D') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $filename = 'template_mata_pelajaran_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            $writer = new Xlsx($spreadsheet);
            
            // Create temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'template_mata_pelajaran');
            $writer->save($tempFile);
            
            // Read file content
            $fileContent = file_get_contents($tempFile);
            
            // Clean up temp file
            unlink($tempFile);
            
            // Return response with proper headers
            return response($fileContent)
                ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->header('Content-Disposition', 'attachment;filename="' . $filename . '"')
                ->header('Cache-Control', 'max-age=0');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunduh template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import mata pelajaran from Excel
     */
    public function import(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls|max:2048'
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

            $successCount = 0;
            $skippedCount = 0;
            $errorCount = 0;
            $errors = [];
            $skippedData = [];

            DB::beginTransaction();

            foreach ($rows as $index => $row) {
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $data = [
                    'nama_mata_pelajaran' => $row[0] ?? '',
                    'kode_mata_pelajaran' => $row[1] ?? '',
                    'kategori' => $row[2] ?? '',
                    'status' => $row[3] ?? 'Aktif'
                ];

                $validator = Validator::make($data, [
                    'nama_mata_pelajaran' => 'required|string|max:100',
                    'kode_mata_pelajaran' => 'required|string|max:10',
                    'kategori' => 'required|in:Wajib,Umum,Peminatan,TL,Agama,Mulok',
                    'status' => 'required|in:Aktif,Non-aktif'
                ]);

                if ($validator->fails()) {
                    $errors[] = "Baris " . ($index + 2) . ": " . implode(', ', $validator->errors()->all());
                    $errorCount++;
                    continue;
                }

                // Check for duplicates - Skip if exists instead of showing error
                $existingNama = DB::table('mata_pelajaran')
                    ->where('nama_mata_pelajaran', $data['nama_mata_pelajaran'])
                    ->exists();

                $existingKode = DB::table('mata_pelajaran')
                    ->where('kode_mata_pelajaran', $data['kode_mata_pelajaran'])
                    ->exists();

                if ($existingNama || $existingKode) {
                    $skippedData[] = [
                        'baris' => $index + 2,
                        'nama_mata_pelajaran' => $data['nama_mata_pelajaran'],
                        'kode_mata_pelajaran' => $data['kode_mata_pelajaran'],
                        'alasan' => $existingNama ? 'Nama sudah ada' : 'Kode sudah ada'
                    ];
                    $skippedCount++;
                    continue;
                }

                // Insert data
                DB::table('mata_pelajaran')->insert($data);
                $successCount++;
            }

            DB::commit();

            $message = "Import selesai. {$successCount} data berhasil diimpor";
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
                    'success_count' => $successCount,
                    'skipped_count' => $skippedCount,
                    'error_count' => $errorCount,
                    'errors' => $errors,
                    'skipped_data' => $skippedData
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengimpor data: ' . $e->getMessage()
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
                    'kategori_options' => [
                        ['value' => 'Wajib', 'label' => 'Wajib'],
                        ['value' => 'Umum', 'label' => 'Umum'],
                        ['value' => 'Peminatan', 'label' => 'Peminatan'],
                        ['value' => 'TL', 'label' => 'TL'],
                        ['value' => 'Agama', 'label' => 'Agama'],
                        ['value' => 'Mulok', 'label' => 'Mulok']
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

    /**
     * Get filter options
     */
    public function getFilterOptions()
    {
        try {
            $kategori = ['Wajib', 'Umum', 'Peminatan', 'TL', 'Agama', 'Mulok'];
            $status = ['Aktif', 'Non-aktif'];

            return response()->json([
                'success' => true,
                'data' => [
                    'kategori' => $kategori,
                    'status' => $status
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data filter: ' . $e->getMessage()
            ], 500);
        }
    }
}