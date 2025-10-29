<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JadwalPelajaranController extends Controller
{
    /**
     * Display a listing of jadwal pelajaran
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search', '');
            $tahunAjaran = $request->get('tahun_ajaran', '');
            $kelas = $request->get('kelas', '');
            $hari = $request->get('hari', '');
            $guru = $request->get('guru', '');

            // Get current user from token
            $currentUser = null;
            $token = $request->bearerToken();
            if ($token) {
                $currentUser = DB::table('users')
                    ->where('remember_token', $token)
                    ->where('status', 'Aktif')
                    ->first();
            }
            
            $query = DB::table('jadwal_pelajaran')
                ->leftJoin('tahun_ajaran', 'jadwal_pelajaran.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('guru', 'jadwal_pelajaran.nik_guru', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                ->select([
                    'jadwal_pelajaran.id_jadwal',
                    'jadwal_pelajaran.id_tahun_ajaran',
                    'jadwal_pelajaran.id_mata_pelajaran',
                    'jadwal_pelajaran.nik_guru',
                    'jadwal_pelajaran.id_kelas',
                    'jadwal_pelajaran.hari',
                    'jadwal_pelajaran.jam_ke',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas',
                    'kelas.tingkat'
                ]);

            // Role-based filtering: Semua guru bisa melihat semua jadwal
            // Komentar: Filter role-based dihapus agar semua guru bisa melihat semua jadwal
            // if ($currentUser && $currentUser->user_type === 'Guru') {
            //     $query->where('jadwal_pelajaran.nik_guru', $currentUser->reference_id);
            // }

            // Search filter
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('mata_pelajaran.nama_mata_pelajaran', 'LIKE', "%{$search}%")
                      ->orWhere('guru.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('kelas.nama_kelas', 'LIKE', "%{$search}%");
                });
            }

            // Tahun ajaran filter
            if (!empty($tahunAjaran)) {
                $query->where('jadwal_pelajaran.id_tahun_ajaran', $tahunAjaran);
            }

            // Kelas filter
            if (!empty($kelas)) {
                $query->where('jadwal_pelajaran.id_kelas', $kelas);
            }

            // Hari filter
            if (!empty($hari)) {
                $query->where('jadwal_pelajaran.hari', $hari);
            }

            // Guru filter
            if (!empty($guru)) {
                $query->where('jadwal_pelajaran.nik_guru', $guru);
            }

            // Order by hari, jam_ke, and kelas
            $query->orderByRaw("FIELD(jadwal_pelajaran.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')")
                  ->orderBy('jadwal_pelajaran.jam_ke', 'asc')
                  ->orderBy('kelas.nama_kelas', 'asc');

            // Pagination
            $totalData = $query->count();
            $jadwalPelajaran = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data jadwal pelajaran berhasil diambil',
                'data' => [
                    'data' => $jadwalPelajaran->items(),
                    'current_page' => $jadwalPelajaran->currentPage(),
                    'per_page' => $jadwalPelajaran->perPage(),
                    'total' => $jadwalPelajaran->total(),
                    'last_page' => $jadwalPelajaran->lastPage(),
                    'from' => $jadwalPelajaran->firstItem(),
                    'to' => $jadwalPelajaran->lastItem()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jadwal pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created jadwal pelajaran
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'nik_guru' => 'required|string|exists:guru,nik_guru',
                'id_kelas' => 'required|integer|exists:kelas,id_kelas',
                'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat',
                'jam_ke' => 'required|in:1,2,3,4,5,6,7,8,9,10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if jadwal already exists for the same kelas, hari, and jam_ke
            $existingJadwal = DB::table('jadwal_pelajaran')
                ->where('id_kelas', $request->id_kelas)
                ->where('hari', $request->hari)
                ->where('jam_ke', $request->jam_ke)
                ->exists();

            if ($existingJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal untuk kelas ini pada hari dan jam yang sama sudah ada'
                ], 422);
            }

            // Check if guru already has jadwal at the same time
            $existingGuruJadwal = DB::table('jadwal_pelajaran')
                ->where('nik_guru', $request->nik_guru)
                ->where('hari', $request->hari)
                ->where('jam_ke', $request->jam_ke)
                ->exists();

            if ($existingGuruJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guru sudah memiliki jadwal mengajar pada hari dan jam yang sama'
                ], 422);
            }

            $jadwalId = DB::table('jadwal_pelajaran')->insertGetId([
                'id_tahun_ajaran' => $request->id_tahun_ajaran,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'nik_guru' => $request->nik_guru,
                'id_kelas' => $request->id_kelas,
                'hari' => $request->hari,
                'jam_ke' => $request->jam_ke
            ]);

            $jadwal = DB::table('jadwal_pelajaran')
                ->leftJoin('tahun_ajaran', 'jadwal_pelajaran.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('guru', 'jadwal_pelajaran.nik_guru', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                ->select([
                    'jadwal_pelajaran.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas',
                    'kelas.tingkat'
                ])
                ->where('jadwal_pelajaran.id_jadwal', $jadwalId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal pelajaran berhasil ditambahkan',
                'data' => $jadwal
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jadwal pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified jadwal pelajaran
     */
    public function show($id)
    {
        try {
            $jadwal = DB::table('jadwal_pelajaran')
                ->leftJoin('tahun_ajaran', 'jadwal_pelajaran.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('guru', 'jadwal_pelajaran.nik_guru', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                ->select([
                    'jadwal_pelajaran.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas',
                    'kelas.tingkat'
                ])
                ->where('jadwal_pelajaran.id_jadwal', $id)
                ->first();

            if (!$jadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal pelajaran tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data jadwal pelajaran berhasil diambil',
                'data' => $jadwal
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jadwal pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified jadwal pelajaran
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'nik_guru' => 'required|string|exists:guru,nik_guru',
                'id_kelas' => 'required|integer|exists:kelas,id_kelas',
                'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat',
                'jam_ke' => 'required|in:1,2,3,4,5,6,7,8,9,10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if jadwal exists
            $existingJadwal = DB::table('jadwal_pelajaran')
                ->where('id_jadwal', $id)
                ->first();

            if (!$existingJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal pelajaran tidak ditemukan'
                ], 404);
            }

            // Check if jadwal already exists for the same kelas, hari, and jam_ke (excluding current record)
            $conflictJadwal = DB::table('jadwal_pelajaran')
                ->where('id_kelas', $request->id_kelas)
                ->where('hari', $request->hari)
                ->where('jam_ke', $request->jam_ke)
                ->where('id_jadwal', '!=', $id)
                ->exists();

            if ($conflictJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal untuk kelas ini pada hari dan jam yang sama sudah ada'
                ], 422);
            }

            // Check if guru already has jadwal at the same time (excluding current record)
            $conflictGuruJadwal = DB::table('jadwal_pelajaran')
                ->where('nik_guru', $request->nik_guru)
                ->where('hari', $request->hari)
                ->where('jam_ke', $request->jam_ke)
                ->where('id_jadwal', '!=', $id)
                ->exists();

            if ($conflictGuruJadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guru sudah memiliki jadwal mengajar pada hari dan jam yang sama'
                ], 422);
            }

            DB::table('jadwal_pelajaran')
                ->where('id_jadwal', $id)
                ->update([
                    'id_tahun_ajaran' => $request->id_tahun_ajaran,
                    'id_mata_pelajaran' => $request->id_mata_pelajaran,
                    'nik_guru' => $request->nik_guru,
                    'id_kelas' => $request->id_kelas,
                    'hari' => $request->hari,
                    'jam_ke' => $request->jam_ke
                ]);

            $jadwal = DB::table('jadwal_pelajaran')
                ->leftJoin('tahun_ajaran', 'jadwal_pelajaran.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->leftJoin('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('guru', 'jadwal_pelajaran.nik_guru', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                ->select([
                    'jadwal_pelajaran.*',
                    'tahun_ajaran.tahun_ajaran',
                    'tahun_ajaran.semester',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'mata_pelajaran.kode_mata_pelajaran',
                    'guru.nama_lengkap as nama_guru',
                    'kelas.nama_kelas',
                    'kelas.tingkat'
                ])
                ->where('jadwal_pelajaran.id_jadwal', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal pelajaran berhasil diperbarui',
                'data' => $jadwal
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jadwal pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified jadwal pelajaran
     */
    public function destroy($id)
    {
        try {
            $jadwal = DB::table('jadwal_pelajaran')
                ->where('id_jadwal', $id)
                ->first();

            if (!$jadwal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal pelajaran tidak ditemukan'
                ], 404);
            }

            DB::table('jadwal_pelajaran')
                ->where('id_jadwal', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jadwal pelajaran berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jadwal pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for jadwal pelajaran
     */
    public function getFormData(Request $request)
    {
        try {
            // Get current user from token
            $currentUser = null;
            $token = $request->bearerToken();
            if ($token) {
                $currentUser = DB::table('users')
                    ->where('remember_token', $token)
                    ->where('status', 'Aktif')
                    ->first();
            }

            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('status', 'Aktif')
                ->orderBy('tahun_ajaran', 'desc')
                ->get();

            // Role-based filtering for mata pelajaran
            $mataPelajaranQuery = DB::table('mata_pelajaran')
                ->where('mata_pelajaran.status', 'Aktif');

            if ($currentUser && $currentUser->user_type === 'Guru') {
                // Filter mata pelajaran hanya yang diampu oleh guru yang login
                $mataPelajaranQuery->join('guru_mata_pelajaran', 'mata_pelajaran.id_mata_pelajaran', '=', 'guru_mata_pelajaran.id_mata_pelajaran')
                    ->where('guru_mata_pelajaran.nik_guru', $currentUser->reference_id)
                    ->select('mata_pelajaran.*');
            }

            $mataPelajaran = $mataPelajaranQuery->orderBy('nama_mata_pelajaran', 'asc')->get();

            // Role-based filtering for guru - removed to allow all teachers to see all teachers
            $guruQuery = DB::table('guru')
                ->where('status', 'Aktif');

            // Filter removed: Allow all teachers to see all teachers in dropdown
            // if ($currentUser && $currentUser->user_type === 'Guru') {
            //     $guruQuery->where('nik_guru', $currentUser->reference_id);
            // }

            $guru = $guruQuery->orderBy('nama_lengkap', 'asc')->get();

            $kelas = DB::table('kelas')
                ->orderBy('tingkat', 'asc')
                ->orderBy('nama_kelas', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Data form berhasil diambil',
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'mata_pelajaran' => $mataPelajaran,
                    'guru' => $guru,
                    'kelas' => $kelas,
                    'hari' => [
                        ['value' => 'Senin', 'label' => 'Senin'],
                        ['value' => 'Selasa', 'label' => 'Selasa'],
                        ['value' => 'Rabu', 'label' => 'Rabu'],
                        ['value' => 'Kamis', 'label' => 'Kamis'],
                        ['value' => 'Jumat', 'label' => 'Jumat']
                    ],
                    'jam_ke' => [
                        ['value' => '1', 'label' => 'Jam ke-1'],
                        ['value' => '2', 'label' => 'Jam ke-2'],
                        ['value' => '3', 'label' => 'Jam ke-3'],
                        ['value' => '4', 'label' => 'Jam ke-4'],
                        ['value' => '5', 'label' => 'Jam ke-5'],
                        ['value' => '6', 'label' => 'Jam ke-6'],
                        ['value' => '7', 'label' => 'Jam ke-7'],
                        ['value' => '8', 'label' => 'Jam ke-8'],
                        ['value' => '9', 'label' => 'Jam ke-9'],
                        ['value' => '10', 'label' => 'Jam ke-10']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form options for jadwal pelajaran
     */
    public function getFormOptions(Request $request)
    {
        try {
            // Get current user from token
            $currentUser = null;
            $token = $request->bearerToken();
            if ($token) {
                $currentUser = DB::table('users')
                    ->where('remember_token', $token)
                    ->where('status', 'Aktif')
                    ->first();
            }

            $tahunAjaran = DB::table('tahun_ajaran')
                ->where('status', 'Aktif')
                ->orderBy('tahun_ajaran', 'desc')
                ->get();

            // Role-based filtering for mata pelajaran
            $mataPelajaranQuery = DB::table('mata_pelajaran')
                ->where('mata_pelajaran.status', 'Aktif');

            if ($currentUser && $currentUser->user_type === 'Guru') {
                // Filter mata pelajaran hanya yang diampu oleh guru yang login
                $mataPelajaranQuery->join('guru_mata_pelajaran', 'mata_pelajaran.id_mata_pelajaran', '=', 'guru_mata_pelajaran.id_mata_pelajaran')
                    ->where('guru_mata_pelajaran.nik_guru', $currentUser->reference_id)
                    ->select('mata_pelajaran.*');
            }

            $mataPelajaran = $mataPelajaranQuery->orderBy('nama_mata_pelajaran', 'asc')->get();

            // Role-based filtering for guru - removed to allow all teachers to see all teachers
            $guruQuery = DB::table('guru')
                ->where('status', 'Aktif');

            // Filter removed: Allow all teachers to see all teachers in dropdown
            // if ($currentUser && $currentUser->user_type === 'Guru') {
            //     $guruQuery->where('nik_guru', $currentUser->reference_id);
            // }

            $guru = $guruQuery->orderBy('nama_lengkap', 'asc')->get();

            $kelas = DB::table('kelas')
                ->orderBy('tingkat', 'asc')
                ->orderBy('nama_kelas', 'asc')
                ->get();

            // Set default selections
            $defaultSelections = [];
            
            // Auto-select active tahun ajaran
            $activeTahunAjaran = $tahunAjaran->first();
            if ($activeTahunAjaran) {
                $defaultSelections['tahun_ajaran'] = $activeTahunAjaran->id_tahun_ajaran;
            }

            // Auto-select guru for guru role
            if ($currentUser && $currentUser->user_type === 'Guru' && $guru->count() > 0) {
                $defaultSelections['guru'] = $guru->first()->nik_guru;
            }

            return response()->json([
                'success' => true,
                'message' => 'Data form options berhasil diambil',
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'mata_pelajaran' => $mataPelajaran,
                    'guru' => $guru,
                    'kelas' => $kelas,
                    'hari' => [
                        ['value' => 'Senin', 'label' => 'Senin'],
                        ['value' => 'Selasa', 'label' => 'Selasa'],
                        ['value' => 'Rabu', 'label' => 'Rabu'],
                        ['value' => 'Kamis', 'label' => 'Kamis'],
                        ['value' => 'Jumat', 'label' => 'Jumat']
                    ],
                    'jam_ke' => [
                        ['value' => '1', 'label' => 'Jam ke-1'],
                        ['value' => '2', 'label' => 'Jam ke-2'],
                        ['value' => '3', 'label' => 'Jam ke-3'],
                        ['value' => '4', 'label' => 'Jam ke-4'],
                        ['value' => '5', 'label' => 'Jam ke-5'],
                        ['value' => '6', 'label' => 'Jam ke-6'],
                        ['value' => '7', 'label' => 'Jam ke-7'],
                        ['value' => '8', 'label' => 'Jam ke-8'],
                        ['value' => '9', 'label' => 'Jam ke-9'],
                        ['value' => '10', 'label' => 'Jam ke-10']
                    ],
                    'default_selections' => $defaultSelections
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form options: ' . $e->getMessage()
            ], 500);
        }
    }
}