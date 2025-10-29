<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PresensiMapelController extends Controller
{
    /**
     * Display a listing of subject attendance records.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('presensi_mapel')
                ->leftJoin('siswa', 'presensi_mapel.nis', '=', 'siswa.nis')
                ->leftJoin('jurnal_mengajar', 'presensi_mapel.id_jurnal', '=', 'jurnal_mengajar.id_jurnal')
                ->leftJoin('jadwal_pelajaran', 'jurnal_mengajar.id_jadwal', '=', 'jadwal_pelajaran.id_jadwal')
                ->leftJoin('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('guru', 'jadwal_pelajaran.nik_guru', '=', 'guru.nik_guru')
                ->leftJoin('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'presensi_mapel.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'mata_pelajaran.nama_mata_pelajaran as mata_pelajaran',
                    'kelas.nama_kelas as kelas',
                    'guru.nama_lengkap as nama_guru',
                    'jurnal_mengajar.tanggal',
                    'presensi_mapel.status_ketidakhadiran'
                );

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'LIKE', "%{$search}%")
                      ->orWhere('siswa.nis', 'LIKE', "%{$search}%")
                      ->orWhere('mata_pelajaran.nama_mata_pelajaran', 'LIKE', "%{$search}%");
                });
            }

            // Filter by date
            if ($request->has('tanggal') && $request->tanggal) {
                $query->where('jurnal_mengajar.tanggal', $request->tanggal);
            }

            // Filter by mata pelajaran
            if ($request->has('mata_pelajaran') && $request->mata_pelajaran) {
                $query->where('jadwal_pelajaran.id_mata_pelajaran', $request->mata_pelajaran);
            }

            // Filter by kelas
            if ($request->has('kelas') && $request->kelas) {
                $query->where('jadwal_pelajaran.id_kelas', $request->kelas);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('presensi_mapel.status_ketidakhadiran', $request->status);
            }

            // Order by newest first
            $query->orderBy('jurnal_mengajar.tanggal', 'desc')
                  ->orderBy('presensi_mapel.created_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 10);
            $data = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Data presensi mapel berhasil diambil',
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
                'message' => 'Error fetching presensi mapel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created subject attendance record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
            'tanggal' => 'required|date',
            'jam_ke' => 'required|integer|min:1|max:10',
            'status' => 'required|in:Hadir,Sakit,Izin,Alpa',
            'keterangan' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if attendance already exists for this student on this date and subject
            $existingPresensi = DB::table('presensi_mapel')
                ->where('nis', $request->nis)
                ->where('id_mata_pelajaran', $request->id_mata_pelajaran)
                ->where('tanggal', $request->tanggal)
                ->where('jam_ke', $request->jam_ke)
                ->first();

            if ($existingPresensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi untuk siswa ini pada mata pelajaran dan jam tersebut sudah ada'
                ], 422);
            }

            $presensiId = DB::table('presensi_mapel')->insertGetId([
                'nis' => $request->nis,
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'tanggal' => $request->tanggal,
                'jam_ke' => $request->jam_ke,
                'status' => $request->status,
                'keterangan' => $request->keterangan
            ]);

            $presensi = DB::table('presensi_mapel')
                ->leftJoin('siswa', 'presensi_mapel.nis', '=', 'siswa.nis')
                ->leftJoin('mata_pelajaran', 'presensi_mapel.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('presensi_mapel.id_presensi_mapel', $presensiId)
                ->select(
                    'presensi_mapel.*',
                    'siswa.nama_lengkap',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Presensi mapel berhasil ditambahkan',
                'data' => $presensi
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating presensi mapel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified subject attendance record.
     */
    public function show($id)
    {
        try {
            $presensi = DB::table('presensi_mapel')
                ->leftJoin('siswa', 'presensi_mapel.nis', '=', 'siswa.nis')
                ->leftJoin('mata_pelajaran', 'presensi_mapel.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('presensi_mapel.id_presensi_mapel', $id)
                ->select(
                    'presensi_mapel.*',
                    'siswa.nama_lengkap',
                    'mata_pelajaran.nama_mata_pelajaran',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi mapel tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data presensi mapel berhasil diambil',
                'data' => $presensi
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching presensi mapel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified subject attendance record.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
            'tanggal' => 'required|date',
            'jam_ke' => 'required|integer|min:1|max:10',
            'status' => 'required|in:Hadir,Sakit,Izin,Alpa',
            'keterangan' => 'nullable|string|max:255'
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
            $presensi = DB::table('presensi_mapel')
                ->where('id_presensi_mapel', $id)
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi mapel tidak ditemukan'
                ], 404);
            }

            // Check if attendance already exists for this student on this date and subject (excluding current record)
            $existingPresensi = DB::table('presensi_mapel')
                ->where('nis', $request->nis)
                ->where('id_mata_pelajaran', $request->id_mata_pelajaran)
                ->where('tanggal', $request->tanggal)
                ->where('jam_ke', $request->jam_ke)
                ->where('id_presensi_mapel', '!=', $id)
                ->first();

            if ($existingPresensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi untuk siswa ini pada mata pelajaran dan jam tersebut sudah ada'
                ], 422);
            }

            DB::table('presensi_mapel')
                ->where('id_presensi_mapel', $id)
                ->update([
                    'nis' => $request->nis,
                    'id_mata_pelajaran' => $request->id_mata_pelajaran,
                    'tanggal' => $request->tanggal,
                    'jam_ke' => $request->jam_ke,
                    'status' => $request->status,
                    'keterangan' => $request->keterangan
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Presensi mapel berhasil diupdate'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating presensi mapel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified subject attendance record.
     */
    public function destroy($id)
    {
        try {
            $presensi = DB::table('presensi_mapel')
                ->where('id_presensi_mapel', $id)
                ->first();

            if (!$presensi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Presensi mapel tidak ditemukan'
                ], 404);
            }

            DB::table('presensi_mapel')
                ->where('id_presensi_mapel', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Presensi mapel berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting presensi mapel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data for creating/editing presensi mapel
     */
    public function getFormData()
    {
        try {
            $siswa = DB::table('siswa')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->orderBy('siswa.nama_lengkap')
                ->get();

            $mataPelajaran = DB::table('mata_pelajaran')
                ->select(
                    'id_mata_pelajaran',
                    'nama_mata_pelajaran',
                    'kode_mata_pelajaran'
                )
                ->orderBy('nama_mata_pelajaran')
                ->get();

            $kelas = DB::table('kelas')
                ->leftJoin('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'kelas.id_kelas',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->orderBy('kelas.nama_kelas')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Form data berhasil diambil',
                'data' => [
                    'siswa' => $siswa,
                    'mata_pelajaran' => $mataPelajaran,
                    'kelas' => $kelas,
                    'status_options' => ['Hadir', 'Sakit', 'Izin', 'Alpa'],
                    'jam_ke_options' => range(1, 10)
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