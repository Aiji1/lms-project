<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TugasAdab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TugasAdabController extends Controller
{
    /**
     * Display a listing of tugas adab
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $tahunAjaran = $request->get('tahun_ajaran', '');
            $status = $request->get('status', '');

            $query = DB::table('tugas_adab')
                ->leftJoin('tahun_ajaran', 'tugas_adab.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select([
                    'tugas_adab.id_tugas_adab',
                    'tugas_adab.nama_tugas',
                    'tugas_adab.deskripsi_tugas',
                    'tugas_adab.id_tahun_ajaran',
                    'tugas_adab.status',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester'
                ]);

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('tugas_adab.nama_tugas', 'LIKE', "%{$search}%")
                      ->orWhere('tugas_adab.deskripsi_tugas', 'LIKE', "%{$search}%");
                });
            }

            // Tahun ajaran filter
            if (!empty($tahunAjaran)) {
                $query->where('tugas_adab.id_tahun_ajaran', $tahunAjaran);
            }

            // Status filter
            if (!empty($status)) {
                $query->where('tugas_adab.status', $status);
            }

            // Order by newest first
            $query->orderBy('tugas_adab.id_tugas_adab', 'desc');

            // Pagination
            $total = $query->count();
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data tugas adab berhasil diambil',
                'data' => $data->items(),
                'meta' => [
                    'current_page' => $data->currentPage(),
                    'last_page' => $data->lastPage(),
                    'per_page' => $data->perPage(),
                    'total' => $data->total(),
                    'from' => $data->firstItem(),
                    'to' => $data->lastItem()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tugas adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created tugas adab
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_tugas' => 'required|string|max:200',
            'deskripsi_tugas' => 'required|string',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'status' => 'required|in:Aktif,Non-aktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if tugas with same name already exists for the same tahun ajaran
            $existingTugas = DB::table('tugas_adab')
                ->where('nama_tugas', $request->nama_tugas)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->exists();

            if ($existingTugas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab dengan nama "' . $request->nama_tugas . '" sudah ada untuk tahun ajaran ini'
                ], 422);
            }

            $tugasAdabId = DB::table('tugas_adab')->insertGetId([
                'nama_tugas' => $request->nama_tugas,
                'deskripsi_tugas' => $request->deskripsi_tugas,
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'status' => $request->status
            ]);

            $tugasAdab = DB::table('tugas_adab')
                ->leftJoin('tahun_ajaran', 'tugas_adab.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select([
                    'tugas_adab.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester'
                ])
                ->where('tugas_adab.id_tugas_adab', $tugasAdabId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Tugas adab berhasil ditambahkan',
                'data' => $tugasAdab
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan tugas adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified tugas adab
     */
    public function show($id)
    {
        try {
            $tugasAdab = DB::table('tugas_adab')
                ->leftJoin('tahun_ajaran', 'tugas_adab.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select([
                    'tugas_adab.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester'
                ])
                ->where('tugas_adab.id_tugas_adab', $id)
                ->first();

            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            // Get monitoring statistics
            $monitoringStats = $this->getMonitoringStats($id);

            return response()->json([
                'success' => true,
                'message' => 'Data tugas adab berhasil diambil',
                'data' => $tugasAdab,
                'monitoring_stats' => $monitoringStats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tugas adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified tugas adab
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama_tugas' => 'required|string|max:200',
            'deskripsi_tugas' => 'required|string',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'status' => 'required|in:Aktif,Non-aktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if tugas adab exists
            $tugasAdab = DB::table('tugas_adab')->where('id_tugas_adab', $id)->first();
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            // Check if tugas with same name already exists for the same tahun ajaran (excluding current record)
            $existingTugas = DB::table('tugas_adab')
                ->where('nama_tugas', $request->nama_tugas)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_tugas_adab', '!=', $id)
                ->exists();

            if ($existingTugas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab dengan nama "' . $request->nama_tugas . '" sudah ada untuk tahun ajaran ini'
                ], 422);
            }

            DB::table('tugas_adab')
                ->where('id_tugas_adab', $id)
                ->update([
                    'nama_tugas' => $request->nama_tugas,
                    'deskripsi_tugas' => $request->deskripsi_tugas,
                    'id_tahun_ajaran' => $request->id_tahun_ajaran,
                    'status' => $request->status
                ]);

            $updatedTugasAdab = DB::table('tugas_adab')
                ->leftJoin('tahun_ajaran', 'tugas_adab.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select([
                    'tugas_adab.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester'
                ])
                ->where('tugas_adab.id_tugas_adab', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Tugas adab berhasil diperbarui',
                'data' => $updatedTugasAdab
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui tugas adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified tugas adab
     */
    public function destroy($id)
    {
        try {
            // Check if tugas adab exists
            $tugasAdab = DB::table('tugas_adab')->where('id_tugas_adab', $id)->first();
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            // Check if there are monitoring records
            $hasMonitoring = DB::table('monitoring_adab')
                ->where('id_tugas_adab', $id)
                ->exists();

            if ($hasMonitoring) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus tugas adab karena sudah ada data monitoring'
                ], 422);
            }

            DB::table('tugas_adab')->where('id_tugas_adab', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tugas adab berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus tugas adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for creating/editing tugas adab
     */
    public function getFormData()
    {
        try {
            $tahunAjaran = DB::table('tahun_ajaran')
                ->select('id_tahun_ajaran', 'tahun_ajaran', 'semester', 'status')
                ->orderBy('id_tahun_ajaran', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Data form berhasil diambil',
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'status_options' => ['Aktif', 'Non-aktif']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get monitoring statistics for a specific tugas adab
     */
    public function getMonitoringStats($id)
    {
        try {
            $tugasAdab = TugasAdab::find($id);
            
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            $stats = $this->calculateMonitoringStats($id);

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil statistik monitoring',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed monitoring data for a specific tugas adab
     */
    public function getMonitoringDetails($id)
    {
        try {
            $tugasAdab = TugasAdab::find($id);
            
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            // Optional filters via query params
            $req = request();
            $tanggalFilter = $req->get('tanggal');
            $kelasFilter = $req->get('kelas');

            // Role-based restriction: siswa hanya boleh melihat data kelasnya sendiri
            $currentUser = $req->attributes->get('authenticated_user');
            if ($currentUser && $currentUser->user_type === 'Siswa') {
                $student = DB::table('siswa')->where('nis', $currentUser->reference_id)->first();
                if ($student) {
                    // Force kelas filter to student's class
                    $kelasFilter = $student->id_kelas;
                }
            }

            // Get all students with their monitoring status
            $monitoringDetails = DB::table('siswa')
                ->leftJoin('monitoring_adab', function($join) use ($id) {
                    $join->on('siswa.nis', '=', 'monitoring_adab.nis')
                         ->where('monitoring_adab.id_tugas_adab', '=', $id);
                })
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap as nama',
                    'kelas.nama_kelas',
                    'monitoring_adab.status_dilaksanakan',
                    'monitoring_adab.tanggal'
                )
                ->when(!empty($tanggalFilter), function($q) use ($tanggalFilter) {
                    return $q->where('monitoring_adab.tanggal', $tanggalFilter);
                })
                ->when(!empty($kelasFilter), function($q) use ($kelasFilter) {
                    return $q->where('siswa.id_kelas', $kelasFilter);
                })
                ->orderBy('kelas.nama_kelas')
                ->orderBy('siswa.nama_lengkap')
                ->get();

            // Transform data to include default status for students without monitoring records
            $details = $monitoringDetails->map(function($item) {
                return [
                    'id_siswa' => $item->nis,
                    'nama_siswa' => $item->nama,
                    'nis' => $item->nis,
                    'kelas' => $item->nama_kelas,
                    'status_pelaksanaan' => $item->status_dilaksanakan ?? 'Belum Dimonitor',
                    'tanggal_monitoring' => $item->tanggal
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $details
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail monitoring',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate monitoring statistics for a tugas adab
     */
    private function calculateMonitoringStats($tugasAdabId)
    {
        try {
            // Get total siswa aktif
            $totalSiswa = DB::table('siswa')
                ->where('status', 'Aktif')
                ->count();

            // Get siswa yang melaksanakan tugas
            $siswamelaksanakan = DB::table('monitoring_adab')
                ->where('id_tugas_adab', $tugasAdabId)
                ->where('status_dilaksanakan', 'Ya')
                ->count();

            // Get siswa yang tidak melaksanakan tugas
            $siswaTidakMelaksanakan = DB::table('monitoring_adab')
                ->where('id_tugas_adab', $tugasAdabId)
                ->where('status_dilaksanakan', 'Tidak')
                ->count();

            // Calculate percentage
            $persentaseKepatuhan = $totalSiswa > 0 ? round(($siswamelaksanakan / $totalSiswa) * 100, 2) : 0;

            return [
                'total_siswa' => $totalSiswa,
                'siswa_melaksanakan' => $siswamelaksanakan,
                'siswa_tidak_melaksanakan' => $siswaTidakMelaksanakan,
                'persentase_kepatuhan' => $persentaseKepatuhan
            ];

        } catch (\Exception $e) {
            return [
                'total_siswa' => 0,
                'siswa_melaksanakan' => 0,
                'siswa_tidak_melaksanakan' => 0,
                'persentase_kepatuhan' => 0
            ];
        }
    }

    /**
     * Submit monitoring input for a specific tugas adab
     */
    public function submitMonitoring(Request $request, $id)
    {
        // Validate input: support both bulk (entries) and single entry (nis, status_dilaksanakan)
        $hasEntries = $request->has('entries');
        if ($hasEntries) {
            $validator = Validator::make($request->all(), [
                'tanggal' => 'required|date',
                'entries' => 'required|array|min:1',
                'entries.*.nis' => 'required|exists:siswa,nis',
                'entries.*.status_dilaksanakan' => 'required|in:Ya,Tidak'
            ]);
        } else {
            $validator = Validator::make($request->all(), [
                'tanggal' => 'required|date',
                'nis' => 'required|exists:siswa,nis',
                'status_dilaksanakan' => 'required|in:Ya,Tidak'
            ]);
        }

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Role-based enforcement
            $currentUser = $request->attributes->get('authenticated_user');
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Check tugas adab exists
            $tugasAdab = DB::table('tugas_adab')->where('id_tugas_adab', $id)->first();
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            $tanggal = $request->tanggal;
            $idTahunAjaran = $tugasAdab->id_tahun_ajaran;
            $entries = $hasEntries ? $request->entries : [
                [
                    'nis' => $request->nis,
                    'status_dilaksanakan' => $request->status_dilaksanakan
                ]
            ];

            // If user is Siswa, only allow submitting for their own NIS
            if ($currentUser->user_type === 'Siswa') {
                $allowedNis = (string) $currentUser->reference_id;
                foreach ($entries as $entry) {
                    if ((string) $entry['nis'] !== $allowedNis) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Siswa hanya dapat mengirim status untuk dirinya sendiri'
                        ], 403);
                    }
                }
                // Prevent bulk submit by siswa (ensure single entry)
                if (count($entries) > 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Siswa hanya dapat mengirim satu entri untuk dirinya sendiri'
                    ], 403);
                }
            } else if (!in_array($currentUser->user_type, ['Admin', 'Guru'])) {
                // Only Admin/Guru can submit for multiple students
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak diizinkan untuk mengirim monitoring'
                ], 403);
            }

            $saved = 0;
            foreach ($entries as $entry) {
                $nis = $entry['nis'];
                $status = $entry['status_dilaksanakan'];

                // Upsert monitoring record based on unique keys (nis, id_tugas_adab, tanggal)
                $updated = DB::table('monitoring_adab')->updateOrInsert(
                    [
                        'nis' => $nis,
                        'id_tugas_adab' => $id,
                        'tanggal' => $tanggal
                    ],
                    [
                        'id_tahun_ajaran' => $idTahunAjaran,
                        'status_dilaksanakan' => $status
                    ]
                );

                if ($updated) {
                    $saved++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Monitoring adab berhasil disimpan',
                'data' => [
                    'processed' => count($entries),
                    'saved' => $saved
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan monitoring adab',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recap harian per kelas untuk tugas adab tertentu
     * Query params: tanggal (required, Y-m-d), kelas (optional, id_kelas)
     */
    public function getDailyRecapByClass($id)
    {
        try {
            // Only Admin/Guru can access recap per kelas
            $req = request();
            $currentUser = $req->attributes->get('authenticated_user');
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            if (!in_array($currentUser->user_type, ['Admin', 'Guru'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru atau admin yang dapat mengakses rekap harian'
                ], 403);
            }

            $tugasAdab = TugasAdab::find($id);
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            $req = request();
            $tanggal = $req->get('tanggal');
            $kelasFilter = $req->get('kelas');

            if (empty($tanggal)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tanggal wajib diisi (format Y-m-d)'
                ], 422);
            }

            // Total siswa aktif per kelas
            $totalByClass = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('siswa.id_kelas', $kelasFilter);
                })
                ->select([
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    DB::raw('COUNT(siswa.nis) as total_siswa')
                ])
                ->groupBy('kelas.id_kelas', 'kelas.nama_kelas')
                ->get()
                ->keyBy('id_kelas');

            // Monitoring counts per kelas pada tanggal tertentu
            $monByClass = DB::table('monitoring_adab')
                ->join('siswa', 'monitoring_adab.nis', '=', 'siswa.nis')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('monitoring_adab.id_tugas_adab', $id)
                ->where('monitoring_adab.tanggal', $tanggal)
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select([
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    DB::raw("SUM(CASE WHEN monitoring_adab.status_dilaksanakan = 'Ya' THEN 1 ELSE 0 END) as melaksanakan"),
                    DB::raw("SUM(CASE WHEN monitoring_adab.status_dilaksanakan = 'Tidak' THEN 1 ELSE 0 END) as tidak_melaksanakan"),
                    DB::raw('COUNT(monitoring_adab.nis) as total_input')
                ])
                ->groupBy('kelas.id_kelas', 'kelas.nama_kelas')
                ->get()
                ->keyBy('id_kelas');

            // Merge dan hitung persentase
            $recap = [];
            foreach ($totalByClass as $idKelas => $row) {
                $mon = $monByClass->get($idKelas);
                $melaksanakan = $mon->melaksanakan ?? 0;
                $tidak = $mon->tidak_melaksanakan ?? 0;
                $totalSiswa = (int) $row->total_siswa;
                $persentase = $totalSiswa > 0 ? round(($melaksanakan / $totalSiswa) * 100, 2) : 0;

                $recap[] = [
                    'id_kelas' => $idKelas,
                    'nama_kelas' => $row->nama_kelas,
                    'total_siswa' => $totalSiswa,
                    'siswa_melaksanakan' => (int) $melaksanakan,
                    'siswa_tidak_melaksanakan' => (int) $tidak,
                    'persentase_kepatuhan' => $persentase,
                    'tanggal' => $tanggal,
                    'id_tugas_adab' => (int) $id,
                ];
            }

            // Urutkan berdasarkan nama kelas
            usort($recap, function ($a, $b) {
                return strcmp($a['nama_kelas'], $b['nama_kelas']);
            });

            return response()->json([
                'success' => true,
                'data' => $recap
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil recap harian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export rekap monitoring bulanan (opsional filter kelas)
     * Query params: year, month, kelas (optional id_kelas)
     */
    public function exportMonitoringMonthly(Request $request, $id)
    {
        try {
            // Only Admin/Guru can export data
            $currentUser = $request->attributes->get('authenticated_user');
            if (!$currentUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            if (!in_array($currentUser->user_type, ['Admin', 'Guru'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru atau admin yang dapat mengekspor data'
                ], 403);
            }

            $tugasAdab = TugasAdab::find($id);
            if (!$tugasAdab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas adab tidak ditemukan'
                ], 404);
            }

            $year = (int) $request->get('year', date('Y'));
            $month = (int) $request->get('month', date('n'));
            $kelasFilter = $request->get('kelas');

            // Total siswa aktif per kelas (map)
            $totalByClass = DB::table('siswa')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('siswa.status', 'Aktif')
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select([
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    DB::raw('COUNT(siswa.nis) as total_siswa')
                ])
                ->groupBy('kelas.id_kelas', 'kelas.nama_kelas')
                ->get()
                ->keyBy('id_kelas');

            // Monitoring per tanggal per kelas untuk bulan & tahun
            $data = DB::table('monitoring_adab')
                ->join('siswa', 'monitoring_adab.nis', '=', 'siswa.nis')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->where('monitoring_adab.id_tugas_adab', $id)
                ->whereYear('monitoring_adab.tanggal', $year)
                ->whereMonth('monitoring_adab.tanggal', $month)
                ->when(!empty($kelasFilter), function ($q) use ($kelasFilter) {
                    return $q->where('kelas.id_kelas', $kelasFilter);
                })
                ->select([
                    'monitoring_adab.tanggal',
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    DB::raw("SUM(CASE WHEN monitoring_adab.status_dilaksanakan = 'Ya' THEN 1 ELSE 0 END) as melaksanakan"),
                    DB::raw("SUM(CASE WHEN monitoring_adab.status_dilaksanakan = 'Tidak' THEN 1 ELSE 0 END) as tidak_melaksanakan"),
                    DB::raw('COUNT(monitoring_adab.nis) as total_input')
                ])
                ->groupBy('monitoring_adab.tanggal', 'kelas.id_kelas', 'kelas.nama_kelas')
                ->orderBy('monitoring_adab.tanggal', 'asc')
                ->orderBy('kelas.nama_kelas', 'asc')
                ->get();

            // Buat file Excel
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Header
            $headers = [
                'Tanggal',
                'Nama Tugas',
                'Kelas',
                'Total Siswa Aktif',
                'Melaksanakan',
                'Tidak Melaksanakan',
                'Persentase Kepatuhan (%)'
            ];
            $sheet->fromArray($headers, null, 'A1');

            // Style header
            $headerStyle = [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E3F2FD']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN
                    ]
                ]
            ];
            $sheet->getStyle('A1:G1')->applyFromArray($headerStyle);

            // Isi baris
            $row = 2;
            foreach ($data as $item) {
                $totalSiswa = isset($totalByClass[$item->id_kelas]) ? (int) $totalByClass[$item->id_kelas]->total_siswa : 0;
                $melaksanakan = (int) $item->melaksanakan;
                $persen = $totalSiswa > 0 ? round(($melaksanakan / $totalSiswa) * 100, 2) : 0;

                $sheet->setCellValue('A' . $row, date('d/m/Y', strtotime($item->tanggal)));
                $sheet->setCellValue('B' . $row, $tugasAdab->nama_tugas);
                $sheet->setCellValue('C' . $row, $item->nama_kelas);
                $sheet->setCellValue('D' . $row, $totalSiswa);
                $sheet->setCellValue('E' . $row, $melaksanakan);
                $sheet->setCellValue('F' . $row, (int) $item->tidak_melaksanakan);
                $sheet->setCellValue('G' . $row, $persen);
                $row++;
            }

            // Auto-size kolom
            foreach (range('A', 'G') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            if ($row > 2) {
                $sheet->getStyle('A1:G' . ($row - 1))->getBorders()->getAllBorders()
                    ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
            }

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

            $monthNames = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];

            $filename = 'Monitoring_Adab_' . $tugasAdab->nama_tugas . '_' . ($monthNames[$month] ?? $month) . '_' . $year . '.xlsx';

            return response()->stream(
                function () use ($writer) {
                    $writer->save('php://output');
                },
                200,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'max-age=0',
                ]
            );
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengekspor data monitoring adab: ' . $e->getMessage()
            ], 500);
        }
    }
}