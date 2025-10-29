<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TargetHafalanSiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TargetHafalanSiswaController extends Controller
{
    /**
     * Display a listing of target hafalan siswa.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('target_hafalan_siswa')
                ->leftJoin('siswa', 'target_hafalan_siswa.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('tahun_ajaran', 'target_hafalan_siswa.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select(
                    'target_hafalan_siswa.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'tahun_ajaran.tahun_ajaran'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('target_hafalan_siswa.nis', 'LIKE', "%{$search}%");
                });
            }

            // Filter by siswa
            if ($request->has('nis') && $request->nis) {
                $query->where('target_hafalan_siswa.nis', $request->nis);
            }

            // Filter by tahun ajaran
            if ($request->has('id_tahun_ajaran') && $request->id_tahun_ajaran) {
                $query->where('target_hafalan_siswa.id_tahun_ajaran', $request->id_tahun_ajaran);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('target_hafalan_siswa.status', $request->status);
            }

            // Filter by target baris
            if ($request->has('target_baris') && $request->target_baris) {
                $query->where('target_hafalan_siswa.target_baris_perpertemuan', $request->target_baris);
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'id_target_hafalan');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy("target_hafalan_siswa.{$sortBy}", $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $targetHafalan = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $targetHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created target hafalan siswa.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'target_baris_perpertemuan' => 'required|in:3,5,7',
            'status' => 'in:Aktif,Non-aktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if target already exists for this student and academic year
            $existingTarget = TargetHafalanSiswa::where('nis', $request->nis)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->first();

            if ($existingTarget) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target hafalan untuk siswa ini pada tahun ajaran tersebut sudah ada'
                ], 422);
            }

            $data = $request->all();
            $data['status'] = $data['status'] ?? 'Aktif';

            $targetHafalan = TargetHafalanSiswa::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Target hafalan siswa berhasil ditambahkan',
                'data' => $targetHafalan
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified target hafalan siswa.
     */
    public function show($id)
    {
        try {
            $targetHafalan = DB::table('target_hafalan_siswa')
                ->leftJoin('siswa', 'target_hafalan_siswa.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('tahun_ajaran', 'target_hafalan_siswa.id_tahun_ajaran', '=', 'tahun_ajaran.id_tahun_ajaran')
                ->select(
                    'target_hafalan_siswa.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'tahun_ajaran.tahun_ajaran'
                )
                ->where('target_hafalan_siswa.id_target_hafalan', $id)
                ->first();

            if (!$targetHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target hafalan siswa tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $targetHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified target hafalan siswa.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_tahun_ajaran' => 'required|integer|exists:tahun_ajaran,id_tahun_ajaran',
            'target_baris_perpertemuan' => 'required|in:3,5,7',
            'status' => 'in:Aktif,Non-aktif'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $targetHafalan = TargetHafalanSiswa::find($id);
            if (!$targetHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target hafalan siswa tidak ditemukan'
                ], 404);
            }

            // Check if target already exists for this student and academic year (excluding current record)
            $existingTarget = TargetHafalanSiswa::where('nis', $request->nis)
                ->where('id_tahun_ajaran', $request->id_tahun_ajaran)
                ->where('id_target_hafalan', '!=', $id)
                ->first();

            if ($existingTarget) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target hafalan untuk siswa ini pada tahun ajaran tersebut sudah ada'
                ], 422);
            }

            $targetHafalan->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Target hafalan siswa berhasil diperbarui',
                'data' => $targetHafalan
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified target hafalan siswa.
     */
    public function destroy($id)
    {
        try {
            $targetHafalan = TargetHafalanSiswa::find($id);
            if (!$targetHafalan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target hafalan siswa tidak ditemukan'
                ], 404);
            }

            $targetHafalan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Target hafalan siswa berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting data: ' . $e->getMessage()
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

            $targetBarisOptions = TargetHafalanSiswa::getTargetBarisOptions();
            $statusOptions = TargetHafalanSiswa::getStatusOptions();

            return response()->json([
                'success' => true,
                'data' => [
                    'siswa' => $siswa,
                    'tahun_ajaran' => $tahunAjaran,
                    'target_baris_options' => $targetBarisOptions,
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