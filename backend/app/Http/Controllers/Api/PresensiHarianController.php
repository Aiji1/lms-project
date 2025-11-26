<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PresensiHarianController extends Controller
{
    /**
     * Constants for attendance status
     */
    const STATUS_HADIR = 'hadir';
    const STATUS_IZIN = 'izin';
    const STATUS_SAKIT = 'sakit';
    const STATUS_ALPHA = 'alpha';
    const STATUS_TERLAMBAT = 'terlambat';

    /**
     * Constants for scan methods
     */
    const METHOD_QRCODE = 'qrcode';
    const METHOD_RFID = 'rfid';
    const METHOD_BARCODE = 'barcode';
    const METHOD_FINGERPRINT = 'fingerprint';
    const METHOD_MANUAL = 'manual';

    /**
     * Display a listing of daily attendance records.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'kelas.tingkat',
                    'jurusan.nama_jurusan'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('siswa.nis', 'LIKE', "%{$search}%");
                });
            }

            // Filter by date
            if ($request->has('tanggal') && $request->tanggal) {
                $query->where('presensi_harian.tanggal', $request->tanggal);
            }

            // Filter by date range
            if ($request->has('tanggal_mulai') && $request->tanggal_mulai) {
                $query->where('presensi_harian.tanggal', '>=', $request->tanggal_mulai);
            }
            if ($request->has('tanggal_selesai') && $request->tanggal_selesai) {
                $query->where('presensi_harian.tanggal', '<=', $request->tanggal_selesai);
            }

            // Filter by kelas
            if ($request->has('id_kelas') && $request->id_kelas) {
                $query->where('presensi_harian.id_kelas', $request->id_kelas);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('presensi_harian.status', $request->status);
            }

            // Filter by tahun ajaran
            if ($request->has('id_tahun_ajaran') && $request->id_tahun_ajaran) {
                $query->where('presensi_harian.id_tahun_ajaran', $request->id_tahun_ajaran);
            }

            // Order by newest first
            $query->orderBy('presensi_harian.tanggal', 'desc')
                  ->orderBy('presensi_harian.jam_masuk', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 10);
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data presensi harian berhasil diambil',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching presensi harian: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Scan presensi masuk (Check In)
     */
    public function scanMasuk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'metode' => 'required|in:qrcode,rfid,barcode,fingerprint,manual',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'device_info' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            $today = Carbon::now()->toDateString();
            $now = Carbon::now();
            $currentTime = $now->format('H:i:s');
            $currentDay = strtolower($now->locale('id')->dayName);

            // Get siswa data
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.nis', $request->nis)
                ->select('siswa.*', 'kelas.id_tahun_ajaran')
                ->first();

            if (!$siswa) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Siswa tidak ditemukan'
                ], 404);
            }

            // Check if already checked in today
            $existingPresensi = DB::table('presensi_harian')
                ->where('nis', $request->nis)
                ->where('tanggal', $today)
                ->first();

            if ($existingPresensi) {
                // Log failed scan
                $this->logScan([
                    'nis' => $request->nis,
                    'tipe' => 'masuk',
                    'metode' => $request->metode,
                    'waktu_scan' => $now,
                    'lat' => $request->lat,
                    'lng' => $request->lng,
                    'device_info' => $request->device_info,
                    'is_success' => false,
                    'error_message' => 'Sudah melakukan presensi masuk hari ini'
                ]);

                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah melakukan presensi masuk hari ini',
                    'data' => [
                        'jam_masuk' => $existingPresensi->jam_masuk,
                        'status' => $existingPresensi->status
                    ]
                ], 422);
            }

            // Get jam sekolah configuration
            $jamSekolah = DB::table('jam_sekolah')
                ->where('id_tahun_ajaran', $siswa->id_tahun_ajaran)
                ->where('hari', $currentDay)
                ->where('is_active', true)
                ->first();

            if (!$jamSekolah) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Konfigurasi jam sekolah tidak ditemukan untuk hari ini'
                ], 404);
            }

            // Validate location if GPS provided
            $isValidLocation = true;
            if ($request->lat && $request->lng) {
                $distance = $this->calculateDistance(
                    $request->lat,
                    $request->lng,
                    $jamSekolah->lat_sekolah,
                    $jamSekolah->lng_sekolah
                );
                
                $isValidLocation = $distance <= $jamSekolah->radius_lokasi_meter;
                
                if (!$isValidLocation) {
                    // Log failed scan
                    $this->logScan([
                        'nis' => $request->nis,
                        'tipe' => 'masuk',
                        'metode' => $request->metode,
                        'waktu_scan' => $now,
                        'lat' => $request->lat,
                        'lng' => $request->lng,
                        'device_info' => $request->device_info,
                        'is_success' => false,
                        'error_message' => "Lokasi terlalu jauh dari sekolah ({$distance}m)"
                    ]);

                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Lokasi Anda terlalu jauh dari sekolah',
                        'data' => [
                            'jarak' => round($distance, 2) . ' meter',
                            'batas_maksimal' => $jamSekolah->radius_lokasi_meter . ' meter'
                        ]
                    ], 422);
                }
            }

            // Check if late
            $jamMasukBatas = Carbon::parse($jamSekolah->jam_masuk)
                ->addMinutes($jamSekolah->batas_toleransi_menit);
            $isLate = $now->gt($jamMasukBatas);

            // Determine status
            $status = $isLate ? self::STATUS_TERLAMBAT : self::STATUS_HADIR;

            // Insert presensi
            $presensiId = DB::table('presensi_harian')->insertGetId([
                'nis' => $request->nis,
                'id_kelas' => $siswa->id_kelas,
                'id_tahun_ajaran' => $siswa->id_tahun_ajaran,
                'tanggal' => $today,
                'jam_masuk' => $currentTime,
                'status' => $status,
                'metode_presensi' => $request->metode,
                'lat_masuk' => $request->lat,
                'lng_masuk' => $request->lng,
                'device_masuk' => $request->device_info,
                'is_valid_location_masuk' => $isValidLocation,
                'is_late' => $isLate,
                'created_at' => $now,
                'updated_at' => $now
            ]);

            // Log successful scan
            $this->logScan([
                'nis' => $request->nis,
                'tipe' => 'masuk',
                'metode' => $request->metode,
                'waktu_scan' => $now,
                'lat' => $request->lat,
                'lng' => $request->lng,
                'device_info' => $request->device_info,
                'is_success' => true,
                'error_message' => null
            ]);

            DB::commit();

            // Get complete data
            $presensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->where('presensi_harian.id_presensi_harian', $presensiId)
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => $isLate 
                    ? 'Presensi masuk berhasil (Terlambat)' 
                    : 'Presensi masuk berhasil',
                'data' => [
                    'presensi' => $presensi,
                    'jam_sekolah' => [
                        'jam_masuk' => $jamSekolah->jam_masuk,
                        'batas_toleransi' => $jamSekolah->batas_toleransi_menit . ' menit'
                    ],
                    'info' => [
                        'status' => $status,
                        'is_late' => $isLate,
                        'selisih_waktu' => $isLate 
                            ? $now->diffInMinutes($jamMasukBatas) . ' menit terlambat'
                            : null
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error scan masuk: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Scan presensi pulang (Check Out)
     */
    public function scanPulang(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'metode' => 'required|in:qrcode,rfid,barcode,fingerprint,manual',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'device_info' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            $today = Carbon::now()->toDateString();
            $now = Carbon::now();
            $currentTime = $now->format('H:i:s');

            // Check if already checked in today
            $presensi = DB::table('presensi_harian')
                ->where('nis', $request->nis)
                ->where('tanggal', $today)
                ->first();

            if (!$presensi) {
                // Log failed scan
                $this->logScan([
                    'nis' => $request->nis,
                    'tipe' => 'pulang',
                    'metode' => $request->metode,
                    'waktu_scan' => $now,
                    'lat' => $request->lat,
                    'lng' => $request->lng,
                    'device_info' => $request->device_info,
                    'is_success' => false,
                    'error_message' => 'Belum melakukan presensi masuk'
                ]);

                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Anda belum melakukan presensi masuk hari ini'
                ], 422);
            }

            if ($presensi->jam_pulang) {
                // Log failed scan
                $this->logScan([
                    'nis' => $request->nis,
                    'tipe' => 'pulang',
                    'metode' => $request->metode,
                    'waktu_scan' => $now,
                    'lat' => $request->lat,
                    'lng' => $request->lng,
                    'device_info' => $request->device_info,
                    'is_success' => false,
                    'error_message' => 'Sudah melakukan presensi pulang'
                ]);

                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah melakukan presensi pulang hari ini',
                    'data' => [
                        'jam_pulang' => $presensi->jam_pulang
                    ]
                ], 422);
            }

            // Get jam sekolah configuration
            $jamSekolah = DB::table('jam_sekolah')
                ->where('id_tahun_ajaran', $presensi->id_tahun_ajaran)
                ->where('hari', strtolower($now->locale('id')->dayName))
                ->where('is_active', true)
                ->first();

            // Validate location if GPS provided
            $isValidLocation = true;
            if ($request->lat && $request->lng && $jamSekolah) {
                $distance = $this->calculateDistance(
                    $request->lat,
                    $request->lng,
                    $jamSekolah->lat_sekolah,
                    $jamSekolah->lng_sekolah
                );
                
                $isValidLocation = $distance <= $jamSekolah->radius_lokasi_meter;
                
                if (!$isValidLocation) {
                    // Log failed scan
                    $this->logScan([
                        'nis' => $request->nis,
                        'tipe' => 'pulang',
                        'metode' => $request->metode,
                        'waktu_scan' => $now,
                        'lat' => $request->lat,
                        'lng' => $request->lng,
                        'device_info' => $request->device_info,
                        'is_success' => false,
                        'error_message' => "Lokasi terlalu jauh dari sekolah ({$distance}m)"
                    ]);

                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Lokasi Anda terlalu jauh dari sekolah',
                        'data' => [
                            'jarak' => round($distance, 2) . ' meter',
                            'batas_maksimal' => $jamSekolah->radius_lokasi_meter . ' meter'
                        ]
                    ], 422);
                }
            }

            // Update presensi
            DB::table('presensi_harian')
                ->where('id_presensi_harian', $presensi->id_presensi_harian)
                ->update([
                    'jam_pulang' => $currentTime,
                    'metode_pulang' => $request->metode,
                    'lat_pulang' => $request->lat,
                    'lng_pulang' => $request->lng,
                    'device_pulang' => $request->device_info,
                    'is_valid_location_pulang' => $isValidLocation,
                    'updated_at' => $now
                ]);

            // Log successful scan
            $this->logScan([
                'nis' => $request->nis,
                'tipe' => 'pulang',
                'metode' => $request->metode,
                'waktu_scan' => $now,
                'lat' => $request->lat,
                'lng' => $request->lng,
                'device_info' => $request->device_info,
                'is_success' => true,
                'error_message' => null
            ]);

            DB::commit();

            // Get updated data
            $updatedPresensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->where('presensi_harian.id_presensi_harian', $presensi->id_presensi_harian)
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas'
                )
                ->first();

            // Calculate duration
            $jamMasuk = Carbon::parse($presensi->jam_masuk);
            $jamPulang = Carbon::parse($currentTime);
            $duration = $jamMasuk->diffInMinutes($jamPulang);

            return response()->json([
                'success' => true,
                'message' => 'Presensi pulang berhasil',
                'data' => [
                    'presensi' => $updatedPresensi,
                    'info' => [
                        'durasi' => [
                            'jam' => floor($duration / 60),
                            'menit' => $duration % 60,
                            'total_menit' => $duration
                        ]
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error scan pulang: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's attendance statistics
     */
    public function getTodayStats(Request $request)
    {
        try {
            $today = Carbon::now()->toDateString();
            
            // Get active tahun ajaran
            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('status', 'Aktif')
                ->first();

            if (!$tahunAjaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tahun ajaran aktif tidak ditemukan'
                ], 404);
            }

            // Total siswa
            $totalSiswa = DB::table('siswa')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('kelas.id_tahun_ajaran', $tahunAjaran->id_tahun_ajaran)
                ->count();

            // Stats by status
            $stats = DB::table('presensi_harian')
                ->select('status', DB::raw('count(*) as jumlah'))
                ->where('tanggal', $today)
                ->where('id_tahun_ajaran', $tahunAjaran->id_tahun_ajaran)
                ->groupBy('status')
                ->get()
                ->keyBy('status');

            $hadir = $stats->get('hadir')->jumlah ?? 0;
            $terlambat = $stats->get('terlambat')->jumlah ?? 0;
            $izin = $stats->get('izin')->jumlah ?? 0;
            $sakit = $stats->get('sakit')->jumlah ?? 0;
            $alpha = $totalSiswa - ($hadir + $terlambat + $izin + $sakit);

            // Belum presensi (hadir + terlambat)
            $sudahPresensi = $hadir + $terlambat;
            $belumPresensi = $totalSiswa - $sudahPresensi - $izin - $sakit;

            // Get latest scans
            $latestScans = DB::table('presensi_scan_log')
                ->join('siswa', 'presensi_scan_log.nis', '=', 'siswa.nis')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('kelas.id_tahun_ajaran', $tahunAjaran->id_tahun_ajaran)
                ->whereDate('presensi_scan_log.waktu_scan', $today)
                ->orderBy('presensi_scan_log.waktu_scan', 'desc')
                ->limit(10)
                ->select(
                    'presensi_scan_log.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas'
                )
                ->get();

            // Siswa yang terlambat hari ini
            $siswaTerlambat = DB::table('presensi_harian')
                ->join('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->join('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->where('presensi_harian.tanggal', $today)
                ->where('presensi_harian.status', 'terlambat')
                ->where('presensi_harian.id_tahun_ajaran', $tahunAjaran->id_tahun_ajaran)
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'presensi_harian.jam_masuk'
                )
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Statistik presensi hari ini berhasil diambil',
                'data' => [
                    'tanggal' => $today,
                    'total_siswa' => $totalSiswa,
                    'summary' => [
                        'hadir' => $hadir,
                        'terlambat' => $terlambat,
                        'izin' => $izin,
                        'sakit' => $sakit,
                        'alpha' => $alpha,
                        'sudah_presensi' => $sudahPresensi,
                        'belum_presensi' => $belumPresensi
                    ],
                    'percentage' => [
                        'hadir' => $totalSiswa > 0 ? round(($hadir / $totalSiswa) * 100, 2) : 0,
                        'terlambat' => $totalSiswa > 0 ? round(($terlambat / $totalSiswa) * 100, 2) : 0,
                        'izin' => $totalSiswa > 0 ? round(($izin / $totalSiswa) * 100, 2) : 0,
                        'sakit' => $totalSiswa > 0 ? round(($sakit / $totalSiswa) * 100, 2) : 0,
                        'alpha' => $totalSiswa > 0 ? round(($alpha / $totalSiswa) * 100, 2) : 0,
                        'kehadiran' => $totalSiswa > 0 ? round(($sudahPresensi / $totalSiswa) * 100, 2) : 0
                    ],
                    'latest_scans' => $latestScans,
                    'siswa_terlambat' => $siswaTerlambat
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching today stats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance history for a specific student
     */
    public function getSiswaHistory($nis, Request $request)
    {
        try {
            $query = DB::table('presensi_harian')
                ->where('nis', $nis);

            // Filter by date range
            if ($request->has('bulan') && $request->has('tahun')) {
                $query->whereMonth('tanggal', $request->bulan)
                      ->whereYear('tanggal', $request->tahun);
            } elseif ($request->has('tanggal_mulai') && $request->has('tanggal_selesai')) {
                $query->whereBetween('tanggal', [$request->tanggal_mulai, $request->tanggal_selesai]);
            }

            $presensi = $query->orderBy('tanggal', 'desc')->get();

            // Calculate statistics
            $total = $presensi->count();
            $hadir = $presensi->where('status', 'hadir')->count();
            $terlambat = $presensi->where('status', 'terlambat')->count();
            $izin = $presensi->where('status', 'izin')->count();
            $sakit = $presensi->where('status', 'sakit')->count();
            $alpha = $presensi->where('status', 'alpha')->count();

            // Get siswa info
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('siswa.nis', $nis)
                ->select(
                    'siswa.*',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'History presensi siswa berhasil diambil',
                'data' => [
                    'siswa' => $siswa,
                    'presensi' => $presensi,
                    'statistik' => [
                        'total' => $total,
                        'hadir' => $hadir,
                        'terlambat' => $terlambat,
                        'izin' => $izin,
                        'sakit' => $sakit,
                        'alpha' => $alpha,
                        'persentase_kehadiran' => $total > 0 
                            ? round((($hadir + $terlambat) / $total) * 100, 2) 
                            : 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching siswa history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manual attendance input (for admin/teacher)
     */
    public function manualInput(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'tanggal' => 'required|date',
            'status' => 'required|in:hadir,izin,sakit,alpha,terlambat',
            'jam_masuk' => 'nullable|date_format:H:i:s',
            'jam_pulang' => 'nullable|date_format:H:i:s',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        
        try {
            // Get siswa data
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.nis', $request->nis)
                ->select('siswa.*', 'kelas.id_tahun_ajaran')
                ->first();

            // Check if attendance already exists
            $existingPresensi = DB::table('presensi_harian')
                ->where('nis', $request->nis)
                ->where('tanggal', $request->tanggal)
                ->first();

            $now = Carbon::now();

            if ($existingPresensi) {
                // Update existing
                DB::table('presensi_harian')
                    ->where('id_presensi_harian', $existingPresensi->id_presensi_harian)
                    ->update([
                        'status' => $request->status,
                        'jam_masuk' => $request->jam_masuk ?? $existingPresensi->jam_masuk,
                        'jam_pulang' => $request->jam_pulang ?? $existingPresensi->jam_pulang,
                        'keterangan' => $request->keterangan ?? $existingPresensi->keterangan,
                        'metode_presensi' => self::METHOD_MANUAL,
                        'updated_by' => $request->user()->id ?? null,
                        'updated_at' => $now
                    ]);

                $presensiId = $existingPresensi->id_presensi_harian;
                $message = 'Presensi berhasil diupdate';
            } else {
                // Create new
                $presensiId = DB::table('presensi_harian')->insertGetId([
                    'nis' => $request->nis,
                    'id_kelas' => $siswa->id_kelas,
                    'id_tahun_ajaran' => $siswa->id_tahun_ajaran,
                    'tanggal' => $request->tanggal,
                    'jam_masuk' => $request->jam_masuk,
                    'jam_pulang' => $request->jam_pulang,
                    'status' => $request->status,
                    'metode_presensi' => self::METHOD_MANUAL,
                    'keterangan' => $request->keterangan,
                    'created_by' => $request->user()->id ?? null,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);

                $message = 'Presensi berhasil ditambahkan';
            }

            DB::commit();

            // Get complete data
            $presensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->where('presensi_harian.id_presensi_harian', $presensiId)
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $presensi
            ], $existingPresensi ? 200 : 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error manual input: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created attendance record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'tanggal' => 'required|date',
            'status' => 'required|in:hadir,sakit,izin,alpha,terlambat',
            'metode_presensi' => 'required|in:manual,qrcode,rfid,barcode,fingerprint'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if attendance already exists for this student on this date
            $existingPresensi = DB::table('presensi_harian')
                ->where('nis', $request->nis)
                ->where('tanggal', $request->tanggal)
                ->first();

            if ($existingPresensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi untuk siswa ini pada tanggal tersebut sudah ada'
                ], 422);
            }

            // Get siswa data for id_kelas and id_tahun_ajaran
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.nis', $request->nis)
                ->select('siswa.*', 'kelas.id_tahun_ajaran')
                ->first();

            $now = Carbon::now();

            $presensiId = DB::table('presensi_harian')->insertGetId([
                'nis' => $request->nis,
                'id_kelas' => $siswa->id_kelas,
                'id_tahun_ajaran' => $siswa->id_tahun_ajaran,
                'tanggal' => $request->tanggal,
                'jam_masuk' => $now->format('H:i:s'),
                'status' => $request->status,
                'metode_presensi' => $request->metode_presensi,
                'created_at' => $now,
                'updated_at' => $now
            ]);

            $presensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('presensi_harian.id_presensi_harian', $presensiId)
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Presensi harian berhasil ditambahkan',
                'data' => $presensi
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating presensi harian: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified attendance record.
     */
    public function show($id)
    {
        try {
            $presensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'presensi_harian.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('presensi_harian.id_presensi_harian', $id)
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi harian tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data presensi harian berhasil diambil',
                'data' => $presensi
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching presensi harian: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified attendance record.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'tanggal' => 'required|date',
            'jam_masuk' => 'nullable|date_format:H:i:s',
            'jam_pulang' => 'nullable|date_format:H:i:s',
            'status' => 'required|in:hadir,izin,sakit,alpha,terlambat',
            'metode_presensi' => 'nullable|in:qrcode,rfid,barcode,fingerprint,manual',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if presensi exists
            $presensi = DB::table('presensi_harian')
                ->where('id_presensi_harian', $id)
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi harian tidak ditemukan'
                ], 404);
            }

            // Check if attendance already exists for this student on this date (excluding current record)
            $existingPresensi = DB::table('presensi_harian')
                ->where('nis', $request->nis)
                ->where('tanggal', $request->tanggal)
                ->where('id_presensi_harian', '!=', $id)
                ->first();

            if ($existingPresensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi untuk siswa ini pada tanggal tersebut sudah ada'
                ], 422);
            }

            DB::table('presensi_harian')
                ->where('id_presensi_harian', $id)
                ->update([
                    'nis' => $request->nis,
                    'tanggal' => $request->tanggal,
                    'jam_masuk' => $request->jam_masuk ?? $presensi->jam_masuk,
                    'jam_pulang' => $request->jam_pulang,
                    'status' => $request->status,
                    'metode_presensi' => $request->metode_presensi ?? $presensi->metode_presensi,
                    'keterangan' => $request->keterangan,
                    'updated_at' => Carbon::now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Presensi harian berhasil diupdate'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating presensi harian: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified attendance record.
     */
    public function destroy($id)
    {
        try {
            $presensi = DB::table('presensi_harian')
                ->where('id_presensi_harian', $id)
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi harian tidak ditemukan'
                ], 404);
            }

            DB::table('presensi_harian')
                ->where('id_presensi_harian', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Presensi harian berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting presensi harian: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for creating/editing presensi harian
     */
    public function getFormData()
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->orderBy('siswa.nama_lengkap')
                ->get();

            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    'kelas.tingkat',
                    'jurusan.nama_jurusan'
                )
                ->orderBy('kelas.tingkat')
                ->orderBy('kelas.nama_kelas')
                ->get();

            $tahunAjaran = DB::table('tahun_ajaran')
                ->orderBy('tahun_ajaran', 'desc')
                ->get();

            $status_kehadiran = [
                ['value' => 'hadir', 'label' => 'Hadir'],
                ['value' => 'terlambat', 'label' => 'Terlambat'],
                ['value' => 'sakit', 'label' => 'Sakit'],
                ['value' => 'izin', 'label' => 'Izin'],
                ['value' => 'alpha', 'label' => 'Alpha']
            ];

            $metode_presensi = [
                ['value' => 'qrcode', 'label' => 'QR Code'],
                ['value' => 'rfid', 'label' => 'RFID'],
                ['value' => 'barcode', 'label' => 'Barcode'],
                ['value' => 'fingerprint', 'label' => 'Fingerprint'],
                ['value' => 'manual', 'label' => 'Manual']
            ];

            return response()->json([
                'success' => true,
                'message' => 'Form data berhasil diambil',
                'data' => [
                    'siswa' => $siswa,
                    'kelas' => $kelas,
                    'tahun_ajaran' => $tahunAjaran,
                    'status_kehadiran' => $status_kehadiran,
                    'metode_presensi' => $metode_presensi
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
     * Helper: Calculate distance between two GPS coordinates (Haversine formula)
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        $distance = $earthRadius * $c;

        return $distance; // in meters
    }

    /**
     * Helper: Log scan attempt to presensi_scan_log
     */
    private function logScan($data)
    {
        try {
            DB::table('presensi_scan_log')->insert([
                'nis' => $data['nis'],
                'tipe' => $data['tipe'],
                'metode' => $data['metode'],
                'waktu_scan' => $data['waktu_scan'],
                'lat' => $data['lat'] ?? null,
                'lng' => $data['lng'] ?? null,
                'device_info' => $data['device_info'] ?? null,
                'is_success' => $data['is_success'],
                'error_message' => $data['error_message'] ?? null,
                'created_at' => Carbon::now()
            ]);
        } catch (\Exception $e) {
            // Silent fail - logging should not break the main flow
            \Log::error('Failed to log scan: ' . $e->getMessage());
        }
    }
}