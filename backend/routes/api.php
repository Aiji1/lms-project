<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SiswaController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\JurusanController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\MataPelajaranController;
use App\Http\Controllers\Api\KurikulumController;
use App\Http\Controllers\Api\JadwalPelajaranController;
use App\Http\Controllers\Api\JurnalMengajarController;
use App\Http\Controllers\Api\PresensiHarianController;
use App\Http\Controllers\Api\PresensiMapelController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TugasAdabController;
use App\Http\Controllers\Api\HafalanController;
use App\Http\Controllers\Api\TargetHafalanSiswaController;
use App\Http\Controllers\Api\EvaluasiHafalanController;
use App\Http\Controllers\Api\NilaiController;
use App\Http\Controllers\Api\PelanggaranController;
use App\Http\Controllers\TugasController;
use App\Http\Controllers\PermissionOverrideController;
use App\Http\Controllers\Api\JenisPembayaranController;
use App\Http\Controllers\Api\TagihanController;
use App\Http\Controllers\Api\PembayaranController;
use App\Http\Controllers\Api\LaporanController;

Route::middleware('custom.auth')->get('/user', function (Request $request) {
    return $request->user();
});

// API Routes for LMS
Route::prefix('v1')->group(function () {
    
    // AUTH ROUTES (No middleware)
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    
    // Protected routes with custom.auth middleware
    Route::middleware('custom.auth')->group(function () {
        
        // DASHBOARD ROUTES
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
        Route::get('/dashboard/quick-stats', [DashboardController::class, 'getQuickStats']);
        
        // JURNAL MENGAJAR ROUTES
        // Form data route
        Route::get('/jurnal-mengajar-form-data', [JurnalMengajarController::class, 'getFormData']);
        // Export route
        Route::get('/jurnal-mengajar/export', [JurnalMengajarController::class, 'export']);
        
        // Jurnal Mengajar API Resource
        Route::apiResource('jurnal-mengajar', JurnalMengajarController::class);
        
        // SISWA ROUTES
        // Template route HARUS di atas apiResource
        Route::get('/siswa/template', [SiswaController::class, 'downloadTemplate']);
        Route::post('/siswa/import', [SiswaController::class, 'import']);
        Route::post('/siswa/bulk-delete', [SiswaController::class, 'bulkDelete']);
        Route::get('/siswa-form-data', [SiswaController::class, 'getFormData']);
        
        // Barcode and RFID routes
        Route::post('/siswa/{nis}/generate-barcode', [SiswaController::class, 'generateBarcode']);
        Route::post('/siswa/{nis}/assign-rfid', [SiswaController::class, 'assignRfid']);
        Route::delete('/siswa/{nis}/remove-rfid', [SiswaController::class, 'removeRfid']);
        Route::get('/siswa/barcode/{barcode}', [SiswaController::class, 'getByBarcode']);
        Route::get('/siswa/rfid/{rfid_code}', [SiswaController::class, 'getByRfid']);
        Route::post('/siswa/bulk-generate-barcodes', [SiswaController::class, 'bulkGenerateBarcodes']);
        
        // Student's own barcode (for student dashboard)
        Route::get('/my-barcode', [SiswaController::class, 'getMyBarcode']);
        
        // Siswa API Resource
        Route::apiResource('siswa', SiswaController::class);
        
        // GURU ROUTES
        // Template route HARUS di atas apiResource
        Route::get('/guru/template', [GuruController::class, 'downloadTemplate']);
        Route::post('/guru/import', [GuruController::class, 'import']);
        Route::get('/guru-form-data', [GuruController::class, 'getFormData']);
        
        // Guru API Resource
        Route::apiResource('guru', GuruController::class);
        
        // USER ROUTES
        // Template route HARUS di atas apiResource
        Route::get('/users/template', [UserController::class, 'downloadTemplate']);
        Route::post('/users/import', [UserController::class, 'import']);
        Route::get('/users-form-data', [UserController::class, 'getFormData']);
        Route::post('/users/{user_id}/reset-password', [UserController::class, 'resetPassword']);

        // User API Resource
        Route::apiResource('users', UserController::class);
        
        // TAHUN AJARAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/tahun-ajaran-form-data', [TahunAjaranController::class, 'getFormData']);
        Route::post('/tahun-ajaran/{id}/activate', [TahunAjaranController::class, 'activate']);
        
        // Tahun Ajaran API Resource
        Route::apiResource('tahun-ajaran', TahunAjaranController::class);
        
        // JURUSAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/jurusan-form-data', [JurusanController::class, 'getFormData']);
        
        // Jurusan API Resource
        Route::apiResource('jurusan', JurusanController::class);
        
        // KELAS ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/kelas-form-data', [KelasController::class, 'getFormData']);
        
        // Kelas API Resource
        Route::apiResource('kelas', KelasController::class);
        
        // MATA PELAJARAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/mata-pelajaran-form-data', [MataPelajaranController::class, 'getFormData']);
        
        // Mata Pelajaran API Resource
        Route::apiResource('mata-pelajaran', MataPelajaranController::class);
        
        // KURIKULUM ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/kurikulum-form-data', [KurikulumController::class, 'getFormData']);
        
        // Kurikulum API Resource
        Route::apiResource('kurikulum', KurikulumController::class);
        
        // JADWAL PELAJARAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/jadwal-pelajaran-form-data', [JadwalPelajaranController::class, 'getFormData']);
        // Tambahan: Form options dengan default selections
        Route::get('/jadwal-pelajaran-form-options', [JadwalPelajaranController::class, 'getFormOptions']);
        
        // Jadwal Pelajaran API Resource
        Route::apiResource('jadwal-pelajaran', JadwalPelajaranController::class);
        
        // PRESENSI ROUTES
        // Presensi Harian form data
        Route::get('/presensi-harian-form-data', [PresensiHarianController::class, 'getFormData']);
        
        // Presensi Harian API Resource
        Route::apiResource('presensi-harian', PresensiHarianController::class);
        
        // Presensi Mapel form data
        Route::get('/presensi-mapel-form-data', [PresensiMapelController::class, 'getFormData']);
        
        // Presensi Mapel API Resource
        Route::apiResource('presensi-mapel', PresensiMapelController::class);

        // TUGAS ADAB ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/tugas-adab-form-data', [TugasAdabController::class, 'getFormData']);
        Route::get('/tugas-adab/{id}/monitoring-stats', [TugasAdabController::class, 'getMonitoringStats']);
        Route::get('/tugas-adab/{id}/monitoring-details', [TugasAdabController::class, 'getMonitoringDetails']);
        Route::post('/tugas-adab/{id}/monitoring-submit', [TugasAdabController::class, 'submitMonitoring']);
        Route::get('/tugas-adab/{id}/monitoring-daily-recap', [TugasAdabController::class, 'getDailyRecapByClass']);
        Route::get('/tugas-adab/{id}/monitoring-export-monthly', [TugasAdabController::class, 'exportMonitoringMonthly']);

        // MONITORING SHOLAT ROUTES
        Route::get('/monitoring-sholat/stats', [\App\Http\Controllers\Api\MonitoringSholatController::class, 'getMonitoringStats']);
        Route::get('/monitoring-sholat/details', [\App\Http\Controllers\Api\MonitoringSholatController::class, 'getMonitoringDetails']);
        Route::post('/monitoring-sholat/submit', [\App\Http\Controllers\Api\MonitoringSholatController::class, 'submitMonitoring']);
        
        // Tugas Adab API Resource
        Route::apiResource('tugas-adab', TugasAdabController::class);

        // MODUL AJAR ROUTES
        Route::get('/modul-ajar/stats', [\App\Http\Controllers\Api\ModulAjarController::class, 'stats']);
        Route::get('/modul-ajar/{id}/download', [\App\Http\Controllers\Api\ModulAjarController::class, 'download']);
        Route::apiResource('modul-ajar', \App\Http\Controllers\Api\ModulAjarController::class);

        // KEDISIPLINAN - PELANGGARAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/pelanggaran-form-data', [PelanggaranController::class, 'getFormData']);
        // Pelanggaran API Resource
        Route::apiResource('pelanggaran', PelanggaranController::class);

        // KEUANGAN ROUTES
        // Form data routes HARUS di atas apiResource
        Route::get('/jenis-pembayaran-form-data', [JenisPembayaranController::class, 'getFormData']);
        Route::get('/tagihan-form-data', [TagihanController::class, 'getFormData']);
        
        // API Resources
        Route::apiResource('jenis-pembayaran', JenisPembayaranController::class);
        Route::apiResource('tagihan', TagihanController::class);
        Route::apiResource('pembayaran', PembayaranController::class);

        // PERMISSION OVERRIDES ROUTES
        Route::get('/permission-overrides/merged', [PermissionOverrideController::class, 'merged']);
        Route::apiResource('permission-overrides', PermissionOverrideController::class);
        
        // HAFALAN ROUTES
        // Form data routes HARUS di atas apiResource
        Route::get('/hafalan-form-data', [HafalanController::class, 'getFormData']);
        
        // Hafalan API Resource
        Route::apiResource('hafalan', HafalanController::class);
        
        // TARGET HAFALAN SISWA ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/target-hafalan-siswa-form-data', [TargetHafalanSiswaController::class, 'getFormData']);
        
        // Target Hafalan Siswa API Resource
        Route::apiResource('target-hafalan-siswa', TargetHafalanSiswaController::class);
        
        // EVALUASI HAFALAN ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/evaluasi-hafalan-form-data', [EvaluasiHafalanController::class, 'getFormData']);
        
        // Evaluasi Hafalan API Resource
        Route::apiResource('evaluasi-hafalan', EvaluasiHafalanController::class);
        
        // NILAI ROUTES
        // Template route HARUS di atas apiResource
        Route::get('/nilai/template', [NilaiController::class, 'template']);
        Route::post('/nilai/import', [NilaiController::class, 'import']);
        Route::get('/nilai-form-data', [NilaiController::class, 'formData']);
        Route::get('/nilai-siswa/filter-options', [NilaiController::class, 'filterOptions']);
        
        // Nilai API Resource
        Route::apiResource('nilai', NilaiController::class);
        
        // TUGAS ROUTES
        // Form data route HARUS di atas apiResource
        Route::get('/tugas-form-data', [TugasController::class, 'getFormOptions']);
        Route::get('/tugas/siswa/{idKelas}', [TugasController::class, 'getSiswaByKelas']);
        Route::get('/tugas/{id}/pengumpulan', [TugasController::class, 'getPengumpulan']);
        Route::post('/tugas/{id}/pengumpulan', [TugasController::class, 'submitPengumpulan']);
        
        // Tugas API Resource
        Route::apiResource('tugas', TugasController::class);

        // Test Route
        Route::get('/test', function () {
            return response()->json([
                'success' => true,
                'message' => 'API is working',
                'timestamp' => now()
            ]);
        });

        // LAPORAN ROUTES
        Route::get('/laporan/form-data', [LaporanController::class, 'getFormData']);
        Route::get('/laporan/presensi', [LaporanController::class, 'presensi']);
        Route::get('/laporan/tahfidz', [LaporanController::class, 'tahfidz']);
        Route::get('/laporan/statistik', [LaporanController::class, 'statistik']);
        
    }); // End of custom.auth middleware group
    
}); // End of v1 prefix group