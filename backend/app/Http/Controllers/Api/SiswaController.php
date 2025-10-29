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
use Illuminate\Support\Str;

class SiswaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('orang_tua', 'siswa.id_orang_tua', '=', 'orang_tua.id_orang_tua')
                ->select(
                    'siswa.*',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan',
                    'orang_tua.nama_ayah',
                    'orang_tua.nama_ibu',
                    'orang_tua.no_hp'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('siswa.nis', 'LIKE', "%{$search}%");
                });
            }

            // Filter by kelas
            if ($request->has('kelas') && $request->kelas) {
                $query->where('siswa.id_kelas', $request->kelas);
            }

            // Filter by jurusan
            if ($request->has('jurusan') && $request->jurusan) {
                $query->where('siswa.id_jurusan', $request->jurusan);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('siswa.status', $request->status);
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $siswa = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $siswa
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
            'nis' => 'required|string|max:20|unique:siswa,nis',
            'nama_lengkap' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'nullable|string',
            'id_kelas' => 'nullable|integer|exists:kelas,id_kelas',
            'id_jurusan' => 'nullable|integer|exists:jurusan,id_jurusan',
            'rombel' => 'nullable|in:1,2,3,4',
            'status' => 'in:Aktif,Non-aktif,Lulus',
            'asal_sekolah' => 'nullable|string|max:100',
            'nama_ayah' => 'nullable|string|max:100',
            'nama_ibu' => 'nullable|string|max:100',
            'no_hp_orang_tua' => 'nullable|string|max:15',
            'alamat_orang_tua' => 'nullable|string',
            'golongan_darah' => 'nullable|in:A,B,AB,O'
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

            // Create orang_tua record if data provided
            $orangTuaId = null;
            if ($request->nama_ayah || $request->nama_ibu) {
                $orangTuaId = DB::table('orang_tua')->insertGetId([
                    'nama_ayah' => $request->nama_ayah,
                    'nama_ibu' => $request->nama_ibu,
                    'no_hp' => $request->no_hp_orang_tua,
                    'alamat' => $request->alamat_orang_tua,
                    'status' => 'Aktif'
                ]);
            }

            // Create siswa record
            $siswaData = $request->only([
                'nis', 'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin', 
                'alamat', 'id_kelas', 'id_jurusan', 'rombel', 'status',
                'asal_sekolah', 'golongan_darah'
            ]);
            $siswaData['id_orang_tua'] = $orangTuaId;
            $siswaData['status'] = $siswaData['status'] ?? 'Aktif';

            DB::table('siswa')->insert($siswaData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data siswa berhasil ditambahkan'
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
    public function show($nis)
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->leftJoin('orang_tua', 'siswa.id_orang_tua', '=', 'orang_tua.id_orang_tua')
                ->select(
                    'siswa.*',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan',
                    'orang_tua.*'
                )
                ->where('siswa.nis', $nis)
                ->first();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $siswa
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
    public function update(Request $request, $nis)
    {
        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'alamat' => 'nullable|string',
            'id_kelas' => 'nullable|integer|exists:kelas,id_kelas',
            'id_jurusan' => 'nullable|integer|exists:jurusan,id_jurusan',
            'rombel' => 'nullable|in:1,2,3,4',
            'status' => 'in:Aktif,Non-aktif,Lulus',
            'asal_sekolah' => 'nullable|string|max:100',
            'nama_ayah' => 'nullable|string|max:100',
            'nama_ibu' => 'nullable|string|max:100',
            'no_hp_orang_tua' => 'nullable|string|max:15',
            'alamat_orang_tua' => 'nullable|string',
            'golongan_darah' => 'nullable|in:A,B,AB,O'
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

            // Check if siswa exists
            $siswa = DB::table('siswa')->where('nis', $nis)->first();
            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Update orang_tua data
            if ($siswa->id_orang_tua) {
                DB::table('orang_tua')
                    ->where('id_orang_tua', $siswa->id_orang_tua)
                    ->update([
                        'nama_ayah' => $request->nama_ayah,
                        'nama_ibu' => $request->nama_ibu,
                        'no_hp' => $request->no_hp_orang_tua,
                        'alamat' => $request->alamat_orang_tua
                    ]);
            }

            // Update siswa data
            $siswaData = $request->only([
                'nama_lengkap', 'tanggal_lahir', 'jenis_kelamin', 
                'alamat', 'id_kelas', 'id_jurusan', 'rombel', 'status',
                'asal_sekolah', 'golongan_darah'
            ]);

            DB::table('siswa')->where('nis', $nis)->update($siswaData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data siswa berhasil diupdate'
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
    public function destroy($nis)
    {
        try {
            DB::beginTransaction();

            $siswa = DB::table('siswa')->where('nis', $nis)->first();
            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Delete siswa record
            DB::table('siswa')->where('nis', $nis)->delete();

            // Optionally delete orang_tua record if no other siswa references it
            if ($siswa->id_orang_tua) {
                $otherSiswa = DB::table('siswa')
                    ->where('id_orang_tua', $siswa->id_orang_tua)
                    ->exists();
                    
                if (!$otherSiswa) {
                    DB::table('orang_tua')
                        ->where('id_orang_tua', $siswa->id_orang_tua)
                        ->delete();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data siswa berhasil dihapus'
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
     * Bulk delete multiple siswa records
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis_list' => 'required|array|min:1',
            'nis_list.*' => 'required|string|exists:siswa,nis'
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

            $nisList = $request->nis_list;
            $deletedCount = 0;
            $orphanedOrangTuaIds = [];

            foreach ($nisList as $nis) {
                $siswa = DB::table('siswa')->where('nis', $nis)->first();
                if ($siswa) {
                    // Collect orang_tua IDs that might become orphaned
                    if ($siswa->id_orang_tua) {
                        $orphanedOrangTuaIds[] = $siswa->id_orang_tua;
                    }

                    // Delete siswa record
                    DB::table('siswa')->where('nis', $nis)->delete();
                    $deletedCount++;
                }
            }

            // Clean up orphaned orang_tua records
            foreach (array_unique($orphanedOrangTuaIds) as $orangTuaId) {
                $otherSiswa = DB::table('siswa')
                    ->where('id_orang_tua', $orangTuaId)
                    ->exists();
                    
                if (!$otherSiswa) {
                    DB::table('orang_tua')
                        ->where('id_orang_tua', $orangTuaId)
                        ->delete();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$deletedCount} data siswa berhasil dihapus"
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
            // Get all kelas from all academic years (not just active one)
            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select('kelas.*', 'jurusan.nama_jurusan')
                ->orderBy('kelas.tingkat')
                ->orderBy('kelas.nama_kelas')
                ->get();

            $jurusan = DB::table('jurusan')
                ->where('status', 'Aktif')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'kelas' => $kelas,
                    'jurusan' => $jurusan
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
     * Import siswa from Excel file
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
            $errorCount = 0;
            $skippedCount = 0;
            $errors = [];
            $skippedData = [];
            // Counters untuk pembuatan akun user
            $userSuccessCount = 0;
            $userSkippedCount = 0;
            $userErrorCount = 0;
            $userErrors = [];

            DB::beginTransaction();

            foreach ($data as $index => $row) {
                try {
                    // Validate required fields
                    if (empty($row['nis']) || empty($row['nama_lengkap'])) {
                        $errors[] = "Baris " . ($index + 2) . ": NIS dan Nama Lengkap wajib diisi";
                        $errorCount++;
                        continue;
                    }

                    // Check if NIS already exists - skip instead of error
                    $existingSiswa = DB::table('siswa')->where('nis', $row['nis'])->first();
                    if ($existingSiswa) {
                        $skippedData[] = [
                            'row' => $index + 2,
                            'nis' => $row['nis'],
                            'nama_lengkap' => $row['nama_lengkap'],
                            'reason' => 'NIS sudah ada'
                        ];
                        $skippedCount++;
                        continue;
                    }

                    // Create orang_tua record if data provided
                    $orangTuaId = null;
                    if (!empty($row['nama_ayah']) || !empty($row['nama_ibu'])) {
                        $orangTuaId = DB::table('orang_tua')->insertGetId([
                            'nama_ayah' => $row['nama_ayah'] ?? null,
                            'nama_ibu' => $row['nama_ibu'] ?? null,
                            'no_hp' => $row['no_hp_orang_tua'] ?? null,
                            'alamat' => $row['alamat_orang_tua'] ?? null,
                            'status' => 'Aktif'
                        ]);
                    }

                    // Find kelas and jurusan IDs
                    $kelasId = null;
                    if (!empty($row['nama_kelas'])) {
                        $kelas = DB::table('kelas')->where('nama_kelas', $row['nama_kelas'])->first();
                        $kelasId = $kelas ? $kelas->id_kelas : null;
                    }

                    $jurusanId = null;
                    if (!empty($row['nama_jurusan'])) {
                        $jurusan = DB::table('jurusan')->where('nama_jurusan', $row['nama_jurusan'])->first();
                        $jurusanId = $jurusan ? $jurusan->id_jurusan : null;
                    }

                    // Insert siswa data
                    DB::table('siswa')->insert([
                        'nis' => $row['nis'],
                        'nama_lengkap' => $row['nama_lengkap'],
                        'tanggal_lahir' => $this->parseDate($row['tanggal_lahir'] ?? null),
                        'jenis_kelamin' => $this->parseJenisKelamin($row['jenis_kelamin'] ?? null),
                        'alamat' => $row['alamat'] ?? null,
                        'id_kelas' => $kelasId,
                        'id_jurusan' => $jurusanId,
                        'rombel' => $row['rombel'] ?? null,
                        'status' => $row['status'] ?? 'Aktif',
                        'asal_sekolah' => $row['asal_sekolah'] ?? null,
                        'golongan_darah' => $row['golongan_darah'] ?? null,
                        'id_orang_tua' => $orangTuaId
                    ]);

                    // Buat akun user jika kolom terkait diisi
                    $username = isset($row['username']) ? $row['username'] : ($row['Username'] ?? null);
                    $passwordPlain = isset($row['password']) ? $row['password'] : ($row['Password'] ?? null);
                    $userStatus = isset($row['user_status']) ? $row['user_status'] : ($row['Status User'] ?? 'Aktif');

                    if (!empty($username) && !empty($passwordPlain)) {
                        try {
                            // Validasi status user
                            $userStatus = in_array($userStatus, ['Aktif', 'Non-aktif']) ? $userStatus : 'Aktif';

                            // Cek duplikasi username
                            $existingByUsername = DB::table('users')->where('username', $username)->first();
                            if ($existingByUsername) {
                                $userSkippedCount++;
                            } else {
                                // Cek duplikasi berdasarkan reference_id untuk tipe Siswa
                                $existingByReference = DB::table('users')
                                    ->where('user_type', 'Siswa')
                                    ->where('reference_id', $row['nis'])
                                    ->first();
                                if ($existingByReference) {
                                    $userSkippedCount++;
                                } else {
                                    $userId = $this->generateUserId('Siswa');
                                    DB::table('users')->insert([
                                        'user_id' => $userId,
                                        'username' => $username,
                                        'password' => Hash::make((string)$passwordPlain),
                                        'user_type' => 'Siswa',
                                        'reference_id' => $row['nis'],
                                        'status' => $userStatus,
                                        'created_date' => now(),
                                        'updated_date' => now()
                                    ]);
                                    $userSuccessCount++;
                                }
                            }
                        } catch (\Exception $e) {
                            $userErrors[] = "Baris " . ($index + 2) . ": " . $e->getMessage();
                            $userErrorCount++;
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

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'success_count' => $successCount,
                    'skipped_count' => $skippedCount,
                    'error_count' => $errorCount,
                    'errors' => $errors,
                    'skipped_data' => $skippedData,
                    'user_success_count' => $userSuccessCount,
                    'user_skipped_count' => $userSkippedCount,
                    'user_error_count' => $userErrorCount,
                    'user_errors' => $userErrors
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
                ->setTitle('Template Import Data Siswa')
                ->setDescription('Template untuk import data siswa dalam format Excel');

            // Headers
            $headers = [
                'NIS',
                'Nama Lengkap', 
                'Tanggal Lahir',
                'Jenis Kelamin',
                'Alamat',
                'Nama Kelas',
                'Nama Jurusan',
                'Rombel',
                'Status',
                'Asal Sekolah',
                'Golongan Darah',
                'Nama Ayah',
                'Nama Ibu',
                'No HP Orang Tua',
                'Alamat Orang Tua',
                'Username',
                'Password',
                'Status User'
            ];

            // Set headers di baris pertama
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $col++;
            }

            // Style headers
            $sheet->getStyle('A1:R1')->applyFromArray([
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
            $widths = [12, 25, 15, 15, 30, 12, 15, 8, 12, 20, 12, 20, 20, 15, 30, 20, 15, 12];
            $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
            
            for ($i = 0; $i < count($columns); $i++) {
                $sheet->getColumnDimension($columns[$i])->setWidth($widths[$i]);
            }

            // Add sample data di baris kedua
            $sampleData = [
                '0594',
                'Contoh Nama Siswa',
                '01/05/10',
                'L',
                'Jl. Contoh No. 123, Sukoharjo',
                'XE1',
                'Tahfizh',
                '1',
                'Aktif',
                'SMP Contoh',
                'A',
                'Nama Ayah',
                'Nama Ibu',
                '081234567890',
                'Alamat Orang Tua',
                'username_siswa',
                'password123',
                'Aktif'
            ];

            for ($i = 0; $i < count($sampleData); $i++) {
                $sheet->setCellValue($columns[$i] . '2', $sampleData[$i]);
            }

            // Style sample data
            $sheet->getStyle('A2:R2')->applyFromArray([
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

            // Remove data validation for Jenis Kelamin column (D) to allow manual P or L input
            // Users can now type P or L directly without dropdown restriction

            // Tambah data validation untuk kolom Status User
            $this->addDataValidation($sheet, 'R3:R1000', 'Aktif,Non-aktif', 'Status User');

            // Create temp file
            $filename = 'template_data_siswa_' . date('Y-m-d') . '.xlsx';
            $tempPath = storage_path('app/temp/');
            
            // Create temp directory if not exists
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }
            
            $fullPath = $tempPath . $filename;
            
            // Save to temp file
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);
            
            // Check if file was created and has content
            if (!file_exists($fullPath) || filesize($fullPath) == 0) {
                throw new \Exception('Failed to create Excel file');
            }
            
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
                while (($row = fgetcsv($handle)) !== false) {
                    if (count($row) >= count($headers)) {
                        $data[] = array_combine($headers, $row);
                    }
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
            $headers = [];
            
            // Get headers from first row
            $headerRow = $worksheet->rangeToArray('A1:R1', null, true, false, false)[0];
            
            // Clean and map headers
            $headerMap = [
                'NIS' => 'nis',
                'Nama Lengkap' => 'nama_lengkap',
                'Tanggal Lahir' => 'tanggal_lahir',
                'Jenis Kelamin' => 'jenis_kelamin',
                'Alamat' => 'alamat',
                'Nama Kelas' => 'nama_kelas',
                'Nama Jurusan' => 'nama_jurusan',
                'Rombel' => 'rombel',
                'Status' => 'status',
                'Asal Sekolah' => 'asal_sekolah',
                'Golongan Darah' => 'golongan_darah',
                'Nama Ayah' => 'nama_ayah',
                'Nama Ibu' => 'nama_ibu',
                'No HP Orang Tua' => 'no_hp_orang_tua',
                'Alamat Orang Tua' => 'alamat_orang_tua',
                'Username' => 'username',
                'Password' => 'password',
                'Status User' => 'user_status'
            ];
            
            foreach ($headerRow as $index => $header) {
                $cleanHeader = trim($header);
                $headers[$index] = $headerMap[$cleanHeader] ?? strtolower(str_replace(' ', '_', $cleanHeader));
            }
            
            // Get data rows (skip header row)
            $highestRow = $worksheet->getHighestRow();
            
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = $worksheet->rangeToArray("A{$row}:R{$row}", null, true, false, false)[0];
                
                // Skip empty rows
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
     * Generate User ID berdasarkan tipe user
     */
    private function generateUserId($userType)
    {
        $prefixMap = [
            'Admin' => 'ADM',
            'Kepala_Sekolah' => 'KS',
            'Guru' => 'GR',
            'Petugas_Keuangan' => 'KU',
            'Siswa' => 'SW',
            'Orang_Tua' => 'OT'
        ];
        $prefix = $prefixMap[$userType] ?? 'USR';
        $timestamp = substr((string) time(), -6);
        return $prefix . $timestamp;
    }

    /**
     * Parse date from various formats
     */
    private function parseDate($date)
    {
        if (empty($date)) return null;
        
        try {
            // Support dd/mm/yy format as requested by user
            $formats = ['d/m/y', 'd/m/Y', 'Y-m-d', 'd-m-Y', 'Y/m/d'];
            
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
     * Generate barcode for student
     */
    public function generateBarcode($nis)
    {
        try {
            $siswa = DB::table('siswa')->where('nis', $nis)->first();
            
            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Generate unique barcode based on NIS and timestamp
            $barcode = 'BC' . $nis . '_' . time();
            
            // Update siswa with barcode
            DB::table('siswa')
                ->where('nis', $nis)
                ->update([
                    'barcode' => $barcode,
                    'barcode_generated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Barcode berhasil di-generate',
                'data' => [
                    'nis' => $nis,
                    'barcode' => $barcode,
                    'generated_at' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating barcode: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign RFID to student
     */
    public function assignRfid(Request $request, $nis)
    {
        $validator = Validator::make($request->all(), [
            'rfid_code' => 'required|string|max:50|unique:siswa,rfid_code'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $siswa = DB::table('siswa')->where('nis', $nis)->first();
            
            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Update siswa with RFID code
            DB::table('siswa')
                ->where('nis', $nis)
                ->update([
                    'rfid_code' => $request->rfid_code,
                    'rfid_assigned_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'RFID berhasil di-assign',
                'data' => [
                    'nis' => $nis,
                    'rfid_code' => $request->rfid_code,
                    'assigned_at' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error assigning RFID: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove RFID from student
     */
    public function removeRfid($nis)
    {
        try {
            $siswa = DB::table('siswa')->where('nis', $nis)->first();
            
            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Remove RFID code
            DB::table('siswa')
                ->where('nis', $nis)
                ->update([
                    'rfid_code' => null,
                    'rfid_assigned_at' => null
                ]);

            return response()->json([
                'success' => true,
                'message' => 'RFID berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing RFID: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student by barcode
     */
    public function getByBarcode($barcode)
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'siswa.*',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->where('siswa.barcode', $barcode)
                ->first();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa dengan barcode tersebut tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $siswa
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student by RFID
     */
    public function getByRfid($rfid_code)
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'siswa.*',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->where('siswa.rfid_code', $rfid_code)
                ->first();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa dengan RFID tersebut tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $siswa
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk generate barcodes for all students
     */
    public function bulkGenerateBarcodes()
    {
        try {
            $siswaList = DB::table('siswa')
                ->whereNull('barcode')
                ->where('status', 'Aktif')
                ->get();

            $generated = 0;
            foreach ($siswaList as $siswa) {
                $barcode = 'BC' . $siswa->nis . '_' . time() . '_' . $generated;
                
                DB::table('siswa')
                    ->where('nis', $siswa->nis)
                    ->update([
                        'barcode' => $barcode,
                        'barcode_generated_at' => now()
                    ]);
                
                $generated++;
                usleep(1000); // Small delay to ensure unique timestamps
            }

            return response()->json([
                'success' => true,
                'message' => "Berhasil generate barcode untuk {$generated} siswa",
                'data' => [
                    'generated_count' => $generated
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error bulk generating barcodes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student's own barcode (for student dashboard)
     */
    public function getMyBarcode(Request $request)
    {
        try {
            // Get authenticated user from middleware
            $user = $request->attributes->get('authenticated_user');
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 401);
            }

            // Check if user is a student
            if ($user->user_type !== 'Siswa') {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya siswa yang dapat mengakses barcode mereka.'
                ], 403);
            }

            // Get student data with barcode
            $siswa = DB::table('siswa')
                ->where('nis', $user->reference_id)
                ->select('nis', 'nama_lengkap', 'barcode', 'barcode_generated_at', 'rfid_code', 'rfid_assigned_at')
                ->first();

            if (!$siswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // If student doesn't have barcode, generate one
            if (!$siswa->barcode) {
                $barcode = $siswa->nis . '_' . time();
                
                DB::table('siswa')
                    ->where('nis', $siswa->nis)
                    ->update([
                        'barcode' => $barcode,
                        'barcode_generated_at' => now()
                    ]);

                // Refresh student data
                $siswa = DB::table('siswa')
                    ->where('nis', $user->reference_id)
                    ->select('nis', 'nama_lengkap', 'barcode', 'barcode_generated_at', 'rfid_code', 'rfid_assigned_at')
                    ->first();
            }

            return response()->json([
                'success' => true,
                'message' => 'Barcode siswa berhasil diambil',
                'data' => [
                    'nis' => $siswa->nis,
                    'nama_lengkap' => $siswa->nama_lengkap,
                    'barcode' => $siswa->barcode,
                    'barcode_generated_at' => $siswa->barcode_generated_at,
                    'rfid_code' => $siswa->rfid_code,
                    'rfid_assigned_at' => $siswa->rfid_assigned_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting student barcode: ' . $e->getMessage()
            ], 500);
        }
    }
}