<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;

class GuruController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('guru')
                ->leftJoin('kelas', 'guru.nik_guru', '=', 'kelas.wali_kelas')
                ->select(
                    'guru.*',
                    'kelas.nama_kelas as wali_kelas_nama',
                    DB::raw('(SELECT COUNT(*) FROM guru_mata_pelajaran WHERE nik_guru = guru.nik_guru) as jumlah_mapel'),
                    DB::raw('(SELECT GROUP_CONCAT(mata_pelajaran.nama_mata_pelajaran SEPARATOR ", ") 
                             FROM guru_mata_pelajaran 
                             JOIN mata_pelajaran ON guru_mata_pelajaran.id_mata_pelajaran = mata_pelajaran.id_mata_pelajaran 
                             WHERE guru_mata_pelajaran.nik_guru = guru.nik_guru) as mata_pelajaran_nama')
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('guru.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('guru.nik_guru', 'LIKE', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('guru.status', $request->status);
            }

            // Filter by status kepegawaian
            if ($request->has('status_kepegawaian') && $request->status_kepegawaian) {
                $query->where('guru.status_kepegawaian', $request->status_kepegawaian);
            }

            // Filter by jabatan
            if ($request->has('jabatan') && $request->jabatan) {
                $query->where('guru.jabatan', $request->jabatan);
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $guru = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $guru
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nik_guru' => 'required|string|max:20|unique:guru,nik_guru',
            'nama_lengkap' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'nullable|string',
            'no_telepon' => 'nullable|string|max:15',
            'status_kepegawaian' => 'required|in:Pengganti,Honorer,Capeg,PTY,PTYK',
            'jabatan' => 'required|in:Guru,Guru_dan_Wali_Kelas',
            'status' => 'in:Aktif,Non-aktif',
            'mata_pelajaran' => 'nullable|array',
            'mata_pelajaran.*' => 'integer|exists:mata_pelajaran,id_mata_pelajaran'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Create guru record
            $guruData = $request->only([
                'nik_guru', 'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin',
                'alamat', 'no_telepon', 'status_kepegawaian', 'jabatan', 'status'
            ]);
            $guruData['status'] = $guruData['status'] ?? 'Aktif';

            DB::table('guru')->insert($guruData);

            // Insert mata pelajaran relations
            if ($request->has('mata_pelajaran') && is_array($request->mata_pelajaran)) {
                foreach ($request->mata_pelajaran as $idMapel) {
                    DB::table('guru_mata_pelajaran')->insert([
                        'nik_guru' => $request->nik_guru,
                        'id_mata_pelajaran' => $idMapel
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data guru berhasil ditambahkan'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($nik_guru)
    {
        try {
            $guru = DB::table('guru')
                ->leftJoin('kelas', 'guru.nik_guru', '=', 'kelas.wali_kelas')
                ->select(
                    'guru.*',
                    'kelas.nama_kelas as wali_kelas_nama'
                )
                ->where('guru.nik_guru', $nik_guru)
                ->first();

            if (!$guru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak ditemukan'
                ], 404);
            }

            // Get mata pelajaran
            $mataPelajaran = DB::table('guru_mata_pelajaran')
                ->join('mata_pelajaran', 'guru_mata_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->where('guru_mata_pelajaran.nik_guru', $nik_guru)
                ->select('mata_pelajaran.*')
                ->get();

            $guru->mata_pelajaran = $mataPelajaran;

            return response()->json([
                'success' => true,
                'data' => $guru
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $nik_guru)
    {
        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'nullable|string',
            'no_telepon' => 'nullable|string|max:15',
            'status_kepegawaian' => 'required|in:Pengganti,Honorer,Capeg,PTY,PTYK',
            'jabatan' => 'required|in:Guru,Guru_dan_Wali_Kelas',
            'status' => 'in:Aktif,Non-aktif',
            'mata_pelajaran' => 'nullable|array',
            'mata_pelajaran.*' => 'integer|exists:mata_pelajaran,id_mata_pelajaran'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Check if guru exists
            $guru = DB::table('guru')->where('nik_guru', $nik_guru)->first();
            if (!$guru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak ditemukan'
                ], 404);
            }

            // Update guru data
            $guruData = $request->only([
                'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin',
                'alamat', 'no_telepon', 'status_kepegawaian', 'jabatan', 'status'
            ]);

            DB::table('guru')->where('nik_guru', $nik_guru)->update($guruData);

            // Update mata pelajaran relations
            // Delete existing relations
            DB::table('guru_mata_pelajaran')->where('nik_guru', $nik_guru)->delete();

            // Insert new relations
            if ($request->has('mata_pelajaran') && is_array($request->mata_pelajaran)) {
                foreach ($request->mata_pelajaran as $idMapel) {
                    DB::table('guru_mata_pelajaran')->insert([
                        'nik_guru' => $nik_guru,
                        'id_mata_pelajaran' => $idMapel
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data guru berhasil diupdate'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($nik_guru)
    {
        try {
            DB::beginTransaction();

            $guru = DB::table('guru')->where('nik_guru', $nik_guru)->first();
            if (!$guru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak ditemukan'
                ], 404);
            }

            // Check if guru is referenced in other tables
            $references = [
                'kelas' => DB::table('kelas')->where('wali_kelas', $nik_guru)->count(),
                'jadwal_pelajaran' => DB::table('jadwal_pelajaran')->where('nik_guru', $nik_guru)->count(),
                'jurnal_mengajar' => DB::table('jurnal_mengajar')->where('nik_guru', $nik_guru)->count(),
                'nilai' => DB::table('nilai')->where('nik_guru_penginput', $nik_guru)->count(),
                'tugas' => DB::table('tugas')->where('nik_guru', $nik_guru)->count(),
            ];

            $totalReferences = array_sum($references);
            if ($totalReferences > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak dapat dihapus karena masih digunakan di sistem',
                    'references' => $references
                ], 400);
            }

            // Delete guru mata pelajaran relations
            DB::table('guru_mata_pelajaran')->where('nik_guru', $nik_guru)->delete();

            // Delete guru record
            DB::table('guru')->where('nik_guru', $nik_guru)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data guru berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error deleting data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dropdown data for forms
     */
    public function getFormData()
    {
        try {
            $mataPelajaran = DB::table('mata_pelajaran')
                ->where('status', 'Aktif')
                ->orderBy('kategori')
                ->orderBy('nama_mata_pelajaran')
                ->get();

            // Group by category for better UX
            $mataPelajaranGrouped = $mataPelajaran->groupBy('kategori');

            return response()->json([
                'success' => true,
                'data' => [
                    'mata_pelajaran' => $mataPelajaran,
                    'mata_pelajaran_grouped' => $mataPelajaranGrouped,
                    'status_kepegawaian_options' => [
                        'Pengganti', 'Honorer', 'Capeg', 'PTY', 'PTYK'
                    ],
                    'jabatan_options' => [
                        'Guru', 'Guru_dan_Wali_Kelas'
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
     * Import guru from Excel file
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

            $successCount = 0;
            $skippedCount = 0;
            $errorCount = 0;
            $userSuccessCount = 0;
            $userSkippedCount = 0;
            $userErrorCount = 0;
            $errors = [];
            $skippedData = [];

            DB::beginTransaction();

            foreach ($data as $index => $row) {
                try {
                    // Validate required fields
                    if (empty($row['nik_guru']) || empty($row['nama_lengkap'])) {
                        $errors[] = "Baris " . ($index + 2) . ": NIK Guru dan Nama Lengkap wajib diisi";
                        $errorCount++;
                        continue;
                    }

                    // Check if NIK already exists - Skip if exists instead of showing error
                    $existingGuru = DB::table('guru')->where('nik_guru', $row['nik_guru'])->first();
                    if ($existingGuru) {
                        $skippedData[] = [
                            'baris' => $index + 2,
                            'nik_guru' => $row['nik_guru'],
                            'nama_lengkap' => $row['nama_lengkap'],
                            'alasan' => 'NIK sudah ada'
                        ];
                        $skippedCount++;
                        continue;
                    }

                    // Insert guru data
                    DB::table('guru')->insert([
                        'nik_guru' => $row['nik_guru'],
                        'nama_lengkap' => $row['nama_lengkap'],
                        'tanggal_lahir' => $this->parseDate($row['tanggal_lahir'] ?? null),
                        'jenis_kelamin' => $this->parseJenisKelamin($row['jenis_kelamin'] ?? null),
                        'alamat' => $row['alamat'] ?? null,
                        'no_telepon' => $row['no_telepon'] ?? null,
                        'status_kepegawaian' => $this->parseStatusKepegawaian($row['status_kepegawaian'] ?? null),
                        'jabatan' => $this->parseJabatan($row['jabatan'] ?? null),
                        'status' => $row['status'] ?? 'Aktif'
                    ]);

                    // Handle mata pelajaran if provided
                    if (!empty($row['mata_pelajaran'])) {
                        $mataPelajaranNames = explode(',', $row['mata_pelajaran']);
                        foreach ($mataPelajaranNames as $mapelName) {
                            $mapelName = trim($mapelName);
                            $mapel = DB::table('mata_pelajaran')
                                ->where('nama_mata_pelajaran', 'LIKE', "%{$mapelName}%")
                                ->orWhere('kode_mata_pelajaran', 'LIKE', "%{$mapelName}%")
                                ->first();
                            
                            if ($mapel) {
                                DB::table('guru_mata_pelajaran')->insert([
                                    'nik_guru' => $row['nik_guru'],
                                    'id_mata_pelajaran' => $mapel->id_mata_pelajaran
                                ]);
                            }
                        }
                    }

                    // Create user account if username and password provided
                    if (!empty($row['username']) && !empty($row['password'])) {
                        $userStatus = !empty($row['user_status']) ? trim($row['user_status']) : 'Aktif';
                        if (!in_array($userStatus, ['Aktif', 'Non-aktif'])) {
                            $userStatus = 'Aktif';
                        }

                        // Check duplicate username
                        $existingUsername = DB::table('users')->where('username', $row['username'])->first();
                        if ($existingUsername) {
                            $userSkippedCount++;
                        } else {
                            // Check existing user for this guru
                            $existingUser = DB::table('users')
                                ->where('user_type', 'Guru')
                                ->where('reference_id', $row['nik_guru'])
                                ->first();
                            if ($existingUser) {
                                $userSkippedCount++;
                            } else {
                                try {
                                    DB::table('users')->insert([
                                        'user_id' => $this->generateUserId('Guru'),
                                        'username' => $row['username'],
                                        'password' => Hash::make($row['password']),
                                        'user_type' => 'Guru',
                                        'reference_id' => $row['nik_guru'],
                                        'status' => $userStatus,
                                        'created_at' => now(),
                                        'updated_at' => now()
                                    ]);
                                    $userSuccessCount++;
                                } catch (\Exception $e) {
                                    $errors[] = "Baris " . ($index + 2) . ": Gagal membuat akun user - " . $e->getMessage();
                                    $userErrorCount++;
                                }
                            }
                        }
                    }

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
                $message .= ", {$errorCount} data gagal";
            }
            if ($userSuccessCount > 0 || $userSkippedCount > 0 || $userErrorCount > 0) {
                $message .= ". Akun user – berhasil: {$userSuccessCount}, dilewati: {$userSkippedCount}, gagal: {$userErrorCount}";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'success_count' => $successCount,
                    'skipped_count' => $skippedCount,
                    'error_count' => $errorCount,
                    'user_success_count' => $userSuccessCount,
                    'user_skipped_count' => $userSkippedCount,
                    'user_error_count' => $userErrorCount,
                    'errors' => $errors,
                    'skipped_data' => $skippedData
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error importing data: ' . $e->getMessage()
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
            
            // Set document properties
            $spreadsheet->getProperties()
                ->setCreator('SMA Islam Al-Azhar 7 Sukoharjo')
                ->setTitle('Template Import Data Guru')
                ->setDescription('Template untuk import data guru dalam format Excel');

            // Headers
            $headers = [
                'NIK Guru',
                'Nama Lengkap',
                'Tanggal Lahir',
                'Jenis Kelamin',
                'Alamat',
                'No Telepon',
                'Status Kepegawaian',
                'Jabatan',
                'Status',
                'Mata Pelajaran',
                'Username',
                'Password',
                'Status User'
            ];

            // Set headers
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $col++;
            }

            // Style headers
            $sheet->getStyle('A1:M1')->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
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
            $widths = [20, 25, 15, 15, 35, 15, 18, 20, 12, 40, 20, 15, 12];
            $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
            
            for ($i = 0; $i < count($columns); $i++) {
                $sheet->getColumnDimension($columns[$i])->setWidth($widths[$i]);
            }

            // Add sample data
            $sampleData = [
                '1234567890123456',
                'Dr. Ahmad Fauzi, M.Pd',
                '1980-05-15',
                'L',
                'Jl. Contoh No. 123, Sukoharjo',
                '081234567890',
                'PTY',
                'Guru',
                'Aktif',
                'Matematika, Fisika',
                'ahmad.fauzi',
                'secret123',
                'Aktif'
            ];

            for ($i = 0; $i < count($sampleData); $i++) {
                $sheet->setCellValue($columns[$i] . '2', $sampleData[$i]);
            }

            // Style sample data
            $sheet->getStyle('A2:M2')->applyFromArray([
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

            // Add data validation for dropdowns
            $this->addDataValidation($sheet, 'D3:D1000', 'L,P', 'Jenis Kelamin');
            $this->addDataValidation($sheet, 'G3:G1000', 'Pengganti,Honorer,Capeg,PTY,PTYK', 'Status Kepegawaian');
            $this->addDataValidation($sheet, 'H3:H1000', 'Guru,Guru_dan_Wali_Kelas', 'Jabatan');
            $this->addDataValidation($sheet, 'I3:I1000', 'Aktif,Non-aktif', 'Status');
            $this->addDataValidation($sheet, 'M3:M1000', 'Aktif,Non-aktif', 'Status User');

            // Create temp file
            $filename = 'template_data_guru_' . date('Y-m-d') . '.xlsx';
            $tempPath = storage_path('app/temp/');
            
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }
            
            $fullPath = $tempPath . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);
            
            if (!file_exists($fullPath) || filesize($fullPath) == 0) {
                throw new \Exception('Failed to create Excel file');
            }
            
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

    /**
     * Add data validation to Excel cells
     */
    private function addDataValidation($sheet, $range, $options, $title)
    {
        $validation = $sheet->getCell(explode(':', $range)[0])->getDataValidation();
        $validation->setType(DataValidation::TYPE_LIST);
        $validation->setErrorStyle(DataValidation::STYLE_INFORMATION);
        $validation->setAllowBlank(false);
        $validation->setShowInputMessage(true);
        $validation->setShowErrorMessage(true);
        $validation->setShowDropDown(true);
        $validation->setErrorTitle('Input error');
        $validation->setError('Pilih salah satu opsi yang tersedia');
        $validation->setPromptTitle($title);
        $validation->setPrompt('Pilih ' . strtolower($title));
        $validation->setFormula1('"' . $options . '"');
    }

    /**
     * Read CSV file
     */
    private function readCSV($file)
    {
        $data = [];
        $handle = fopen($file->getRealPath(), 'r');
        
        if ($handle !== false) {
            $headers = fgetcsv($handle);
            if ($headers) {
                // Map headers to normalized keys
                $headerMap = [
                    'NIK Guru' => 'nik_guru',
                    'Nama Lengkap' => 'nama_lengkap',
                    'Tanggal Lahir' => 'tanggal_lahir',
                    'Jenis Kelamin' => 'jenis_kelamin',
                    'Alamat' => 'alamat',
                    'No Telepon' => 'no_telepon',
                    'Status Kepegawaian' => 'status_kepegawaian',
                    'Jabatan' => 'jabatan',
                    'Status' => 'status',
                    'Mata Pelajaran' => 'mata_pelajaran',
                    'Username' => 'username',
                    'Password' => 'password',
                    'Status User' => 'user_status'
                ];
                $mappedHeaders = [];
                foreach ($headers as $h) {
                    $cleanHeader = trim($h);
                    $mappedHeaders[] = $headerMap[$cleanHeader] ?? strtolower(str_replace(' ', '_', $cleanHeader));
                }
                while (($row = fgetcsv($handle)) !== false) {
                    if (empty(array_filter($row))) {
                        continue;
                    }
                    $record = [];
                    foreach ($row as $index => $value) {
                        if (isset($mappedHeaders[$index])) {
                            $record[$mappedHeaders[$index]] = is_string($value) ? trim($value) : $value;
                        }
                    }
                    $data[] = $record;
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
        try {
            $reader = IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            
            $data = [];
            $headerRow = $worksheet->rangeToArray('A1:M1', null, true, false, false)[0];
            
            $headerMap = [
                'NIK Guru' => 'nik_guru',
                'Nama Lengkap' => 'nama_lengkap',
                'Tanggal Lahir' => 'tanggal_lahir',
                'Jenis Kelamin' => 'jenis_kelamin',
                'Alamat' => 'alamat',
                'No Telepon' => 'no_telepon',
                'Status Kepegawaian' => 'status_kepegawaian',
                'Jabatan' => 'jabatan',
                'Status' => 'status',
                'Mata Pelajaran' => 'mata_pelajaran',
                'Username' => 'username',
                'Password' => 'password',
                'Status User' => 'user_status'
            ];
            
            $headers = [];
            foreach ($headerRow as $index => $header) {
                $cleanHeader = trim($header);
                $headers[$index] = $headerMap[$cleanHeader] ?? strtolower(str_replace(' ', '_', $cleanHeader));
            }
            
            $highestRow = $worksheet->getHighestRow();
            
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = $worksheet->rangeToArray("A{$row}:M{$row}", null, true, false, false)[0];
                
                if (empty(array_filter($rowData))) {
                    continue;
                }
                
                $record = [];
                foreach ($rowData as $index => $value) {
                    if (isset($headers[$index])) {
                        $record[$headers[$index]] = $value;
                    }
                }
                
                $data[] = $record;
            }
            
            return $data;
            
        } catch (\Exception $e) {
            throw new \Exception('Error reading Excel file: ' . $e->getMessage());
        }
    }

    /**
     * Generate user ID based on type and timestamp
     */
    private function generateUserId($userType)
    {
        $prefixMap = [
            'Siswa' => 'SIS',
            'Guru' => 'GUR',
            'Admin' => 'ADM',
            'Kepala_Sekolah' => 'KPS',
            'Petugas_Keuangan' => 'PTK',
            'Orang_Tua' => 'ORT'
        ];
        $prefix = $prefixMap[$userType] ?? 'USR';
        return $prefix . '-' . date('YmdHis') . '-' . substr(uniqid('', true), -5);
    }

    /**
     * Parse date from various formats
     */
    private function parseDate($date)
    {
        if (empty($date)) return null;
        
        try {
            $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d'];
            
            foreach ($formats as $format) {
                $parsed = \DateTime::createFromFormat($format, $date);
                if ($parsed !== false) {
                    return $parsed->format('Y-m-d');
                }
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Parse jenis kelamin to L or P
     */
    private function parseJenisKelamin($jenisKelamin)
    {
        if (empty($jenisKelamin)) return 'L';
        
        $jenisKelamin = strtolower(trim($jenisKelamin));
        
        if (in_array($jenisKelamin, ['p', 'perempuan', 'female', 'wanita'])) {
            return 'P';
        }
        
        return 'L';
    }

    /**
     * Parse status kepegawaian
     */
    private function parseStatusKepegawaian($status)
    {
        if (empty($status)) return 'Honorer';
        
        $status = trim($status);
        $validStatus = ['Pengganti', 'Honorer', 'Capeg', 'PTY', 'PTYK'];
        
        foreach ($validStatus as $valid) {
            if (strcasecmp($status, $valid) === 0) {
                return $valid;
            }
        }
        
        return 'Honorer';
    }

    /**
     * Parse jabatan
     */
    private function parseJabatan($jabatan)
    {
        if (empty($jabatan)) return 'Guru';
        
        $jabatan = trim($jabatan);
        
        if (stripos($jabatan, 'wali') !== false) {
            return 'Guru_dan_Wali_Kelas';
        }
        
        return 'Guru';
    }
}