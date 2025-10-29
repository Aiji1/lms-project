<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class KurikulumController extends Controller
{
    /**
     * Display a listing of kurikulum
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $tahunAjaran = $request->get('tahun_ajaran', '');
            $tingkatKelas = $request->get('tingkat_kelas', '');
            $rombel = $request->get('rombel', '');
            $status = $request->get('status', '');

            $query = DB::table('kurikulum')
                ->leftJoin('tahun_ajaran', 'kurikulum.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'kurikulum.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->select([
                    'kurikulum.id_kurikulum',
                    'kurikulum.id_tahun_ajaran',
                    'kurikulum.id_mata_pelajaran',
                    'kurikulum.tingkat_kelas',
                    'kurikulum.rombel',
                    'kurikulum.status',
                    'kurikulum.sks_jam_perminggu',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'mata_pelajaran.kategori'
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('mata_pelajaran.nama_mata_pelajaran', 'LIKE', "%{$search}%")
                      ->orWhere('mata_pelajaran.kode_mata_pelajaran', 'LIKE', "%{$search}%")
                      ->orWhere('tahun_ajaran.tahun_ajaran', 'LIKE', "%{$search}%");
                });
            }

            // Tahun ajaran filter
            if (!empty($tahunAjaran)) {
                $query->where('kurikulum.id_tahun_ajaran', $tahunAjaran);
            }

            // Tingkat kelas filter
            if (!empty($tingkatKelas)) {
                $query->where('kurikulum.tingkat_kelas', $tingkatKelas);
            }

            // Rombel filter
            if (!empty($rombel)) {
                $query->where('kurikulum.rombel', $rombel);
            }

            // Status filter
            if (!empty($status)) {
                $query->where('kurikulum.status', $status);
            }

            // Order by tahun_ajaran and mata_pelajaran
            $query->orderBy('tahun_ajaran.tahun_ajaran', 'desc')
                  ->orderBy('kurikulum.tingkat_kelas', 'asc')
                  ->orderBy('mata_pelajaran.nama_mata_pelajaran', 'asc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data kurikulum berhasil diambil',
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
                'message' => 'Gagal mengambil data kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created kurikulum
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'tingkat_kelas' => 'required|in:10,11,12',
                'rombel' => 'nullable|in:1,2,3,4',
                'status' => 'required|in:Aktif,Non-aktif',
                'sks_jam_perminggu' => 'nullable|integer|min:1|max:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if combination already exists
            $existingKurikulum = DB::table('kurikulum')
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_mata_pelajaran', $request->id_mata_pelajaran)
                ->where('tingkat_kelas', $request->tingkat_kelas)
                ->where('rombel', $request->rombel)
                ->exists();

            if ($existingKurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum dengan kombinasi tahun ajaran, mata pelajaran, tingkat kelas, dan rombel ini sudah ada'
                ], 422);
            }

            $kurikulumId = DB::table('kurikulum')->insertGetId([
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'tingkat_kelas' => $request->tingkat_kelas,
                'rombel' => $request->rombel,
                'status' => $request->status,
                'sks_jam_perminggu' => $request->sks_jam_perminggu
            ]);

            $kurikulum = DB::table('kurikulum')
                ->leftJoin('tahun_ajaran', 'kurikulum.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'kurikulum.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->select([
                    'kurikulum.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'mata_pelajaran.kategori'
                ])
                ->where('kurikulum.id_kurikulum', $kurikulumId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Kurikulum berhasil ditambahkan',
                'data' => $kurikulum
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified kurikulum
     */
    public function show($id)
    {
        try {
            $kurikulum = DB::table('kurikulum')
                ->leftJoin('tahun_ajaran', 'kurikulum.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'kurikulum.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->select([
                    'kurikulum.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'mata_pelajaran.kategori'
                ])
                ->where('kurikulum.id_kurikulum', $id)
                ->first();

            if (!$kurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data kurikulum berhasil diambil',
                'data' => $kurikulum
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified kurikulum
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if kurikulum exists
            $kurikulum = DB::table('kurikulum')->where('id_kurikulum', $id)->first();
            if (!$kurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'tingkat_kelas' => 'required|in:10,11,12',
                'rombel' => 'nullable|in:1,2,3,4',
                'status' => 'required|in:Aktif,Non-aktif',
                'sks_jam_perminggu' => 'nullable|integer|min:1|max:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if combination already exists (excluding current record)
            $existingKurikulum = DB::table('kurikulum')
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_mata_pelajaran', $request->id_mata_pelajaran)
                ->where('tingkat_kelas', $request->tingkat_kelas)
                ->where('rombel', $request->rombel)
                ->where('id_kurikulum', '!=', $id)
                ->exists();

            if ($existingKurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum dengan kombinasi tahun ajaran, mata pelajaran, tingkat kelas, dan rombel ini sudah ada'
                ], 422);
            }

            DB::table('kurikulum')
                ->where('id_kurikulum', $id)
                ->update([
                    'id_tahun_ajaran' => $request->id_tahun_ajaran,
                    'id_mata_pelajaran' => $request->id_mata_pelajaran,
                    'tingkat_kelas' => $request->tingkat_kelas,
                    'rombel' => $request->rombel,
                    'status' => $request->status,
                    'sks_jam_perminggu' => $request->sks_jam_perminggu
                ]);

            $updatedKurikulum = DB::table('kurikulum')
                ->leftJoin('tahun_ajaran', 'kurikulum.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'kurikulum.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->select([
                    'kurikulum.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'mata_pelajaran.kategori'
                ])
                ->where('kurikulum.id_kurikulum', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Kurikulum berhasil diupdate',
                'data' => $updatedKurikulum
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified kurikulum
     */
    public function destroy($id)
    {
        try {
            $kurikulum = DB::table('kurikulum')->where('id_kurikulum', $id)->first();
            if (!$kurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum tidak ditemukan'
                ], 404);
            }

            DB::table('kurikulum')->where('id_kurikulum', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Kurikulum berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for create/edit
     */
    public function getFormData()
    {
        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->select('id_tahun_ajaran', 'tahun_ajaran', 'semester', 'status')
                ->orderBy('tahun_ajaran', 'desc')
                ->get();

            $mataPelajaran = DB::table('mata_pelajaran')
                ->select('id_mata_pelajaran', 'nama_mata_pelajaran', 'kode_mata_pelajaran', 'kategori', 'status')
                ->where('status', 'Aktif')
                ->orderBy('nama_mata_pelajaran', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'mata_pelajaran' => $mataPelajaran,
                    'tingkat_kelas' => [
                        ['value' => '10', 'label' => 'Kelas 10'],
                        ['value' => '11', 'label' => 'Kelas 11'],
                        ['value' => '12', 'label' => 'Kelas 12']
                    ],
                    'rombel' => [
                        ['value' => '1', 'label' => '1'],
                        ['value' => '2', 'label' => '2'],
                        ['value' => '3', 'label' => '3'],
                        ['value' => '4', 'label' => '4']
                    ],
                    'status' => [
                        ['value' => 'Aktif', 'label' => 'Aktif'],
                        ['value' => 'Non-aktif', 'label' => 'Non-aktif']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching form data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import kurikulum from Excel
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
            $spreadsheet = IOFactory::load($file->getPathname());
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
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                $rowNumber = $index + 2; // +2 because we removed header and array is 0-indexed

                // Map columns
                $data = [
                    'id_tahun_ajaran' => $row[0] ?? null,
                    'id_mata_pelajaran' => $row[1] ?? null,
                    'tingkat_kelas' => $row[2] ?? null,
                    'rombel' => $row[3] ?? null,
                    'status' => $row[4] ?? 'Aktif',
                    'sks_jam_perminggu' => $row[5] ?? null
                ];

                // Validate required fields
                if (empty($data['id_tahun_ajaran']) || empty($data['id_mata_pelajaran']) || empty($data['tingkat_kelas'])) {
                    $errors[] = "Baris {$rowNumber}: ID Tahun Ajaran, ID Mata Pelajaran, dan Tingkat Kelas wajib diisi";
                    $errorCount++;
                    continue;
                }

                // Validate foreign keys
                $tahunAjaranExists = DB::table('tahun_ajaran')->where('id_tahun_ajaran', $data['id_tahun_ajaran'])->exists();
                if (!$tahunAjaranExists) {
                    $errors[] = "Baris {$rowNumber}: ID Tahun Ajaran tidak valid";
                    $errorCount++;
                    continue;
                }

                $mataPelajaranExists = DB::table('mata_pelajaran')->where('id_mata_pelajaran', $data['id_mata_pelajaran'])->exists();
                if (!$mataPelajaranExists) {
                    $errors[] = "Baris {$rowNumber}: ID Mata Pelajaran tidak valid";
                    $errorCount++;
                    continue;
                }

                // Validate enum values
                if (!in_array($data['tingkat_kelas'], ['10', '11', '12'])) {
                    $errors[] = "Baris {$rowNumber}: Tingkat kelas harus 10, 11, atau 12";
                    $errorCount++;
                    continue;
                }

                if (!empty($data['rombel']) && !in_array($data['rombel'], ['1', '2', '3', '4'])) {
                    $errors[] = "Baris {$rowNumber}: Rombel harus 1, 2, 3, atau 4";
                    $errorCount++;
                    continue;
                }

                if (!in_array($data['status'], ['Aktif', 'Non-aktif'])) {
                    $errors[] = "Baris {$rowNumber}: Status harus 'Aktif' atau 'Non-aktif'";
                    $errorCount++;
                    continue;
                }

                // Check if combination already exists - skip instead of error
                $existingKurikulum = DB::table('kurikulum')
                    ->where('id_tahun_ajaran', $data['id_tahun_ajaran'])
                    ->where('id_mata_pelajaran', $data['id_mata_pelajaran'])
                    ->where('tingkat_kelas', $data['tingkat_kelas'])
                    ->where('rombel', $data['rombel'])
                    ->first();

                if ($existingKurikulum) {
                    $skippedData[] = [
                        'row' => $rowNumber,
                        'id_tahun_ajaran' => $data['id_tahun_ajaran'],
                        'id_mata_pelajaran' => $data['id_mata_pelajaran'],
                        'tingkat_kelas' => $data['tingkat_kelas'],
                        'rombel' => $data['rombel'],
                        'reason' => 'Kombinasi kurikulum sudah ada'
                    ];
                    $skippedCount++;
                    continue;
                }

                try {
                    DB::table('kurikulum')->insert([
                        'id_tahun_ajaran' => $data['id_tahun_ajaran'],
                        'id_mata_pelajaran' => $data['id_mata_pelajaran'],
                        'tingkat_kelas' => $data['tingkat_kelas'],
                        'rombel' => $data['rombel'],
                        'status' => $data['status'],
                        'sks_jam_perminggu' => $data['sks_jam_perminggu']
                    ]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Baris {$rowNumber}: Error inserting data - " . $e->getMessage();
                    $errorCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Import selesai. {$imported} data berhasil diimport, {$skippedCount} data dilewati, {$errorCount} error",
                'data' => [
                    'imported' => $imported,
                    'skippedCount' => $skippedCount,
                    'errorCount' => $errorCount,
                    'errors' => $errors,
                    'skippedData' => $skippedData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error importing file: ' . $e->getMessage()
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
                'A1' => 'id_tahun_ajaran',
                'B1' => 'id_mata_pelajaran',
                'C1' => 'tingkat_kelas',
                'D1' => 'rombel',
                'E1' => 'status',
                'F1' => 'sks_jam_perminggu'
            ];

            foreach ($headers as $cell => $value) {
                $sheet->setCellValue($cell, $value);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }

            // Sample data
            $sheet->setCellValue('A2', '1');
            $sheet->setCellValue('B2', '1');
            $sheet->setCellValue('C2', '10');
            $sheet->setCellValue('D2', '1');
            $sheet->setCellValue('E2', 'Aktif');
            $sheet->setCellValue('F2', '4');

            // Instructions
            $sheet->setCellValue('A4', 'Petunjuk:');
            $sheet->setCellValue('A5', '1. id_tahun_ajaran: ID tahun ajaran yang valid');
            $sheet->setCellValue('A6', '2. id_mata_pelajaran: ID mata pelajaran yang valid');
            $sheet->setCellValue('A7', '3. tingkat_kelas: 10, 11, atau 12');
            $sheet->setCellValue('A8', '4. rombel: 1, 2, 3, atau 4 (boleh kosong untuk kelas 10)');
            $sheet->setCellValue('A9', '5. status: Aktif atau Non-aktif');
            $sheet->setCellValue('A10', '6. sks_jam_perminggu: Jumlah jam per minggu (1-10)');

            // Auto-size columns
            foreach (range('A', 'F') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            $filename = 'template_kurikulum_' . date('Y-m-d_H-i-s') . '.xlsx';
            $tempPath = storage_path('app/temp/');
            
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }
            
            $fullPath = $tempPath . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);
            
            // Return file download response
            return response()->download($fullPath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating Excel template: ' . $e->getMessage()
            ], 500);
        }
    }
}