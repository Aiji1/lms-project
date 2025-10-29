<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\IOFactory;

class NilaiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('nilai')
                ->leftJoin('siswa', 'nilai.nis', '=', 'siswa.nis')
                ->leftJoin('mata_pelajaran', 'nilai.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('tahun_ajaran', 'nilai.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'nilai.nik_guru_penginput', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select(
                    'nilai.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'tahun_ajaran.tahun_ajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('nilai.nis', 'LIKE', "%{$search}%")
                      ->orWhere('mata_pelajaran.nama_mata_pelajaran', 'LIKE', "%{$search}%");
                });
            }

            // Filter by mata pelajaran
            if ($request->has('mata_pelajaran') && $request->mata_pelajaran) {
                $query->where('nilai.id_mata_pelajaran', $request->mata_pelajaran);
            }

            // Filter by kelas
            if ($request->has('kelas') && $request->kelas) {
                $query->where('siswa.id_kelas', $request->kelas);
            }

            // Filter by jenis penilaian
            if ($request->has('jenis') && $request->jenis) {
                $query->where('nilai.jenis_penilaian', $request->jenis);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('nilai.status', $request->status);
            }

            // Filter by tahun ajaran
            if ($request->has('tahun_ajaran') && $request->tahun_ajaran) {
                $query->where('nilai.id_tahun_ajaran', $request->tahun_ajaran);
            }

            $perPage = $request->get('per_page', 10);
            $nilai = $query->orderBy('nilai.tanggal_input', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data nilai berhasil diambil',
                'data' => $nilai
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data nilai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'jenis_penilaian' => 'required|in:Harian,UTS,UAS,Tugas,Praktik',
            'nilai' => 'required|numeric|min:0|max:100',
            'status' => 'required|in:Draft,Final',
            'keterangan' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Get authenticated user (guru or admin)
            $user = $request->attributes->get('authenticated_user');
            
            // Debug logging
            Log::info('NilaiController store - User data:', [
                'user' => $user,
                'user_type' => $user ? $user->user_type : 'null',
                'reference_id' => $user ? $user->reference_id : 'null'
            ]);
            
            // Allow both Guru and Admin to input grades
            if (!$user || !in_array($user->user_type, ['Guru', 'Admin'])) {
                Log::warning('NilaiController store - Authorization failed:', [
                    'user_exists' => !is_null($user),
                    'user_type' => $user ? $user->user_type : 'null',
                    'allowed_types' => ['Guru', 'Admin']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only teachers and admins can input grades.'
                ], 403);
            }

            // Debug request data
            Log::info('NilaiController store - Request data:', [
                'nis' => $request->nis,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'jenis_penilaian' => $request->jenis_penilaian,
                'nilai' => $request->nilai,
                'status' => $request->status,
                'keterangan' => $request->keterangan
            ]);

            $nilaiData = [
                'nis' => $request->nis,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'jenis_penilaian' => $request->jenis_penilaian,
                'nilai' => $request->nilai,
                'status' => $request->status,
                'tanggal_input' => now(),
                'nik_guru_penginput' => $user->reference_id,
                'keterangan' => $request->keterangan
            ];

            Log::info('NilaiController store - Data to insert:', $nilaiData);

            $nilaiId = DB::table('nilai')->insertGetId($nilaiData);

            return response()->json([
                'success' => true,
                'message' => 'Nilai berhasil ditambahkan',
                'data' => array_merge($nilaiData, ['id_nilai' => $nilaiId])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan nilai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $nilai = DB::table('nilai')
                ->leftJoin('siswa', 'nilai.nis', '=', 'siswa.nis')
                ->leftJoin('mata_pelajaran', 'nilai.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('tahun_ajaran', 'nilai.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('guru', 'nilai.nik_guru_penginput', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select(
                    'nilai.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'tahun_ajaran.tahun_ajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas'
                )
                ->where('nilai.id_nilai', $id)
                ->first();

            if (!$nilai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nilai tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data nilai berhasil diambil',
                'data' => $nilai
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data nilai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'jenis_penilaian' => 'required|in:Harian,UTS,UAS,Tugas,Praktik',
            'nilai' => 'required|numeric|min:0|max:100',
            'status' => 'required|in:Draft,Final',
            'keterangan' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if nilai exists
            $nilai = DB::table('nilai')->where('id_nilai', $id)->first();
            if (!$nilai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nilai tidak ditemukan'
                ], 404);
            }

            // Get authenticated user (guru)
            $user = $request->attributes->get('authenticated_user');
            if (!$user || $user->user_type !== 'Guru') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only teachers can update grades.'
                ], 403);
            }

            $updateData = [
                'nis' => $request->nis,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'jenis_penilaian' => $request->jenis_penilaian,
                'nilai' => $request->nilai,
                'status' => $request->status,
                'keterangan' => $request->keterangan
            ];

            DB::table('nilai')->where('id_nilai', $id)->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Nilai berhasil diperbarui',
                'data' => array_merge($updateData, ['id_nilai' => $id])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui nilai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        try {
            // Check if nilai exists
            $nilai = DB::table('nilai')->where('id_nilai', $id)->first();
            if (!$nilai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nilai tidak ditemukan'
                ], 404);
            }

            // Get authenticated user (guru)
            $user = $request->attributes->get('authenticated_user');
            if (!$user || $user->user_type !== 'Guru') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only teachers can delete grades.'
                ], 403);
            }

            DB::table('nilai')->where('id_nilai', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Nilai berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus nilai: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for creating/editing nilai
     */
    public function formData(Request $request)
    {
        try {
            // Get current user for filtering mata pelajaran
            $user = $request->attributes->get('authenticated_user');
            
            $data = [
                'siswa_options' => DB::table('siswa')
                    ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                    ->where('siswa.status', 'Aktif')
                    ->select('siswa.nis as value', 
                            DB::raw("CONCAT(siswa.nama_lengkap, ' - ', COALESCE(kelas.nama_kelas, 'Tidak ada kelas')) as label"))
                    ->get()
                    ->toArray(),
                'mata_pelajaran_options' => $this->getMataPelajaranOptions($user),
                'tahun_ajaran_options' => DB::table('tahun_ajaran')
                    ->where('status', 'Aktif')
                    ->select('id_tahun_ajaran as value', 
                            DB::raw("CONCAT(tahun_ajaran, ' - ', semester, ' (', status, ')') as label"))
                    ->orderBy('id_tahun_ajaran', 'desc')
                    ->get()
                    ->toArray(),
                'jenis_penilaian_options' => [
                    ['value' => 'Harian', 'label' => 'Harian'],
                    ['value' => 'UTS', 'label' => 'UTS'],
                    ['value' => 'UAS', 'label' => 'UAS'],
                    ['value' => 'Tugas', 'label' => 'Tugas'],
                    ['value' => 'Praktik', 'label' => 'Praktik']
                ],
                'status_options' => [
                    ['value' => 'Draft', 'label' => 'Draft'],
                    ['value' => 'Final', 'label' => 'Final']
                ]
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
     * Get mata pelajaran options based on user role
     */
    private function getMataPelajaranOptions($user)
    {
        if ($user && $user->user_type === 'Guru') {
            // For teachers, only show subjects they are assigned to
            return DB::table('mata_pelajaran')
                ->join('guru_mata_pelajaran', 'mata_pelajaran.id_mata_pelajaran', '=', 'guru_mata_pelajaran.id_mata_pelajaran')
                ->where('guru_mata_pelajaran.nik_guru', $user->reference_id)
                ->where('mata_pelajaran.status', 'Aktif')
                ->select('mata_pelajaran.id_mata_pelajaran as value', 'mata_pelajaran.nama_mata_pelajaran as label')
                ->get()
                ->toArray();
        } else {
            // For admin and other roles, show all active subjects
            return DB::table('mata_pelajaran')
                ->where('status', 'Aktif')
                ->select('id_mata_pelajaran as value', 'nama_mata_pelajaran as label')
                ->get()
                ->toArray();
        }
    }

    /**
     * Download template Excel for import
     */
    public function template()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $headers = [
                'NIS', 'ID Mata Pelajaran', 'ID Tahun Ajaran', 'Jenis Penilaian', 
                'Nilai', 'Status', 'Keterangan'
            ];

            // Set header row
            for ($i = 0; $i < count($headers); $i++) {
                $sheet->setCellValue(chr(65 + $i) . '1', $headers[$i]);
            }

            // Style header
            $sheet->getStyle('A1:G1')->applyFromArray([
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF']
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '2563EB']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000']
                    ]
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER
                ]
            ]);

            // Set column widths
            $widths = [15, 20, 20, 15, 10, 10, 30];
            $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
            
            for ($i = 0; $i < count($columns); $i++) {
                $sheet->getColumnDimension($columns[$i])->setWidth($widths[$i]);
            }

            // Add sample data
            $sampleData = [
                '0594',
                '1',
                '1',
                'Harian',
                '85',
                'Final',
                'Nilai ulangan harian'
            ];

            for ($i = 0; $i < count($sampleData); $i++) {
                $sheet->setCellValue($columns[$i] . '2', $sampleData[$i]);
            }

            // Style sample data
            $sheet->getStyle('A2:G2')->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'CCCCCC']
                    ]
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'F8F9FA']
                ]
            ]);

            $writer = new Xlsx($spreadsheet);
            $filename = 'template_nilai_siswa.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $filename);
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import nilai from Excel file
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120' // Max 5MB
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
            $extension = $file->getClientOriginalExtension();
            
            // Read file content
            if ($extension === 'csv') {
                $data = $this->readCSV($file);
            } else {
                $data = $this->readExcel($file);
            }

            if (empty($data)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File kosong atau format tidak valid'
                ], 400);
            }

            // Get authenticated user (guru)
            $user = $request->attributes->get('authenticated_user');
            if (!$user || $user->user_type !== 'Guru') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only teachers can import grades.'
                ], 403);
            }

            $successCount = 0;
            $errorCount = 0;
            $skippedCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($data as $index => $row) {
                try {
                    // Validate required fields
                    if (empty($row['nis']) || empty($row['id_mata_pelajaran']) || 
                        empty($row['id_tahun_ajaran']) || empty($row['jenis_penilaian']) || 
                        empty($row['nilai']) || empty($row['status'])) {
                        $errors[] = "Baris " . ($index + 2) . ": Data tidak lengkap";
                        $errorCount++;
                        continue;
                    }

                    // Check if siswa exists
                    $siswa = DB::table('siswa')->where('nis', $row['nis'])->first();
                    if (!$siswa) {
                        $errors[] = "Baris " . ($index + 2) . ": Siswa dengan NIS {$row['nis']} tidak ditemukan";
                        $errorCount++;
                        continue;
                    }

                    // Check if mata pelajaran exists
                    $mataPelajaran = DB::table('mata_pelajaran')->where('id_mata_pelajaran', $row['id_mata_pelajaran'])->first();
                    if (!$mataPelajaran) {
                        $errors[] = "Baris " . ($index + 2) . ": Mata pelajaran dengan ID {$row['id_mata_pelajaran']} tidak ditemukan";
                        $errorCount++;
                        continue;
                    }

                    // Check if tahun ajaran exists
                    $tahunAjaran = DB::table('tahun_ajaran')->where('id_tahun_ajaran', $row['id_tahun_ajaran'])->first();
                    if (!$tahunAjaran) {
                        $errors[] = "Baris " . ($index + 2) . ": Tahun ajaran dengan ID {$row['id_tahun_ajaran']} tidak ditemukan";
                        $errorCount++;
                        continue;
                    }

                    // Validate jenis penilaian
                    $validJenis = ['Harian', 'UTS', 'UAS', 'Tugas', 'Praktik'];
                    if (!in_array($row['jenis_penilaian'], $validJenis)) {
                        $errors[] = "Baris " . ($index + 2) . ": Jenis penilaian tidak valid";
                        $errorCount++;
                        continue;
                    }

                    // Validate nilai
                    if (!is_numeric($row['nilai']) || $row['nilai'] < 0 || $row['nilai'] > 100) {
                        $errors[] = "Baris " . ($index + 2) . ": Nilai harus berupa angka antara 0-100";
                        $errorCount++;
                        continue;
                    }

                    // Validate status
                    $validStatus = ['Draft', 'Final'];
                    if (!in_array($row['status'], $validStatus)) {
                        $errors[] = "Baris " . ($index + 2) . ": Status tidak valid";
                        $errorCount++;
                        continue;
                    }

                    // Check if nilai already exists
                    $existingNilai = DB::table('nilai')
                        ->where('nis', $row['nis'])
                        ->where('id_mata_pelajaran', $row['id_mata_pelajaran'])
                        ->where('id_tahun_ajaran', $row['id_tahun_ajaran'])
                        ->where('jenis_penilaian', $row['jenis_penilaian'])
                        ->first();

                    if ($existingNilai) {
                        $skippedCount++;
                        continue;
                    }

                    // Insert nilai
                    DB::table('nilai')->insert([
                        'nis' => $row['nis'],
                        'id_mata_pelajaran' => $row['id_mata_pelajaran'],
                        'id_tahun_ajaran' => $row['id_tahun_ajaran'],
                        'jenis_penilaian' => $row['jenis_penilaian'],
                        'nilai' => $row['nilai'],
                        'status' => $row['status'],
                        'tanggal_input' => now(),
                        'nik_guru_penginput' => $user->reference_id,
                        'keterangan' => $row['keterangan'] ?? null
                    ]);

                    $successCount++;

                } catch (\Exception $e) {
                    $errors[] = "Baris " . ($index + 2) . ": " . $e->getMessage();
                    $errorCount++;
                }
            }

            DB::commit();

            $message = "Import selesai. {$successCount} data berhasil diimpor";
            if ($skippedCount > 0) {
                $message .= ", {$skippedCount} data dilewati (sudah ada)";
            }
            if ($errorCount > 0) {
                $message .= ", {$errorCount} data gagal diimpor";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'success_count' => $successCount,
                    'error_count' => $errorCount,
                    'skipped_count' => $skippedCount,
                    'errors' => $errors
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
     * Read CSV file
     */
    private function readCSV($file)
    {
        $data = [];
        $handle = fopen($file->getPathname(), 'r');
        
        if ($handle !== false) {
            $headers = fgetcsv($handle); // Skip header row
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 6) { // Minimum required columns
                    $data[] = [
                        'nis' => $row[0],
                        'id_mata_pelajaran' => $row[1],
                        'id_tahun_ajaran' => $row[2],
                        'jenis_penilaian' => $row[3],
                        'nilai' => $row[4],
                        'status' => $row[5],
                        'keterangan' => $row[6] ?? null
                    ];
                }
            }
            fclose($handle);
        }
        
        return $data;
    }

    /**
     * Read Excel file
     */
    private function readExcel($file)
    {
        $data = [];
        $spreadsheet = IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Skip header row
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (!empty($row[0])) { // Check if NIS is not empty
                $data[] = [
                    'nis' => $row[0],
                    'id_mata_pelajaran' => $row[1],
                    'id_tahun_ajaran' => $row[2],
                    'jenis_penilaian' => $row[3],
                    'nilai' => $row[4],
                    'status' => $row[5],
                    'keterangan' => $row[6] ?? null
                ];
            }
        }
        
        return $data;
    }

    /**
     * Get filter options for nilai siswa page
     */
    public function filterOptions()
    {
        try {
            $data = [
                'mata_pelajaran' => DB::table('mata_pelajaran')
                    ->where('status', 'Aktif')
                    ->select('id_mata_pelajaran as id', 'nama_mata_pelajaran as nama')
                    ->get()
                    ->toArray(),
                'kelas' => DB::table('kelas')
                    ->select('id_kelas as id', 'nama_kelas as nama')
                    ->get()
                    ->toArray(),
                'tahun_ajaran' => DB::table('tahun_ajaran')
                    ->where('status', 'Aktif')
                    ->select('id_tahun_ajaran as id', 
                            DB::raw("CONCAT(tahun_ajaran, ' - ', semester) as nama"))
                    ->get()
                    ->toArray()
            ];

            return response()->json([
                'success' => true,
                'message' => 'Data filter berhasil diambil',
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data filter: ' . $e->getMessage()
            ], 500);
        }
    }
}