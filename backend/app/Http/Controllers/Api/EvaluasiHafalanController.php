<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiHafalan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EvaluasiHafalanController extends Controller
{
    /**
     * Display a listing of evaluasi hafalan.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('evaluasi_hafalan')
                ->leftJoin('siswa', 'evaluasi_hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('tahun_ajaran', 'evaluasi_hafalan.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select(
                    'evaluasi_hafalan.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'tahun_ajaran.tahun_ajaran'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('evaluasi_hafalan.nis', 'LIKE', "%{$search}%")
                      ->orWhere('evaluasi_hafalan.bulan_periode', 'LIKE', "%{$search}%");
                });
            }

            // Filter by siswa
            if ($request->has('nis') && $request->nis) {
                $query->where('evaluasi_hafalan.nis', $request->nis);
            }

            // Filter by tahun ajaran
            if ($request->has('id_tahun_ajaran') && $request->id_tahun_ajaran) {
                $query->where('evaluasi_hafalan.id_tahun_ajaran', $request->id_tahun_ajaran);
            }

            // Filter by periode evaluasi
            if ($request->has('periode_evaluasi') && $request->periode_evaluasi) {
                $query->where('evaluasi_hafalan.periode_evaluasi', $request->periode_evaluasi);
            }

            // Filter by status ketuntasan
            if ($request->has('status_ketuntasan') && $request->status_ketuntasan) {
                $query->where('evaluasi_hafalan.status_ketuntasan', $request->status_ketuntasan);
            }

            // Filter by bulan periode
            if ($request->has('bulan_periode') && $request->bulan_periode) {
                $query->where('evaluasi_hafalan.bulan_periode', $request->bulan_periode);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'id_evaluasi');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy("evaluasi_hafalan.{$sortBy}", $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $evaluasiHafalan = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $evaluasiHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created evaluasi hafalan.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'periode_evaluasi' => 'required|in:Bulanan,3_Bulanan,Semesteran',
            'bulan_periode' => 'nullable|string|max:20',
            'total_baris_target' => 'required|integer|min:0',
            'target_surah_mulai' => 'nullable|string|max:50',
            'target_ayat_mulai' => 'nullable|integer|min:1',
            'target_surah_selesai' => 'nullable|string|max:50',
            'target_ayat_selesai' => 'nullable|integer|min:1',
            'total_baris_tercapai' => 'required|integer|min:0',
            'tercapai_surah_mulai' => 'nullable|string|max:50',
            'tercapai_ayat_mulai' => 'nullable|integer|min:1',
            'tercapai_surah_selesai' => 'nullable|string|max:50',
            'tercapai_ayat_selesai' => 'nullable|integer|min:1',
            'status_ketuntasan' => 'required|in:Tuntas,Belum_Tuntas',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate that tercapai doesn't exceed target
            if ($request->total_baris_tercapai > $request->total_baris_target) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total baris tercapai tidak boleh melebihi target'
                ], 422);
            }

            $evaluasiHafalan = EvaluasiHafalan::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Evaluasi hafalan berhasil ditambahkan',
                'data' => $evaluasiHafalan
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified evaluasi hafalan.
     */
    public function show($id)
    {
        try {
            $evaluasiHafalan = DB::table('evaluasi_hafalan')
                ->leftJoin('siswa', 'evaluasi_hafalan.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('tahun_ajaran', 'evaluasi_hafalan.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select(
                    'evaluasi_hafalan.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'tahun_ajaran.tahun_ajaran'
                )
                ->where('evaluasi_hafalan.id_evaluasi', $id)
                ->first();

            if (!$evaluasiHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluasi hafalan tidak ditemukan'
                ], 404);
            }

            // Calculate percentage
            $persentase = 0;
            if ($evaluasiHafalan->total_baris_target > 0) {
                $persentase = round(($evaluasiHafalan->total_baris_tercapai / $evaluasiHafalan->total_baris_target) * 100, 2);
            }
            $evaluasiHafalan->persentase_ketercapaian = $persentase;

            return response()->json([
                'success' => true,
                'data' => $evaluasiHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified evaluasi hafalan.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'periode_evaluasi' => 'required|in:Bulanan,3_Bulanan,Semesteran',
            'bulan_periode' => 'nullable|string|max:20',
            'total_baris_target' => 'required|integer|min:0',
            'target_surah_mulai' => 'nullable|string|max:50',
            'target_ayat_mulai' => 'nullable|integer|min:1',
            'target_surah_selesai' => 'nullable|string|max:50',
            'target_ayat_selesai' => 'nullable|integer|min:1',
            'total_baris_tercapai' => 'required|integer|min:0',
            'tercapai_surah_mulai' => 'nullable|string|max:50',
            'tercapai_ayat_mulai' => 'nullable|integer|min:1',
            'tercapai_surah_selesai' => 'nullable|string|max:50',
            'tercapai_ayat_selesai' => 'nullable|integer|min:1',
            'status_ketuntasan' => 'required|in:Tuntas,Belum_Tuntas',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $evaluasiHafalan = EvaluasiHafalan::find($id);
            if (!$evaluasiHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluasi hafalan tidak ditemukan'
                ], 404);
            }

            // Validate that tercapai doesn't exceed target
            if ($request->total_baris_tercapai > $request->total_baris_target) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total baris tercapai tidak boleh melebihi target'
                ], 422);
            }

            $evaluasiHafalan->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Evaluasi hafalan berhasil diperbarui',
                'data' => $evaluasiHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified evaluasi hafalan.
     */
    public function destroy($id)
    {
        try {
            $evaluasiHafalan = EvaluasiHafalan::find($id);
            if (!$evaluasiHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Evaluasi hafalan tidak ditemukan'
                ], 404);
            }

            $evaluasiHafalan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evaluasi hafalan berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for evaluasi hafalan
     */
    public function getStatistik(Request $request)
    {
        try {
            $query = DB::table('evaluasi_hafalan');

            // Filter by tahun ajaran if provided
            if ($request->has('id_tahun_ajaran') && $request->id_tahun_ajaran) {
                $query->where('id_tahun_ajaran', $request->id_tahun_ajaran);
            }

            $stats = $query->selectRaw('
                COUNT(*) as total_evaluasi,
                COUNT(CASE WHEN status_ketuntasan = "Tuntas" THEN 1 END) as tuntas,
                COUNT(CASE WHEN status_ketuntasan = "Belum_Tuntas" THEN 1 END) as belum_tuntas,
                AVG(total_baris_tercapai) as rata_rata_baris_tercapai,
                SUM(total_baris_target) as total_target_keseluruhan,
                SUM(total_baris_tercapai) as total_tercapai_keseluruhan
            ')->first();

            // Calculate overall percentage
            $persentaseKeseluruhan = 0;
            if ($stats->total_target_keseluruhan > 0) {
                $persentaseKeseluruhan = round(($stats->total_tercapai_keseluruhan / $stats->total_target_keseluruhan) * 100, 2);
            }
            $stats->persentase_keseluruhan = $persentaseKeseluruhan;

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

            $tahunAjaran = DB::table('tahun_ajaran')
                ->select('id_tahun_ajaran', 'tahun_ajaran')
                ->where('status', 'Aktif')
                ->orderBy('tahun_ajaran', 'desc')
                ->get();

            $periodeOptions = EvaluasiHafalan::getPeriodeOptions();
            $statusOptions = EvaluasiHafalan::getStatusKetuntasanOptions();

            return response()->json([
                'success' => true,
                'data' => [
                    'siswa' => $siswa,
                    'tahun_ajaran' => $tahunAjaran,
                    'periode_options' => $periodeOptions,
                    'status_options' => $statusOptions
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