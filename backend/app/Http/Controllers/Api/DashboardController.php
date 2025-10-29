<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        try {
            // Get authenticated user from middleware
            $authenticatedUser = $request->attributes->get('authenticated_user');
            
            if (!$authenticatedUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            
            // Get user detail with nama_lengkap
            $userDetail = $this->getUserDetail($authenticatedUser);
            
            // Base statistics - get real data from database
            $stats = [
                'totalSiswa' => DB::table('siswa')->where('status', 'Aktif')->count(),
                'totalGuru' => DB::table('guru')->where('status', 'Aktif')->count(),
                'totalKelas' => DB::table('kelas')->count(),
                'totalMapel' => DB::table('mata_pelajaran')->where('status', 'Aktif')->count(),
                'totalTahunAjaran' => DB::table('tahun_ajaran')->count(),
                'totalJurusan' => DB::table('jurusan')->count(),
                'totalUsers' => User::where('status', 'Aktif')->count(),
            ];

            // Role-specific additional stats
            $userType = $authenticatedUser->user_type;
            switch ($userType) {
                case 'Admin':
                    $stats['activeUsers'] = User::where('status', 'Aktif')->count();
                    $stats['inactiveUsers'] = User::where('status', 'Tidak_Aktif')->count();
                    break;

                case 'Kepala_Sekolah':
                    // Add school-specific metrics - real data
                    $stats['totalPrestasi'] = DB::table('rapot')
                        ->join('siswa', 'rapot.nis', '=', 'siswa.nis')
                        ->where('siswa.status', 'Aktif')
                        ->count();
                    $stats['totalLaporan'] = DB::table('laporan')->count();
                    break;

                case 'Guru':
                    // Get guru-specific data
                    $guruData = DB::table('guru')->where('nik_guru', $authenticatedUser->reference_id)->first();
                    if ($guruData) {
                        $stats['kelasDiampu'] = DB::table('jadwal_pelajaran')
                            ->where('nik_guru', $authenticatedUser->reference_id)
                            ->distinct('id_kelas')
                            ->count();
                        $stats['totalSiswaGuru'] = DB::table('jadwal_pelajaran')
                            ->join('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                            ->join('siswa', 'kelas.id_kelas', '=', 'siswa.id_kelas')
                            ->where('jadwal_pelajaran.nik_guru', $authenticatedUser->reference_id)
                            ->where('siswa.status', 'Aktif')
                            ->count();
                        $stats['tugasAktif'] = DB::table('tugas')
                            ->join('mata_pelajaran', 'tugas.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                            ->join('guru_mata_pelajaran', 'mata_pelajaran.id_mata_pelajaran', '=', 'guru_mata_pelajaran.id_mata_pelajaran')
                            ->where('guru_mata_pelajaran.nik_guru', $authenticatedUser->reference_id)
                            ->where('tugas.status', 'Aktif')
                            ->count();
                        $stats['penilaian'] = DB::table('nilai')
                            ->where('nik_guru_penginput', $authenticatedUser->reference_id)
                            ->count();
                    } else {
                        $stats['kelasDiampu'] = 0;
                        $stats['totalSiswaGuru'] = 0;
                        $stats['tugasAktif'] = 0;
                        $stats['penilaian'] = 0;
                    }
                    break;

                case 'Siswa':
                    // Get siswa-specific data
                    $siswaData = DB::table('siswa')->where('nis', $authenticatedUser->reference_id)->first();
                    if ($siswaData) {
                        // Calculate real average grade
                        $avgNilai = DB::table('nilai')
                            ->where('nis', $authenticatedUser->reference_id)
                            ->where('status', 'Final')
                            ->avg('nilai');
                        $stats['rataRataNilai'] = $avgNilai ? round($avgNilai, 1) : 0;
                        
                        // Calculate attendance percentage
                        $totalPresensi = DB::table('presensi_harian')
                            ->where('nis', $authenticatedUser->reference_id)
                            ->count();
                        $hadirCount = DB::table('presensi_harian')
                            ->where('nis', $authenticatedUser->reference_id)
                            ->where('status', 'Hadir')
                            ->count();
                        $stats['persentaseKehadiran'] = $totalPresensi > 0 ? round(($hadirCount / $totalPresensi) * 100, 1) : 0;
                        
                        // Count completed and pending tasks
                        $stats['tugasDiselesaikan'] = DB::table('pengumpulan_tugas')
                            ->where('nis', $authenticatedUser->reference_id)
                            ->where('status', 'Dikumpulkan')
                            ->count();
                        $totalTugas = DB::table('tugas')
                            ->join('mata_pelajaran', 'tugas.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                            ->join('jadwal_pelajaran', 'mata_pelajaran.id_mata_pelajaran', '=', 'jadwal_pelajaran.id_mata_pelajaran')
                            ->where('jadwal_pelajaran.id_kelas', $siswaData->id_kelas)
                            ->where('tugas.status', 'Aktif')
                            ->count();
                        $stats['tugasPending'] = $totalTugas - $stats['tugasDiselesaikan'];
                    } else {
                        $stats['rataRataNilai'] = 0;
                        $stats['persentaseKehadiran'] = 0;
                        $stats['tugasDiselesaikan'] = 0;
                        $stats['tugasPending'] = 0;
                    }
                    break;

                case 'Petugas_Keuangan':
                    // Calculate real financial data
                    $stats['totalTagihan'] = DB::table('tagihan')->count();
                    $stats['pembayaranBulanIni'] = DB::table('pembayaran')
                        ->whereMonth('tanggal_pembayaran', date('m'))
                        ->whereYear('tanggal_pembayaran', date('Y'))
                        ->count();
                    $stats['tunggakan'] = DB::table('tagihan')
                        ->where('status', 'Belum_Lunas')
                        ->count();
                    $stats['totalPendapatan'] = DB::table('pembayaran')
                        ->whereMonth('tanggal_pembayaran', date('m'))
                        ->whereYear('tanggal_pembayaran', date('Y'))
                        ->sum('jumlah_bayar');
                    break;

                case 'Orang_Tua':
                    // Get data for parent's children
                    $orangTuaData = DB::table('orang_tua')->where('id_orang_tua', $authenticatedUser->reference_id)->first();
                    if ($orangTuaData) {
                        $stats['jumlahAnak'] = DB::table('siswa')
                            ->where('id_orang_tua', $authenticatedUser->reference_id)
                            ->where('status', 'Aktif')
                            ->count();
                        
                        // Calculate average grade for all children
                        $avgNilaiAnak = DB::table('nilai')
                            ->join('siswa', 'nilai.nis', '=', 'siswa.nis')
                            ->where('siswa.id_orang_tua', $authenticatedUser->reference_id)
                            ->where('nilai.status', 'Final')
                            ->avg('nilai.nilai');
                        $stats['rataRataNilaiAnak'] = $avgNilaiAnak ? round($avgNilaiAnak, 1) : 0;
                        
                        // Calculate attendance percentage for all children
                        $totalPresensiAnak = DB::table('presensi_harian')
                            ->join('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                            ->where('siswa.id_orang_tua', $authenticatedUser->reference_id)
                            ->count();
                        $hadirCountAnak = DB::table('presensi_harian')
                            ->join('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                            ->where('siswa.id_orang_tua', $authenticatedUser->reference_id)
                            ->where('presensi_harian.status', 'Hadir')
                            ->count();
                        $stats['kehadiranAnak'] = $totalPresensiAnak > 0 ? round(($hadirCountAnak / $totalPresensiAnak) * 100, 1) : 0;
                        
                        // Calculate total unpaid bills for all children
                        $stats['tagihan'] = DB::table('tagihan')
                            ->join('siswa', 'tagihan.nis', '=', 'siswa.nis')
                            ->where('siswa.id_orang_tua', $authenticatedUser->reference_id)
                            ->where('tagihan.status', 'Belum_Lunas')
                            ->sum('tagihan.jumlah_tagihan');
                    } else {
                        $stats['jumlahAnak'] = 0;
                        $stats['rataRataNilaiAnak'] = 0;
                        $stats['kehadiranAnak'] = 0;
                        $stats['tagihan'] = 0;
                    }
                    break;

                default:
                    // Default admin stats
                    $stats['activeUsers'] = User::where('status', 'Aktif')->count();
                    $stats['inactiveUsers'] = User::where('status', 'Tidak_Aktif')->count();
                    break;
            }

            // Recent activities (this would be more complex in real implementation)
            $recentActivities = [
                [
                    'type' => 'info',
                    'title' => 'Sistem diperbarui',
                    'description' => 'Fitur baru telah ditambahkan ke sistem',
                    'time' => '2 jam yang lalu'
                ],
                [
                    'type' => 'success',
                    'title' => 'Data berhasil disinkronkan',
                    'description' => 'Semua data telah berhasil disinkronkan',
                    'time' => '5 jam yang lalu'
                ],
                [
                    'type' => 'warning',
                    'title' => 'Backup otomatis',
                    'description' => 'Backup database telah selesai dilakukan',
                    'time' => '1 hari yang lalu'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'user' => [
                        'user_id' => $authenticatedUser->user_id,
                        'username' => $authenticatedUser->username,
                        'user_type' => $userType,
                        'nama_lengkap' => $userDetail['nama_lengkap'],
                        'reference_id' => $authenticatedUser->reference_id
                    ],
                    'recentActivities' => $recentActivities
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dashboard: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user detail with nama_lengkap from related table
     */
    private function getUserDetail($user)
    {
        $nama_lengkap = 'Unknown';

        try {
            switch ($user->user_type) {
                case 'Siswa':
                    $detail = DB::table('siswa')->where('nis', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama_lengkap : 'Siswa tidak ditemukan';
                    break;
                    
                case 'Guru':
                    $detail = DB::table('guru')->where('nik_guru', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama_lengkap : 'Guru tidak ditemukan';
                    break;
                    
                case 'Admin':
                    $detail = DB::table('admin')->where('id_admin', $user->reference_id)->first();
                    // Fallback ke username jika detail admin tidak ditemukan
                    $nama_lengkap = $detail ? $detail->nama_admin : ($user->username ?? 'Admin');
                    break;
                    
                case 'Kepala_Sekolah':
                    $detail = DB::table('kepala_sekolah')->where('id_kepala_sekolah', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama : 'Kepala Sekolah tidak ditemukan';
                    break;
                    
                case 'Petugas_Keuangan':
                    $detail = DB::table('petugas_keuangan')->where('id_petugas_keuangan', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama : 'Petugas Keuangan tidak ditemukan';
                    break;
                    
                case 'Orang_Tua':
                    $detail = DB::table('orang_tua')->where('id_orang_tua', $user->reference_id)->first();
                    $nama_lengkap = $detail ? ($detail->nama_ayah . ' / ' . $detail->nama_ibu) : 'Orang Tua tidak ditemukan';
                    break;
            }
        } catch (\Exception $e) {
            // If error getting detail, use default
            $nama_lengkap = 'Error getting name';
        }

        return ['nama_lengkap' => $nama_lengkap];
    }

    public function getQuickStats()
    {
        try {
            // Quick stats for public dashboard or login page - using real data
            $stats = [
                'totalSiswa' => DB::table('siswa')->where('status', 'Aktif')->count(),
                'totalGuru' => DB::table('guru')->where('status', 'Aktif')->count(),
                'totalKelas' => DB::table('kelas')->count(),
                'totalMapel' => DB::table('mata_pelajaran')->where('status', 'Aktif')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}