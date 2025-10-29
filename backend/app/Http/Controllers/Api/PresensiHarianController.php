<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PresensiHarianController extends Controller
{
    /**
     * Display a listing of daily attendance records.
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'presensi_harian.*',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
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

            // Filter by kelas
            if ($request->has('kelas') && $request->kelas) {
                $query->where('siswa.id_kelas', $request->kelas);
            }

            // Filter by status
            if ($request->has('status') && $request->status) {
                $query->where('presensi_harian.status', $request->status);
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
     * Store a newly created attendance record.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|exists:siswa,nis',
            'tanggal' => 'required|date',
            'status_kehadiran' => 'required|in:Hadir,Sakit,Izin,Alpha',
            'metode_presensi' => 'required|in:Manual,RFID,Barcode,Fingerprint'
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

            $presensiId = DB::table('presensi_harian')->insertGetId([
                'nis' => $request->nis,
                'tanggal' => $request->tanggal,
                'jam_masuk' => now()->format('H:i:s'), // Set current time as jam_masuk
                'status' => $request->status_kehadiran,
                'metode_presensi' => $request->metode_presensi
            ]);

            $presensi = DB::table('presensi_harian')
                ->leftJoin('siswa', 'presensi_harian.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
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
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
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
            'jam_masuk' => 'required|date_format:H:i:s',
            'status' => 'required|in:Hadir,Tidak_Hadir',
            'metode_presensi' => 'required|in:RFID,Barcode,Fingerprint'
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
                    'jam_masuk' => $request->jam_masuk,
                    'status' => $request->status,
                    'metode_presensi' => $request->metode_presensi
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
                ->leftJoin('jurusan', 'siswa.id_jurusan', '=', 'jurusan.id_jurusan')
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
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
                    'jurusan.nama_jurusan'
                )
                ->orderBy('kelas.nama_kelas')
                ->get();

            $status_kehadiran = [
                ['value' => 'Hadir', 'label' => 'Hadir'],
                ['value' => 'Sakit', 'label' => 'Sakit'],
                ['value' => 'Izin', 'label' => 'Izin'],
                ['value' => 'Alpha', 'label' => 'Alpha']
            ];

            $metode_presensi = [
                ['value' => 'Manual', 'label' => 'Manual'],
                ['value' => 'RFID', 'label' => 'RFID'],
                ['value' => 'QRCode', 'label' => 'QR Code'],
                ['value' => 'Fingerprint', 'label' => 'Fingerprint']
            ];

            return response()->json([
                'success' => true,
                'message' => 'Form data berhasil diambil',
                'data' => [
                    'siswa' => $siswa,
                    'kelas' => $kelas,
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
}