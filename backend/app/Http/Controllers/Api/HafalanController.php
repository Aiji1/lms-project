<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hafalan;
use App\Models\TargetHafalanSiswa;
use App\Models\EvaluasiHafalan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class HafalanController extends Controller
{
    /**
     * Display a listing of hafalan.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('hafalan')
                ->leftJoin('siswa', 'hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('guru', 'hafalan.nik_guru_penguji', '=', 'guru.nik_guru')
                ->select(
                    'hafalan.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'guru.nama_lengkap as nama_guru_penguji'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('hafalan.nis', 'LIKE', "%{$search}%")
                      ->orWhere('hafalan.nama_surah', 'LIKE', "%{$search}%");
                });
            }

            // Filter by siswa
            if ($request->has('nis') && $request->nis) {
                $query->where('hafalan.nis', $request->nis);
            }

            // Filter by status hafalan
            if ($request->has('status_hafalan') && $request->status_hafalan) {
                $query->where('hafalan.status_hafalan', $request->status_hafalan);
            }

            // Filter by surah
            if ($request->has('surah') && $request->surah) {
                $query->where('hafalan.nama_surah', 'LIKE', "%{$request->surah}%");
            }

            // Filter by date range
            if ($request->has('tanggal_mulai') && $request->tanggal_mulai) {
                $query->where('hafalan.tanggal_setoran', '>=', $request->tanggal_mulai);
            }
            if ($request->has('tanggal_selesai') && $request->tanggal_selesai) {
                $query->where('hafalan.tanggal_setoran', '<=', $request->tanggal_selesai);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'tanggal_setoran');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy("hafalan.{$sortBy}", $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $hafalan = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $hafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created hafalan.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'nama_surah' => 'required|string|max:50',
            'ayat_mulai' => 'required|integer|min:1',
            'ayat_selesai' => 'required|integer|min:1',
            'jumlah_baris' => 'required|integer|min:1',
            'tanggal_setoran' => 'required|date',
            'status_hafalan' => 'required|in:Lancar,Kurang_Lancar,Belum_Lancar',
            'nik_guru_penguji' => 'required|string|exists:guru,nik_guru'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate ayat range
            if ($request->ayat_selesai < $request->ayat_mulai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ayat selesai harus lebih besar atau sama dengan ayat mulai'
                ], 422);
            }

            $hafalan = Hafalan::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Data hafalan berhasil ditambahkan',
                'data' => $hafalan
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified hafalan.
     */
    public function show($id)
    {
        try {
            $hafalan = DB::table('hafalan')
                ->leftJoin('siswa', 'hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('guru', 'hafalan.nik_guru_penguji', '=', 'guru.nik_guru')
                ->select(
                    'hafalan.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'guru.nama_lengkap as nama_guru_penguji'
                )
                ->where('hafalan.id_hafalan', $id)
                ->first();

            if (!$hafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data hafalan tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $hafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified hafalan.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'nama_surah' => 'required|string|max:50',
            'ayat_mulai' => 'required|integer|min:1',
            'ayat_selesai' => 'required|integer|min:1',
            'jumlah_baris' => 'required|integer|min:1',
            'tanggal_setoran' => 'required|date',
            'status_hafalan' => 'required|in:Lancar,Kurang_Lancar,Belum_Lancar',
            'nik_guru_penguji' => 'required|string|exists:guru,nik_guru'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $hafalan = Hafalan::find($id);
            if (!$hafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data hafalan tidak ditemukan'
                ], 404);
            }

            // Validate ayat range
            if ($request->ayat_selesai < $request->ayat_mulai) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ayat selesai harus lebih besar atau sama dengan ayat mulai'
                ], 422);
            }

            $hafalan->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Data hafalan berhasil diperbarui',
                'data' => $hafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified hafalan.
     */
    public function destroy($id)
    {
        try {
            $hafalan = Hafalan::find($id);
            if (!$hafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data hafalan tidak ditemukan'
                ], 404);
            }

            $hafalan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Data hafalan berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get hafalan statistics for a student
     */
    public function getStatistikSiswa($nis)
    {
        try {
            $stats = DB::table('hafalan')
                ->where('nis', $nis)
                ->selectRaw('
                    COUNT(*) as total_setoran,
                    SUM(jumlah_baris) as total_baris,
                    COUNT(CASE WHEN status_hafalan = "Lancar" THEN 1 END) as lancar,
                    COUNT(CASE WHEN status_hafalan = "Kurang_Lancar" THEN 1 END) as kurang_lancar,
                    COUNT(CASE WHEN status_hafalan = "Belum_Lancar" THEN 1 END) as belum_lancar
                ')
                ->first();

            // Get unique surah count
            $totalSurah = DB::table('hafalan')
                ->where('nis', $nis)
                ->distinct('nama_surah')
                ->count('nama_surah');

            $stats->total_surah = $totalSurah;

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics: ' . $e->getMessage()
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
                ->select('siswa.nis', 'siswa.nama_lengkap', 'kelas.nama_kelas')
                ->where('siswa.status', 'Aktif')
                ->orderBy('siswa.nama_lengkap')
                ->get();

            $guru = DB::table('guru')
                ->select('nik_guru', 'nama_lengkap')
                ->where('status', 'Aktif')
                ->orderBy('nama_lengkap')
                ->get();

            $statusOptions = Hafalan::getStatusOptions();

            return response()->json([
                'success' => true,
                'data' => [
                    'siswa' => $siswa,
                    'guru' => $guru,
                    'status_hafalan' => $statusOptions
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching form data: ' . $e->getMessage()
            ], 500);
        }
    }
}