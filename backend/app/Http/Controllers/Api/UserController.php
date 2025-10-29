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

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('users')
                ->select(
                    'users.*',
                    DB::raw('CASE 
                        WHEN users.user_type = "Siswa" THEN (SELECT nama_lengkap FROM siswa WHERE nis = users.reference_id)
                        WHEN users.user_type = "Guru" THEN (SELECT nama_lengkap FROM guru WHERE nik_guru = users.reference_id)
                        WHEN users.user_type = "Admin" THEN users.username
                        WHEN users.user_type = "Kepala_Sekolah" THEN COALESCE((SELECT nama FROM kepala_sekolah WHERE id_kepala_sekolah = users.reference_id), users.username)
                        WHEN users.user_type = "Petugas_Keuangan" THEN COALESCE((SELECT nama FROM petugas_keuangan WHERE id_petugas_keuangan = users.reference_id), users.username)
                        WHEN users.user_type = "Orang_Tua" THEN CONCAT((SELECT nama_ayah FROM orang_tua WHERE id_orang_tua = users.reference_id), " / ", (SELECT nama_ibu FROM orang_tua WHERE id_orang_tua = users.reference_id))
                        ELSE "Unknown"
                    END as nama_lengkap')
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('users.username', 'LIKE', "%{$search}%")
                      ->orWhere('users.user_id', 'LIKE', "%{$search}%")
                      ->orWhere('users.user_type', 'LIKE', "%{$search}%");
                });
            }

            // Filter by user type
            if ($request->has('user_type') && $request->user_type) {
                $query->where('users.user_type', $request->user_type);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('users.status', $request->status);
            }

            // Pagination
            $perPage = $request->get('per_page', 10);
            $users = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
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
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Aturan validasi dinamis: Admin/Kepala Sekolah/Petugas Keuangan tidak wajib reference_id
        $rules = [
            'user_id' => 'required|string|max:20|unique:users,user_id',
            'username' => 'required|string|max:50|unique:users,username',
            'password' => 'required|string|min:6|confirmed',
            'user_type' => 'required|in:Siswa,Guru,Admin,Kepala_Sekolah,Petugas_Keuangan,Orang_Tua',
            'status' => 'in:Aktif,Non-aktif'
        ];

        // reference_id required untuk Siswa/Guru/Orang_Tua, opsional untuk Admin/Kepala_Sekolah/Petugas_Keuangan
        $rules['reference_id'] = (in_array($request->user_type, ['Admin','Kepala_Sekolah','Petugas_Keuangan']))
            ? 'nullable|string|max:20'
            : 'required|string|max:20';

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Untuk Admin, reference_id opsional; gunakan fallback ke user_id jika kosong
            // Untuk Kepala_Sekolah/Petugas_Keuangan, reference_id boleh kosong (disimpan null)
            $referenceId = $request->reference_id ?: null;
            if ($request->user_type === 'Admin') {
                $referenceId = $referenceId ?: $request->user_id;
            } else {
                // Validate reference_id hanya jika diisi
                if ($referenceId !== null) {
                    $referenceExists = $this->validateReferenceId($request->user_type, $referenceId);
                    if (!$referenceExists) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Reference ID tidak ditemukan di tabel terkait'
                        ], 422);
                    }
                }
            }

            // Check if reference_id is already used by another user (hanya jika ada reference_id)
            if ($referenceId !== null) {
                $existingUser = DB::table('users')
                    ->where('user_type', $request->user_type)
                    ->where('reference_id', $referenceId)
                    ->where('user_id', '!=', $request->user_id)
                    ->first();

                if ($existingUser) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Reference ID sudah digunakan oleh user lain'
                    ], 422);
                }
            }

            $userData = [
                'user_id' => $request->user_id,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'user_type' => $request->user_type,
                'reference_id' => $referenceId,
                'status' => $request->status ?? 'Aktif',
                'created_date' => now(),
                'updated_date' => now()
            ];

            DB::table('users')->insert($userData);

            return response()->json([
                'success' => true,
                'message' => 'User berhasil ditambahkan'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($user_id)
    {
        try {
            $user = DB::table('users')
                ->select(
                    'users.*',
                    DB::raw('CASE 
                        WHEN users.user_type = "Siswa" THEN (SELECT nama_lengkap FROM siswa WHERE nis = users.reference_id)
                        WHEN users.user_type = "Guru" THEN (SELECT nama_lengkap FROM guru WHERE nik_guru = users.reference_id)
                        WHEN users.user_type = "Admin" THEN users.username
                        WHEN users.user_type = "Kepala_Sekolah" THEN COALESCE((SELECT nama FROM kepala_sekolah WHERE id_kepala_sekolah = users.reference_id), users.username)
                        WHEN users.user_type = "Petugas_Keuangan" THEN COALESCE((SELECT nama FROM petugas_keuangan WHERE id_petugas_keuangan = users.reference_id), users.username)
                        WHEN users.user_type = "Orang_Tua" THEN CONCAT((SELECT nama_ayah FROM orang_tua WHERE id_orang_tua = users.reference_id), " / ", (SELECT nama_ibu FROM orang_tua WHERE id_orang_tua = users.reference_id))
                        ELSE "Unknown"
                    END as nama_lengkap')
                )
                ->where('users.user_id', $user_id)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            // Remove password from response
            unset($user->password);

            return response()->json([
                'success' => true,
                'data' => $user
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
    public function update(Request $request, $user_id)
    {
        // Aturan validasi dinamis untuk update: Admin/Kepala Sekolah/Petugas Keuangan tidak wajib reference_id
        $rules = [
            'username' => 'required|string|max:50|unique:users,username,' . $user_id . ',user_id',
            'password' => 'nullable|string|min:6|confirmed',
            'user_type' => 'required|in:Siswa,Guru,Admin,Kepala_Sekolah,Petugas_Keuangan,Orang_Tua',
            'status' => 'in:Aktif,Non-aktif'
        ];
        $rules['reference_id'] = (in_array($request->user_type, ['Admin','Kepala_Sekolah','Petugas_Keuangan']))
            ? 'nullable|string|max:20'
            : 'required|string|max:20';

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if user exists
            $user = DB::table('users')->where('user_id', $user_id)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            // Untuk Admin, reference_id opsional; fallback ke user_id jika kosong
            // Untuk Kepala_Sekolah/Petugas_Keuangan, reference_id boleh kosong (disimpan null)
            $referenceId = $request->reference_id ?: null;
            if ($request->user_type === 'Admin') {
                $referenceId = $referenceId ?: $user_id;
            } else {
                // Validate reference_id hanya jika diisi
                if ($referenceId !== null) {
                    $referenceExists = $this->validateReferenceId($request->user_type, $referenceId);
                    if (!$referenceExists) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Reference ID tidak ditemukan di tabel terkait'
                        ], 422);
                    }
                }
            }

            // Check if reference_id is already used by another user (hanya jika ada reference_id)
            if ($referenceId !== null) {
                $existingUser = DB::table('users')
                    ->where('user_type', $request->user_type)
                    ->where('reference_id', $referenceId)
                    ->where('user_id', '!=', $user_id)
                    ->first();

                if ($existingUser) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Reference ID sudah digunakan oleh user lain'
                    ], 422);
                }
            }

            $userData = [
                'username' => $request->username,
                'user_type' => $request->user_type,
                'reference_id' => $referenceId,
                'status' => $request->status,
                'updated_date' => now()
            ];

            // Update password only if provided
            if ($request->password) {
                $userData['password'] = Hash::make($request->password);
            }

            DB::table('users')->where('user_id', $user_id)->update($userData);

            return response()->json([
                'success' => true,
                'message' => 'User berhasil diupdate'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($user_id)
    {
        try {
            $user = DB::table('users')->where('user_id', $user_id)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            DB::table('users')->where('user_id', $user_id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for dropdowns
     */
    public function getFormData()
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select('siswa.nis as id', 'siswa.nama_lengkap', 'siswa.status', 'kelas.nama_kelas')
                ->where('status', 'Aktif')
                ->get();

            $guru = DB::table('guru')
                ->select('nik_guru as id', 'nama_lengkap', 'status')
                ->where('status', 'Aktif')
                ->get();

            $admin = DB::table('admin')
                // Admin hanya ada di tabel users; tidak perlu tabel admin terpisah
                // Kembalikan daftar admin dari users bila diperlukan oleh UI (opsional)
                ->select('id_admin as id', 'nama_admin as nama_lengkap', 'status')
                ->whereRaw('1 = 0')
                ->get();

            // Alternatif: ambil dari tabel users (lebih konsisten dengan arsitektur terbaru)
            $admin = DB::table('users')
                ->select('user_id as id', 'username as nama_lengkap', 'status')
                ->where('user_type', 'Admin')
                ->where('status', 'Aktif')
                ->get();

            $kepala_sekolah = DB::table('kepala_sekolah')
                ->select('id_kepala_sekolah as id', 'nama as nama_lengkap', 'status')
                ->where('status', 'Aktif')
                ->get();

            $petugas_keuangan = DB::table('petugas_keuangan')
                ->select('id_petugas_keuangan as id', 'nama as nama_lengkap', 'status')
                ->where('status', 'Aktif')
                ->get();

            $orang_tua = DB::table('orang_tua')
                ->select('id_orang_tua as id', 
                    DB::raw('CONCAT(nama_ayah, " / ", nama_ibu) as nama_lengkap'), 
                    'status')
                ->where('status', 'Aktif')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'siswa' => $siswa,
                    'guru' => $guru,
                    'admin' => $admin,
                    'kepala_sekolah' => $kepala_sekolah,
                    'petugas_keuangan' => $petugas_keuangan,
                    'orang_tua' => $orang_tua,
                    'user_types' => [
                        'Siswa', 'Guru', 'Admin', 'Kepala_Sekolah', 'Petugas_Keuangan', 'Orang_Tua'
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
     * Reset user password
     */
    public function resetPassword(Request $request, $user_id)
    {
        $validator = Validator::make($request->all(), [
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = DB::table('users')->where('user_id', $user_id)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 404);
            }

            DB::table('users')
                ->where('user_id', $user_id)
                ->update([
                    'password' => Hash::make($request->new_password),
                    'updated_date' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error resetting password: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate reference ID exists in related table
     */
    private function validateReferenceId($userType, $referenceId)
    {
        switch ($userType) {
            case 'Siswa':
                return DB::table('siswa')->where('nis', $referenceId)->exists();
            case 'Guru':
                return DB::table('guru')->where('nik_guru', $referenceId)->exists();
            case 'Admin':
                // Admin tidak membutuhkan reference di tabel lain
                return true;
            case 'Kepala_Sekolah':
                return DB::table('kepala_sekolah')->where('id_kepala_sekolah', $referenceId)->exists();
            case 'Petugas_Keuangan':
                return DB::table('petugas_keuangan')->where('id_petugas_keuangan', $referenceId)->exists();
            case 'Orang_Tua':
                return DB::table('orang_tua')->where('id_orang_tua', $referenceId)->exists();
            default:
                return false;
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
            
            $spreadsheet->getProperties()
                ->setCreator('SMA Islam Al-Azhar 7 Sukoharjo')
                ->setTitle('Template Import Data User')
                ->setDescription('Template untuk import data user dalam format Excel');

            $headers = [
                'User ID',
                'Username',
                'Password',
                'User Type',
                'Reference ID',
                'Status',
                // Kolom tambahan opsional untuk memetakan reference secara otomatis
                'NIK Guru',        // untuk User Type = Guru
                'ID Orang Tua',    // untuk User Type = Orang_Tua
                'NIS Anak'         // alternatif jika ID Orang Tua tidak diketahui
            ];

            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $col++;
            }

            $sheet->getStyle('A1:I1')->applyFromArray([
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
                ]
            ]);

            // Atur lebar kolom sesuai jumlah header
            $widths = [15, 20, 15, 20, 15, 12, 15, 15, 15];
            $colLetter = 'A';
            for ($i = 0; $i < count($headers); $i++) {
                $sheet->getColumnDimension($colLetter)->setWidth($widths[$i] ?? 15);
                $colLetter++;
            }

            $sampleData = [
                'USR001',           // User ID
                'username_contoh',  // Username
                'password123',      // Password
                'Guru',             // User Type contoh
                '',                 // Reference ID (opsional untuk Guru, gunakan NIK Guru)
                'Aktif',            // Status
                '3201012345678901', // NIK Guru contoh
                '',                 // ID Orang Tua (kosong untuk Guru)
                ''                  // NIS Anak (kosong untuk Guru)
            ];

            // Tulis baris contoh pada baris ke-2 sesuai urutan header
            $colLetter = 'A';
            for ($i = 0; $i < count($sampleData); $i++) {
                $sheet->setCellValue($colLetter . '2', $sampleData[$i]);
                $colLetter++;
            }

            // Tambahkan petunjuk pengisian di bawah sample
            $sheet->setCellValue('A4', 'Catatan:');
            $sheet->setCellValue('A5', '• Untuk Guru: isi salah satu dari "Reference ID" atau "NIK Guru".');
            $sheet->setCellValue('A6', '• Untuk Orang_Tua: isi salah satu dari "Reference ID" (ID Orang Tua), "ID Orang Tua", atau "NIS Anak" (akan dicari ID Orang Tua dari NIS).');
            $sheet->setCellValue('A7', '• Untuk Admin/Kepala_Sekolah/Petugas_Keuangan: kolom Reference ID opsional.');

            $this->addDataValidation($sheet, 'D3:D1000', 'Siswa,Guru,Admin,Kepala_Sekolah,Petugas_Keuangan,Orang_Tua', 'User Type');
            $this->addDataValidation($sheet, 'F3:F1000', 'Aktif,Non-aktif', 'Status');

            $filename = 'template_data_user_' . date('Y-m-d') . '.xlsx';
            $tempPath = storage_path('app/temp/');
            
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }
            
            $fullPath = $tempPath . $filename;
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);
            
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
     * Import users from Excel/CSV file
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
            $errors = [];
            $skippedData = [];

            DB::beginTransaction();

            foreach ($data as $index => $row) {
                try {
                    // Normalize keys
                    $userId = trim($row['user_id'] ?? '');
                    $username = trim($row['username'] ?? '');
                    $passwordPlain = trim($row['password'] ?? '');
                    $userType = trim($row['user_type'] ?? '');
                    // Normalisasi nilai User Type agar toleran terhadap spasi dan huruf kecil
                    $typeAliases = [
                        'siswa' => 'Siswa',
                        'guru' => 'Guru',
                        'admin' => 'Admin',
                        'kepala_sekolah' => 'Kepala_Sekolah',
                        'kepala sekolah' => 'Kepala_Sekolah',
                        'petugas_keuangan' => 'Petugas_Keuangan',
                        'petugas keuangan' => 'Petugas_Keuangan',
                        'orang_tua' => 'Orang_Tua',
                        'orang tua' => 'Orang_Tua'
                    ];
                    $userTypeKey = strtolower(str_replace(' ', '_', $userType));
                    if (isset($typeAliases[$userTypeKey])) {
                        $userType = $typeAliases[$userTypeKey];
                    }

                    $referenceId = trim($row['reference_id'] ?? '');
                    // Kolom alternatif untuk memetakan reference Guru dan Orang Tua
                    // Pertahankan format apa adanya agar cocok dengan data di DB (mendukung '-' dan '.')
                    $nikGuru = trim($row['nik_guru'] ?? ''); // Boleh berisi titik
                    $idOrangTua = trim($row['id_orang_tua'] ?? '');
                    $nisAnak = trim($row['nis_anak'] ?? ''); // Boleh berisi tanda '-'

                    // Jika user_type kosong, infer dari kolom alternatif
                    if ($userType === '') {
                        if ($nikGuru !== '') {
                            $userType = 'Guru';
                        } elseif ($idOrangTua !== '' || $nisAnak !== '') {
                            $userType = 'Orang_Tua';
                        }
                    }

                    // Resolve reference_id berdasarkan tipe user dan kolom alternatif
                    $referenceIdResolved = $referenceId;
                    if ($referenceIdResolved === '') {
                        if ($userType === 'Guru' && $nikGuru !== '') {
                            $referenceIdResolved = $nikGuru;
                        } elseif ($userType === 'Orang_Tua') {
                            if ($idOrangTua !== '') {
                                $referenceIdResolved = $idOrangTua;
                            } elseif ($nisAnak !== '') {
                                // Cari id_orang_tua dari NIS anak
                                $parent = DB::table('siswa')
                                    ->select('id_orang_tua')
                                    ->where('nis', $nisAnak)
                                    ->first();
                                if ($parent && !is_null($parent->id_orang_tua)) {
                                    $referenceIdResolved = (string) $parent->id_orang_tua;
                                } else {
                                    throw new \Exception('NIS anak tidak ditemukan atau belum terhubung ke orang tua: ' . $nisAnak);
                                }
                            }
                        }
                    }
                    $status = trim($row['status'] ?? 'Aktif');

                    // Auto-generate untuk import minimal
                    if ($userId === '') {
                        $userId = $this->generateUserId($userType ?: 'USR');
                    }
                    if ($passwordPlain === '') {
                        $passwordPlain = 'password123';
                    }

                    // Validate required fields minimal
                    if ($username === '') {
                        throw new \Exception('Username wajib diisi');
                    }
                    if ($userType === '') {
                        throw new \Exception('User Type tidak dapat ditentukan. Isi atau sediakan NIK Guru / NIS Anak / ID Orang Tua');
                    }
                    if (!in_array($userType, ['Admin','Kepala_Sekolah','Petugas_Keuangan'], true) && $referenceIdResolved === '') {
                        throw new \Exception('Reference ID wajib untuk tipe ' . $userType . ' (isi NIK Guru / ID Orang Tua / NIS Anak)');
                    }

                    // Validate user_type enum
                    $allowedTypes = ['Siswa','Guru','Admin','Kepala_Sekolah','Petugas_Keuangan','Orang_Tua'];
                    if (!in_array($userType, $allowedTypes, true)) {
                        throw new \Exception('User Type tidak valid: ' . $userType);
                    }

                    // Validate status enum
                    $allowedStatus = ['Aktif','Non-aktif'];
                    if ($status !== '' && !in_array($status, $allowedStatus, true)) {
                        throw new \Exception('Status tidak valid: ' . $status);
                    }

                    // Validate password
                    if ($passwordPlain === '' || strlen($passwordPlain) < 6) {
                        throw new \Exception('Password wajib diisi minimal 6 karakter');
                    }

                    // Check duplicates
                    $existingById = DB::table('users')->where('user_id', $userId)->first();
                    if ($existingById) {
                        $skippedCount++;
                        $skippedData[] = $userId;
                        continue;
                    }

                    $existingByUsername = DB::table('users')->where('username', $username)->first();
                    if ($existingByUsername) {
                        $skippedCount++;
                        $skippedData[] = $username;
                        continue;
                    }

                    // Tentukan reference yang dipakai: Admin fallback ke user_id, lainnya gunakan hasil resolusi
                    $refToUse = null;
                    if ($userType === 'Admin') {
                        $refToUse = $referenceIdResolved !== '' ? $referenceIdResolved : $userId;
                    } else {
                        $refToUse = $referenceIdResolved !== '' ? $referenceIdResolved : null;
                    }

                    // Cek duplikasi reference_id hanya jika ada nilai
                    if ($refToUse !== null) {
                        $existingByReference = DB::table('users')
                            ->where('user_type', $userType)
                            ->where('reference_id', $refToUse)
                            ->first();
                        if ($existingByReference) {
                            $skippedCount++;
                            $skippedData[] = $refToUse;
                            continue;
                        }
                    }

                    // Validasi keberadaan reference di tabel terkait jika diisi (setelah resolusi)
                    if ($userType !== 'Admin' && $refToUse !== null) {
                        if (!$this->validateReferenceId($userType, $refToUse)) {
                            throw new \Exception('Reference ID tidak ditemukan di tabel terkait: ' . $refToUse);
                        }
                    }

                    // Insert user
                    DB::table('users')->insert([
                        'user_id' => $userId,
                        'username' => $username,
                        'password' => Hash::make($passwordPlain),
                        'user_type' => $userType,
                        'reference_id' => $refToUse,
                        'status' => $status ?: 'Aktif',
                        'created_date' => now(),
                        'updated_date' => now()
                    ]);

                    $successCount++;

                } catch (\Exception $e) {
                    $errors[] = 'Baris ' . ($index + 2) . ': ' . $e->getMessage();
                    $errorCount++;
                }
            }

            DB::commit();

            $message = "Import selesai. {$successCount} data berhasil diimpor";
            if ($skippedCount > 0) {
                $message .= ", {$skippedCount} data dilewati (duplikat)";
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
                'message' => 'Error importing users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Read Excel file to array keyed by headers
     */
    private function readExcel($file)
    {
        try {
            $reader = IOFactory::createReader('Xlsx');
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();

            $data = [];
            // Ambil kolom tertinggi untuk membaca semua kolom yang tersedia
            $highestColumn = $worksheet->getHighestColumn();
            $headerRow = $worksheet->rangeToArray("A1:{$highestColumn}1", null, true, false, false)[0];

            $headerMap = [
                'User ID' => 'user_id',
                'Username' => 'username',
                'Password' => 'password',
                'User Type' => 'user_type',
                'Reference ID' => 'reference_id',
                'Status' => 'status',
                // Kolom alternatif untuk memudahkan mapping saat import
                'NIK Guru' => 'nik_guru',
                'ID Orang Tua' => 'id_orang_tua',
                'NIS Anak' => 'nis_anak',
                'NIS Siswa' => 'nis_anak'
            ];

            $headers = [];
            foreach ($headerRow as $index => $header) {
                $cleanHeader = trim($header);
                $headers[$index] = $headerMap[$cleanHeader] ?? strtolower(str_replace(' ', '_', $cleanHeader));
            }

            $highestRow = $worksheet->getHighestRow();
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = $worksheet->rangeToArray("A{$row}:{$highestColumn}{$row}", null, true, false, false)[0];
                if (empty(array_filter($rowData))) {
                    continue;
                }
                $record = [];
                foreach ($rowData as $index => $value) {
                    if (isset($headers[$index])) {
                        $record[$headers[$index]] = is_string($value) ? trim($value) : $value;
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
     * Read CSV file to array keyed by headers
     */
    private function readCSV($file)
    {
        try {
            $data = [];
            $path = $file->getRealPath();
            if (($handle = fopen($path, 'r')) !== false) {
                $headers = fgetcsv($handle);
                $headerMap = [
                    'User ID' => 'user_id',
                    'Username' => 'username',
                    'Password' => 'password',
                    'User Type' => 'user_type',
                    'Reference ID' => 'reference_id',
                    'Status' => 'status',
                    // Kolom alternatif untuk memudahkan mapping saat import
                    'NIK Guru' => 'nik_guru',
                    'ID Orang Tua' => 'id_orang_tua',
                    'NIS Anak' => 'nis_anak',
                    'NIS Siswa' => 'nis_anak'
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
                fclose($handle);
            }
            return $data;
        } catch (\Exception $e) {
            throw new \Exception('Error reading CSV file: ' . $e->getMessage());
        }
    }
}