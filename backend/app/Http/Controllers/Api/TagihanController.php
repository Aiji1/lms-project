<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanController extends Controller
{
    /**
     * Dashboard Statistics untuk Petugas Keuangan
     */
    public function getDashboardStats(Request $request)
    {
        try {
            // Filter by tahun ajaran (optional)
            $tahunAjaranId = $request->input('id_tahun_ajaran');
            
            $query = DB::table('tagihan');
            
            if ($tahunAjaranId) {
                $query->where('id_tahun_ajaran', $tahunAjaranId);
            }
            
            // Total Tagihan - GUNAKAN nominal_tagihan
            $totalTagihan = $query->sum('nominal_tagihan');
            $jumlahTagihan = $query->count();
            
            // Sudah Bayar (Lunas)
            $sudahBayar = (clone $query)->where('status_tagihan', 'Lunas')->sum('nominal_tagihan');
            $jumlahSudahBayar = (clone $query)->where('status_tagihan', 'Lunas')->count();
            
            // Belum Bayar
            $belumBayar = (clone $query)->where('status_tagihan', 'Belum_Bayar')->sum('nominal_tagihan');
            $jumlahBelumBayar = (clone $query)->where('status_tagihan', 'Belum_Bayar')->count();
            
            // Overdue
            $overdue = (clone $query)->where('status_tagihan', 'Overdue')->sum('nominal_tagihan');
            $jumlahOverdue = (clone $query)->where('status_tagihan', 'Overdue')->count();
            
            // Cicilan
            $cicilan = (clone $query)->where('status_tagihan', 'Cicilan')->sum('nominal_tagihan');
            $jumlahCicilan = (clone $query)->where('status_tagihan', 'Cicilan')->count();
            
            // Pembayaran per bulan (last 12 months)
            $pembayaranPerBulan = DB::table('pembayaran')
                ->select(
                    DB::raw('MONTH(tanggal_bayar) as bulan'),
                    DB::raw('YEAR(tanggal_bayar) as tahun'),
                    DB::raw('SUM(jumlah_bayar) as total'),
                    DB::raw('COUNT(*) as jumlah')
                )
                ->where('status_pembayaran', 'Success')
                ->where('tanggal_bayar', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
                ->groupBy('tahun', 'bulan')
                ->orderBy('tahun', 'desc')
                ->orderBy('bulan', 'desc')
                ->get();
            
            // Tagihan per kelas - FIX dengan COLLATE
            $tagihanPerKelas = DB::select("
                SELECT 
                    k.nama_kelas,
                    COUNT(t.id_tagihan) as jumlah_tagihan,
                    SUM(t.nominal_tagihan) as total_nominal,
                    SUM(CASE WHEN t.status_tagihan = 'Lunas' THEN t.nominal_tagihan ELSE 0 END) as sudah_bayar,
                    SUM(CASE WHEN t.status_tagihan = 'Belum_Bayar' THEN t.nominal_tagihan ELSE 0 END) as belum_bayar
                FROM tagihan t
                INNER JOIN siswa s ON t.nis COLLATE utf8mb4_general_ci = s.nis
                INNER JOIN kelas k ON s.id_kelas = k.id_kelas
                GROUP BY k.id_kelas, k.nama_kelas
            ");

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_tagihan' => [
                            'nominal' => $totalTagihan,
                            'jumlah' => $jumlahTagihan
                        ],
                        'sudah_bayar' => [
                            'nominal' => $sudahBayar,
                            'jumlah' => $jumlahSudahBayar,
                            'persentase' => $totalTagihan > 0 ? round(($sudahBayar / $totalTagihan) * 100, 2) : 0
                        ],
                        'belum_bayar' => [
                            'nominal' => $belumBayar,
                            'jumlah' => $jumlahBelumBayar,
                            'persentase' => $totalTagihan > 0 ? round(($belumBayar / $totalTagihan) * 100, 2) : 0
                        ],
                        'cicilan' => [
                            'nominal' => $cicilan,
                            'jumlah' => $jumlahCicilan,
                            'persentase' => $totalTagihan > 0 ? round(($cicilan / $totalTagihan) * 100, 2) : 0
                        ],
                        'overdue' => [
                            'nominal' => $overdue,
                            'jumlah' => $jumlahOverdue,
                            'persentase' => $totalTagihan > 0 ? round(($overdue / $totalTagihan) * 100, 2) : 0
                        ]
                    ],
                    'chart_pembayaran' => $pembayaranPerBulan,
                    'tagihan_per_kelas' => $tagihanPerKelas
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $statusTagihan = $request->input('status_tagihan');
            $idKelas = $request->input('id_kelas');
            $bulanTagihan = $request->input('bulan_tagihan');
            $tahunTagihan = $request->input('tahun_tagihan');
            $idJenisPembayaran = $request->input('id_jenis_pembayaran');
            
            // Build WHERE clauses
            $whereClauses = [];
            $bindings = [];
            
            if ($search) {
                $whereClauses[] = "(t.nis LIKE ? OR s.nama_lengkap LIKE ?)";
                $bindings[] = "%{$search}%";
                $bindings[] = "%{$search}%";
            }
            
            if ($statusTagihan) {
                $whereClauses[] = "t.status_tagihan = ?";
                $bindings[] = $statusTagihan;
            }
            
            if ($idKelas) {
                $whereClauses[] = "s.id_kelas = ?";
                $bindings[] = $idKelas;
            }
            
            if ($bulanTagihan) {
                $whereClauses[] = "t.bulan_tagihan = ?";
                $bindings[] = $bulanTagihan;
            }
            
            if ($tahunTagihan) {
                $whereClauses[] = "t.tahun_tagihan = ?";
                $bindings[] = $tahunTagihan;
            }
            
            if ($idJenisPembayaran) {
                $whereClauses[] = "t.id_jenis_pembayaran = ?";
                $bindings[] = $idJenisPembayaran;
            }
            
            $whereSQL = count($whereClauses) > 0 ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
            
            // Count total
            $countSQL = "
                SELECT COUNT(*) as total
                FROM tagihan t
                LEFT JOIN siswa s ON t.nis COLLATE utf8mb4_general_ci = s.nis
                LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
                LEFT JOIN jurusan j ON k.id_jurusan = j.id_jurusan
                LEFT JOIN jenis_pembayaran jp ON t.id_jenis_pembayaran = jp.id_jenis_pembayaran
                LEFT JOIN tahun_ajaran ta ON t.id_tahun_ajaran = ta.id_tahun_ajaran
                {$whereSQL}
            ";
            
            $total = DB::select($countSQL, $bindings)[0]->total;
            
            // Get data with pagination
            $offset = ($perPage * (1)) - $perPage; // Page 1 default
            
            $dataSQL = "
                SELECT 
                    t.id_tagihan,
                    t.nis,
                    s.nama_lengkap as nama_siswa,
                    k.nama_kelas,
                    j.nama_jurusan,
                    t.id_jenis_pembayaran,
                    jp.nama_pembayaran as jenis_pembayaran,
                    t.bulan_tagihan,
                    t.tahun_tagihan,
                    t.nominal_tagihan,
                    t.tanggal_jatuh_tempo,
                    t.status_tagihan,
                    ta.tahun_ajaran,
                    t.keterangan
                FROM tagihan t
                LEFT JOIN siswa s ON t.nis COLLATE utf8mb4_general_ci = s.nis
                LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
                LEFT JOIN jurusan j ON k.id_jurusan = j.id_jurusan
                LEFT JOIN jenis_pembayaran jp ON t.id_jenis_pembayaran = jp.id_jenis_pembayaran
                LEFT JOIN tahun_ajaran ta ON t.id_tahun_ajaran = ta.id_tahun_ajaran
                {$whereSQL}
                ORDER BY 
                    CASE t.status_tagihan
                        WHEN 'Overdue' THEN 1
                        WHEN 'Belum_Bayar' THEN 2
                        WHEN 'Cicilan' THEN 3
                        WHEN 'Lunas' THEN 4
                    END,
                    t.tanggal_jatuh_tempo ASC
                LIMIT {$perPage} OFFSET {$offset}
            ";
            
            $tagihan = DB::select($dataSQL, $bindings);
            
            $lastPage = ceil($total / $perPage);
            
            return response()->json([
                'success' => true,
                'data' => $tagihan,
                'meta' => [
                    'current_page' => 1,
                    'last_page' => $lastPage,
                    'per_page' => $perPage,
                    'total' => $total,
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $total)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tagihan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Detail Tagihan by ID
     */
    public function show($id)
    {
        try {
            $tagihan = DB::select("
                SELECT 
                    t.*,
                    s.nama_lengkap as nama_siswa,
                    s.jenis_kelamin,
                    k.nama_kelas,
                    j.nama_jurusan,
                    jp.nama_pembayaran as jenis_pembayaran,
                    jp.deskripsi as deskripsi_jenis,
                    ta.tahun_ajaran
                FROM tagihan t
                LEFT JOIN siswa s ON t.nis COLLATE utf8mb4_general_ci = s.nis
                LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
                LEFT JOIN jurusan j ON k.id_jurusan = j.id_jurusan
                LEFT JOIN jenis_pembayaran jp ON t.id_jenis_pembayaran = jp.id_jenis_pembayaran
                LEFT JOIN tahun_ajaran ta ON t.id_tahun_ajaran = ta.id_tahun_ajaran
                WHERE t.id_tagihan = ?
                LIMIT 1
            ", [$id]);
            
            if (empty($tagihan)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tagihan tidak ditemukan'
                ], 404);
            }
            
            $tagihanData = $tagihan[0];
            
            // Get riwayat pembayaran
            $pembayaran = DB::table('pembayaran')
                ->where('id_tagihan', $id)
                ->orderBy('tanggal_bayar', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'tagihan' => $tagihanData,
                    'pembayaran' => $pembayaran
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail tagihan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tagihan by NIS (untuk siswa/orang tua)
     */
    public function getByNis($nis)
    {
        try {
            $tagihan = DB::table('tagihan as t')
                ->leftJoin('jenis_pembayaran as jp', 't.id_jenis_pembayaran', '=', 'jp.id_jenis_pembayaran')
                ->leftJoin('tahun_ajaran as ta', 't.id_tahun_ajaran', '=', 'ta.id')
                ->select(
                    't.id_tagihan',
                    'jp.nama_pembayaran as jenis_pembayaran',
                    't.bulan_tagihan',
                    't.tahun_tagihan',
                    't.nominal_tagihan',
                    't.tanggal_jatuh_tempo',
                    't.status_tagihan',
                    'ta.tahun_ajaran',
                    't.keterangan'
                )
                ->where('t.nis', $nis)
                ->orderBy('t.tahun_tagihan', 'desc')
                ->orderByRaw("CAST(t.bulan_tagihan AS UNSIGNED) DESC")
                ->get();
            
            // Calculate summary
            $totalTagihan = $tagihan->sum('nominal_tagihan');
            $sudahBayar = $tagihan->where('status_tagihan', 'Lunas')->sum('nominal_tagihan');
            $belumBayar = $tagihan->where('status_tagihan', 'Belum_Bayar')->sum('nominal_tagihan');
            $cicilan = $tagihan->where('status_tagihan', 'Cicilan')->sum('nominal_tagihan');
            $overdue = $tagihan->where('status_tagihan', 'Overdue')->sum('nominal_tagihan');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'tagihan' => $tagihan,
                    'summary' => [
                        'total' => $totalTagihan,
                        'sudah_bayar' => $sudahBayar,
                        'belum_bayar' => $belumBayar,
                        'cicilan' => $cicilan,
                        'overdue' => $overdue,
                        'sisa' => $belumBayar + $cicilan + $overdue
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil tagihan siswa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Konfirmasi Pembayaran
     */
    public function konfirmasiPembayaran(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'jumlah_bayar' => 'required|numeric|min:0',
            'tanggal_bayar' => 'required|date',
            'metode_pembayaran' => 'required|in:Tunai,Transfer,Kartu,E-wallet',
            'no_referensi' => 'nullable|string|max:100',
            'keterangan_cicilan' => 'nullable|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        try {
            // Get tagihan
            $tagihan = DB::table('tagihan')->where('id_tagihan', $id)->first();
            
            if (!$tagihan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tagihan tidak ditemukan'
                ], 404);
            }
            
            // Insert pembayaran
            $pembayaranId = DB::table('pembayaran')->insertGetId([
                'id_tagihan' => $id,
                'tanggal_bayar' => $request->tanggal_bayar,
                'jumlah_bayar' => $request->jumlah_bayar,
                'metode_pembayaran' => $request->metode_pembayaran,
                'status_pembayaran' => 'Success',
                'no_referensi' => $request->no_referensi,
                'keterangan_cicilan' => $request->keterangan_cicilan,
                'id_user_petugas' => null
            ]);
            
            // Get total pembayaran
            $totalBayar = DB::table('pembayaran')
                ->where('id_tagihan', $id)
                ->where('status_pembayaran', 'Success')
                ->sum('jumlah_bayar');
            
            // Update status tagihan
            $statusBaru = 'Belum_Bayar';
            if ($totalBayar >= $tagihan->nominal_tagihan) {
                $statusBaru = 'Lunas';
            } else if ($totalBayar > 0) {
                $statusBaru = 'Cicilan';
            }
            
            DB::table('tagihan')
                ->where('id_tagihan', $id)
                ->update(['status_tagihan' => $statusBaru]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dikonfirmasi',
                'data' => [
                    'id_pembayaran' => $pembayaranId,
                    'status_tagihan' => $statusBaru,
                    'total_terbayar' => $totalBayar,
                    'sisa' => $tagihan->nominal_tagihan - $totalBayar
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengkonfirmasi pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getFormData(Request $request)
    {
        try {
            // Kelas - fix semua primary key
            $kelas = DB::select("
                SELECT kelas.id_kelas as id, kelas.nama_kelas, jurusan.nama_jurusan
                FROM kelas
                LEFT JOIN jurusan ON kelas.id_jurusan = jurusan.id_jurusan
                ORDER BY kelas.nama_kelas
            ");
            
            // Jenis Pembayaran
            $jenisPembayaran = DB::table('jenis_pembayaran')
                ->select('id_jenis_pembayaran as id', 'kode', 'nama_pembayaran as nama')
                ->where('is_active', 1)
                ->orderBy('nama_pembayaran')
                ->get();
            
            // Status Tagihan
            $statusTagihan = [
                ['value' => 'Belum_Bayar', 'label' => 'Belum Bayar'],
                ['value' => 'Cicilan', 'label' => 'Cicilan'],
                ['value' => 'Lunas', 'label' => 'Lunas'],
                ['value' => 'Overdue', 'label' => 'Terlambat']
            ];
            
            // Bulan
            $bulan = [
                ['value' => '01', 'label' => 'Januari'],
                ['value' => '02', 'label' => 'Februari'],
                ['value' => '03', 'label' => 'Maret'],
                ['value' => '04', 'label' => 'April'],
                ['value' => '05', 'label' => 'Mei'],
                ['value' => '06', 'label' => 'Juni'],
                ['value' => '07', 'label' => 'Juli'],
                ['value' => '08', 'label' => 'Agustus'],
                ['value' => '09', 'label' => 'September'],
                ['value' => '10', 'label' => 'Oktober'],
                ['value' => '11', 'label' => 'November'],
                ['value' => '12', 'label' => 'Desember']
            ];
            
            // Metode Pembayaran
            $metodePembayaran = [
                ['value' => 'Tunai', 'label' => 'Tunai'],
                ['value' => 'Transfer', 'label' => 'Transfer Bank'],
                ['value' => 'Kartu', 'label' => 'Kartu Debit/Kredit'],
                ['value' => 'E-wallet', 'label' => 'E-Wallet (OVO/DANA/dll)']
            ];
            
            return response()->json([
                'success' => true,
                'data' => [
                    'kelas' => $kelas,
                    'jenis_pembayaran' => $jenisPembayaran,
                    'status_tagihan' => $statusTagihan,
                    'bulan' => $bulan,
                    'metode_pembayaran' => $metodePembayaran
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil form data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Pivot View - Siswa di row, Jenis Pembayaran di column
     */
    public function getPivotView(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 20);
            $search = $request->input('search');
            $idKelas = $request->input('id_kelas');
            $tahunTagihan = $request->input('tahun_tagihan', date('Y'));
            $page = $request->input('page', 1);
            
            // Get active jenis pembayaran
            $jenisPembayaranList = DB::table('jenis_pembayaran')
                ->select('id_jenis_pembayaran', 'nama_pembayaran', 'kode')
                ->where('is_active', 1)
                ->orderBy('nama_pembayaran')
                ->get();
            
            // Build WHERE for siswa
            $whereClauses = ['s.status = ?'];
            $bindings = ['Aktif'];
            
            if ($search) {
                $whereClauses[] = "(s.nis LIKE ? OR s.nama_lengkap LIKE ?)";
                $bindings[] = "%{$search}%";
                $bindings[] = "%{$search}%";
            }
            
            if ($idKelas) {
                $whereClauses[] = "s.id_kelas = ?";
                $bindings[] = $idKelas;
            }
            
            $whereSQL = 'WHERE ' . implode(' AND ', $whereClauses);
            
            // Count total siswa
            $countSQL = "
                SELECT COUNT(*) as total
                FROM siswa s
                LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
                LEFT JOIN jurusan j ON k.id_jurusan = j.id_jurusan
                {$whereSQL}
            ";
            
            $total = DB::select($countSQL, $bindings)[0]->total;
            
            // Get siswa with pagination
            $offset = ($page - 1) * $perPage;
            
            $siswaSQL = "
                SELECT 
                    s.nis,
                    s.nama_lengkap,
                    k.nama_kelas,
                    j.nama_jurusan
                FROM siswa s
                LEFT JOIN kelas k ON s.id_kelas = k.id_kelas
                LEFT JOIN jurusan j ON k.id_jurusan = j.id_jurusan
                {$whereSQL}
                ORDER BY k.nama_kelas, s.nama_lengkap
                LIMIT {$perPage} OFFSET {$offset}
            ";
            
            $siswaList = DB::select($siswaSQL, $bindings);
            
            // Get all tagihan for these siswa
            $nisArray = array_map(fn($s) => $s->nis, $siswaList);
            
            if (empty($nisArray)) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'siswa' => [],
                        'jenis_pembayaran' => $jenisPembayaranList,
                        'tagihan_map' => []
                    ],
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0
                    ]
                ]);
            }
            
            $nisList = implode(',', array_map(fn($nis) => "'$nis'", $nisArray));
            
            $tagihanSQL = "
                SELECT 
                    t.nis,
                    t.id_jenis_pembayaran,
                    t.id_tagihan,
                    t.bulan_tagihan,
                    t.tahun_tagihan,
                    t.nominal_tagihan,
                    t.status_tagihan,
                    t.tanggal_jatuh_tempo
                FROM tagihan t
                WHERE t.nis IN ({$nisList})
                AND t.tahun_tagihan = ?
            ";
            
            $tagihanList = DB::select($tagihanSQL, [$tahunTagihan]);
            
            // Map tagihan: nis -> jenis_pembayaran_id -> tagihan data
            $tagihanMap = [];
            foreach ($tagihanList as $tagihan) {
                $key = $tagihan->nis . '_' . $tagihan->id_jenis_pembayaran;
                if (!isset($tagihanMap[$key])) {
                    $tagihanMap[$key] = [];
                }
                $tagihanMap[$key][] = $tagihan;
            }
            
            // Build result with pivot structure
            $result = [];
            foreach ($siswaList as $siswa) {
                $siswaData = [
                    'nis' => $siswa->nis,
                    'nama_lengkap' => $siswa->nama_lengkap,
                    'nama_kelas' => $siswa->nama_kelas,
                    'nama_jurusan' => $siswa->nama_jurusan,
                    'tagihan' => []
                ];
                
                foreach ($jenisPembayaranList as $jp) {
                    $key = $siswa->nis . '_' . $jp->id_jenis_pembayaran;
                    $siswaData['tagihan'][$jp->id_jenis_pembayaran] = $tagihanMap[$key] ?? null;
                }
                
                $result[] = $siswaData;
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'siswa' => $result,
                    'jenis_pembayaran' => $jenisPembayaranList
                ],
                'meta' => [
                    'current_page' => (int)$page,
                    'last_page' => (int)ceil($total / $perPage),
                    'per_page' => (int)$perPage,
                    'total' => (int)$total,
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $total)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pivot view',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Pembayaran Summary untuk multiple tagihan
     */
    public function getPembayaranSummary(Request $request)
    {
        try {
            $tagihanIds = $request->input('tagihan_ids', []);
            
            if (empty($tagihanIds)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Get pembayaran for all tagihan
            $idsList = implode(',', array_map('intval', $tagihanIds));
            
            $pembayaran = DB::select("
                SELECT 
                    id_tagihan,
                    SUM(CASE WHEN status_pembayaran = 'Success' THEN jumlah_bayar ELSE 0 END) as total_terbayar,
                    COUNT(CASE WHEN status_pembayaran = 'Success' THEN 1 END) as jumlah_pembayaran
                FROM pembayaran
                WHERE id_tagihan IN ({$idsList})
                GROUP BY id_tagihan
            ");
            
            // Convert to associative array
            $result = [];
            foreach ($pembayaran as $p) {
                $result[$p->id_tagihan] = [
                    'total_terbayar' => (float)$p->total_terbayar,
                    'jumlah_pembayaran' => (int)$p->jumlah_pembayaran
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil pembayaran summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create (store) - Placeholder
     */
    public function store(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Untuk membuat tagihan, gunakan fitur Generate Tagihan dari menu Jenis Pembayaran'
        ], 400);
    }

    /**
     * Update tagihan manual
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nominal_tagihan' => 'sometimes|numeric|min:0',
            'tanggal_jatuh_tempo' => 'sometimes|date',
            'status_tagihan' => 'sometimes|in:Belum_Bayar,Cicilan,Lunas,Overdue',
            'keterangan' => 'nullable|string'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            $updated = DB::table('tagihan')
                ->where('id_tagihan', $id)
                ->update($request->only(['nominal_tagihan', 'tanggal_jatuh_tempo', 'status_tagihan', 'keterangan']));
            
            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tagihan tidak ditemukan'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tagihan berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui tagihan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete tagihan
     */
    public function destroy($id)
    {
        try {
            // Check if has pembayaran
            $hasPembayaran = DB::table('pembayaran')->where('id_tagihan', $id)->exists();
            
            if ($hasPembayaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus tagihan yang sudah memiliki riwayat pembayaran'
                ], 400);
            }
            
            $deleted = DB::table('tagihan')->where('id_tagihan', $id)->delete();
            
            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tagihan tidak ditemukan'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Tagihan berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus tagihan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}