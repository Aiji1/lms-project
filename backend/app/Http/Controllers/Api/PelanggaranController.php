<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PelanggaranController extends Controller
{
    /**
     * Form data untuk halaman pelanggaran (jenis dan status options, kelas)
     */
    public function getFormData(Request $request)
    {
        try {
            $jenisOptions = [
                ['value' => 'Kaos_Kaki_Pendek', 'label' => 'Kaos Kaki Pendek'],
                ['value' => 'Terlambat', 'label' => 'Terlambat'],
                ['value' => 'Salah_Seragam', 'label' => 'Salah Seragam'],
                ['value' => 'Salah_Sepatu', 'label' => 'Salah Sepatu'],
                ['value' => 'Other', 'label' => 'Lainnya'],
            ];

            $statusOptions = [
                ['value' => 'Active', 'label' => 'Active'],
                ['value' => 'Resolved', 'label' => 'Resolved'],
            ];

            $kelas = DB::table('kelas')
                ->select('id_kelas', 'nama_kelas')
                ->orderBy('nama_kelas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'jenis_pelanggaran_options' => $jenisOptions,
                    'status_options' => $statusOptions,
                    'kelas' => $kelas,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil form data pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List pelanggaran dengan filter
     */
    public function index(Request $request)
    {
        try {
            $query = DB::table('pelanggaran')
                ->join('siswa', 'pelanggaran.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select(
                    'pelanggaran.id_pelanggaran',
                    'pelanggaran.nis',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas',
                    'pelanggaran.tanggal_pelanggaran',
                    'pelanggaran.jenis_pelanggaran',
                    'pelanggaran.deskripsi_custom',
                    'pelanggaran.deskripsi_pelanggaran',
                    'pelanggaran.poin_pelanggaran',
                    'pelanggaran.status'
                );

            if ($request->filled('kelas')) {
                $query->where('siswa.id_kelas', $request->get('kelas'));
            }
            if ($request->filled('jenis_pelanggaran')) {
                $query->where('pelanggaran.jenis_pelanggaran', $request->get('jenis_pelanggaran'));
            }
            if ($request->filled('status')) {
                $query->where('pelanggaran.status', $request->get('status'));
            }
            if ($request->filled('tanggal_from')) {
                $query->where('pelanggaran.tanggal_pelanggaran', '>=', $request->get('tanggal_from'));
            }
            if ($request->filled('tanggal_to')) {
                $query->where('pelanggaran.tanggal_pelanggaran', '<=', $request->get('tanggal_to'));
            }
            if ($request->filled('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('siswa.nama_lengkap', 'like', "%$search%")
                      ->orWhere('pelanggaran.nis', 'like', "%$search%");
                });
            }

            $query->orderBy('pelanggaran.tanggal_pelanggaran', 'desc')
                  ->orderBy('kelas.nama_kelas')
                  ->orderBy('siswa.nama_lengkap');

            $rows = $query->get();

            return response()->json([
                'success' => true,
                'data' => $rows
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Simpan pelanggaran baru
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nis' => 'required|exists:siswa,nis',
            'tanggal_pelanggaran' => 'required|date',
            'jenis_pelanggaran' => 'required|in:Kaos_Kaki_Pendek,Terlambat,Salah_Seragam,Salah_Sepatu,Other',
            'deskripsi_pelanggaran' => 'required|string',
            'deskripsi_custom' => 'nullable|string|max:200',
            'poin_pelanggaran' => 'required|integer|min:0',
            'status' => 'nullable|in:Active,Resolved'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->attributes->get('authenticated_user');
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            // Hanya Guru yang dapat input sesuai schema nik_guru_input FK
            if ($user->user_type !== 'Guru' || empty($user->reference_id')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya guru yang dapat menginput pelanggaran'
                ], 403);
            }

            $nikGuru = $user->reference_id;
            $existsGuru = DB::table('guru')->where('nik_guru', $nikGuru)->exists();
            if (!$existsGuru) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data guru tidak valid untuk input'
                ], 422);
            }

            $data = [
                'nis' => $request->nis,
                'tanggal_pelanggaran' => $request->tanggal_pelanggaran,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'deskripsi_custom' => $request->deskripsi_custom,
                'deskripsi_pelanggaran' => $request->deskripsi_pelanggaran,
                'poin_pelanggaran' => $request->poin_pelanggaran,
                'status' => $request->status ?? 'Active',
                'nik_guru_input' => $nikGuru
            ];

            $id = DB::table('pelanggaran')->insertGetId($data);

            return response()->json([
                'success' => true,
                'message' => 'Pelanggaran berhasil disimpan',
                'data' => ['id_pelanggaran' => $id]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Detail pelanggaran
     */
    public function show($id)
    {
        try {
            $row = DB::table('pelanggaran')
                ->join('siswa', 'pelanggaran.nis', '=', 'siswa.nis')
                ->leftJoin('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->select(
                    'pelanggaran.*',
                    'siswa.nama_lengkap as nama_siswa',
                    'kelas.nama_kelas'
                )
                ->where('pelanggaran.id_pelanggaran', $id)
                ->first();

            if (!$row) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }

            return response()->json(['success' => true, 'data' => $row]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update pelanggaran (status atau field lain)
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'tanggal_pelanggaran' => 'sometimes|date',
            'jenis_pelanggaran' => 'sometimes|in:Kaos_Kaki_Pendek,Terlambat,Salah_Seragam,Salah_Sepatu,Other',
            'deskripsi_pelanggaran' => 'sometimes|string',
            'deskripsi_custom' => 'nullable|string|max:200',
            'poin_pelanggaran' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:Active,Resolved'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $exists = DB::table('pelanggaran')->where('id_pelanggaran', $id)->exists();
            if (!$exists) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }

            $updateData = [];
            foreach (['tanggal_pelanggaran','jenis_pelanggaran','deskripsi_pelanggaran','deskripsi_custom','poin_pelanggaran','status'] as $field) {
                if ($request->has($field)) {
                    $updateData[$field] = $request->get($field);
                }
            }

            if (!empty($updateData)) {
                DB::table('pelanggaran')->where('id_pelanggaran', $id)->update($updateData);
            }

            return response()->json(['success' => true, 'message' => 'Pelanggaran berhasil diperbarui']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus pelanggaran
     */
    public function destroy($id)
    {
        try {
            $deleted = DB::table('pelanggaran')->where('id_pelanggaran', $id)->delete();
            if (!$deleted) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }
            return response()->json(['success' => true, 'message' => 'Pelanggaran berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus pelanggaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}