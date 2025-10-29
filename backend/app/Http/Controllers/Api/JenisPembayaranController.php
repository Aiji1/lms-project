<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JenisPembayaranController extends Controller
{
    /**
     * Form data untuk jenis pembayaran
     */
    public function getFormData(Request $request)
    {
        try {
            // Jika ada tabel jenis_pembayaran, gunakan itu; jika tidak, fallback ke options statis
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $rows = DB::table('jenis_pembayaran')
                    ->select('id', 'kode', 'nama')
                    ->where('status', 'Aktif')
                    ->orderBy('nama')
                    ->get();
                return response()->json(['success' => true, 'data' => $rows]);
            }

            $options = [
                ['id' => 1, 'kode' => 'SPP', 'nama' => 'SPP Bulanan'],
                ['id' => 2, 'kode' => 'DAFTAR_ULANG', 'nama' => 'Daftar Ulang'],
                ['id' => 3, 'kode' => 'SERAGAM', 'nama' => 'Seragam']
            ];

            return response()->json(['success' => true, 'data' => $options]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil form data jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List jenis pembayaran
     */
    public function index(Request $request)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $rows = DB::table('jenis_pembayaran')
                    ->select('id', 'kode', 'nama', 'nominal_default', 'deskripsi', 'status')
                    ->orderBy('nama')
                    ->get();
                return response()->json(['success' => true, 'data' => $rows]);
            }

            $mock = [
                ['id' => 1, 'kode' => 'SPP', 'nama' => 'SPP Bulanan', 'nominal_default' => 250000, 'deskripsi' => 'Iuran bulanan', 'status' => 'Aktif'],
                ['id' => 2, 'kode' => 'DAFTAR_ULANG', 'nama' => 'Daftar Ulang', 'nominal_default' => 750000, 'deskripsi' => 'Tahunan', 'status' => 'Aktif'],
                ['id' => 3, 'kode' => 'SERAGAM', 'nama' => 'Seragam', 'nominal_default' => 500000, 'deskripsi' => 'Paket seragam', 'status' => 'Non-aktif'],
            ];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data jenis pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Detail jenis pembayaran */
    public function show($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $row = DB::table('jenis_pembayaran')
                    ->select('id', 'kode', 'nama', 'nominal_default', 'deskripsi', 'status')
                    ->where('id', $id)
                    ->first();
                if (!$row) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'data' => $row]);
            }

            $mock = ['id' => (int)$id, 'kode' => 'SPP', 'nama' => 'SPP Bulanan', 'nominal_default' => 250000, 'deskripsi' => 'Iuran bulanan', 'status' => 'Aktif'];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil detail jenis pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Simpan jenis pembayaran */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kode' => 'required|string|max:50',
            'nama' => 'required|string|max:100',
            'nominal_default' => 'required|integer|min:0',
            'deskripsi' => 'nullable|string',
            'status' => 'required|in:Aktif,Non-aktif'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $id = DB::table('jenis_pembayaran')->insertGetId([
                    'kode' => $request->kode,
                    'nama' => $request->nama,
                    'nominal_default' => $request->nominal_default,
                    'deskripsi' => $request->deskripsi,
                    'status' => $request->status
                ]);
                return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
            }

            return response()->json(['success' => true, 'message' => 'Mock: jenis pembayaran disimpan'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan jenis pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Update jenis pembayaran */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'kode' => 'sometimes|string|max:50',
            'nama' => 'sometimes|string|max:100',
            'nominal_default' => 'sometimes|integer|min:0',
            'deskripsi' => 'nullable|string',
            'status' => 'sometimes|in:Aktif,Non-aktif'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $updated = DB::table('jenis_pembayaran')->where('id', $id)->update($request->only(['kode','nama','nominal_default','deskripsi','status']));
                if (!$updated) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Jenis pembayaran diperbarui']);
            }

            return response()->json(['success' => true, 'message' => 'Mock: jenis pembayaran diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui jenis pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Hapus jenis pembayaran */
    public function destroy($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('jenis_pembayaran');
            if ($exists) {
                $deleted = DB::table('jenis_pembayaran')->where('id', $id)->delete();
                if (!$deleted) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Jenis pembayaran dihapus']);
            }
            return response()->json(['success' => true, 'message' => 'Mock: jenis pembayaran dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus jenis pembayaran', 'error' => $e->getMessage()], 500);
        }
    }
}