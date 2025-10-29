<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanController extends Controller
{
    /**
     * Form data untuk tagihan (list minimal id, kode_tagihan, nama)
     */
    public function getFormData(Request $request)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $rows = DB::table('tagihan')
                    ->select('id', 'kode_tagihan as kode', 'judul as nama')
                    ->where('status', 'Aktif')
                    ->orderBy('judul')
                    ->get();
                // Frontend pembayaran/tambah mengharapkan id, kode_tagihan, nama
                $mapped = $rows->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'kode_tagihan' => $r->kode,
                        'nama' => $r->nama,
                    ];
                });
                return response()->json(['success' => true, 'data' => $mapped]);
            }

            $options = [
                ['id' => 1, 'kode_tagihan' => 'TAG-2024-001', 'nama' => 'SPP Januari'],
                ['id' => 2, 'kode_tagihan' => 'TAG-2024-002', 'nama' => 'SPP Februari'],
            ];
            return response()->json(['success' => true, 'data' => $options]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil form data tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    /** List tagihan */
    public function index(Request $request)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $rows = DB::table('tagihan')
                    ->select('id', 'kode_tagihan', 'judul', 'jenis_kode', 'id_kelas', 'total_nominal', 'tanggal_terbit', 'status')
                    ->orderBy('tanggal_terbit', 'desc')
                    ->get();
                return response()->json(['success' => true, 'data' => $rows]);
            }

            $mock = [
                ['id' => 1, 'kode_tagihan' => 'TAG-2024-001', 'judul' => 'SPP Januari', 'jenis_kode' => 'SPP', 'id_kelas' => 1, 'total_nominal' => 250000, 'tanggal_terbit' => '2024-01-05', 'status' => 'Aktif'],
            ];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    /** Detail tagihan */
    public function show($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $row = DB::table('tagihan')
                    ->select('id', 'kode_tagihan', 'judul', 'jenis_kode', 'id_kelas', 'total_nominal', 'tanggal_terbit', 'status')
                    ->where('id', $id)
                    ->first();
                if (!$row) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'data' => $row]);
            }

            $mock = ['id' => (int)$id, 'kode_tagihan' => 'TAG-2024-001', 'judul' => 'SPP Januari', 'jenis_kode' => 'SPP', 'id_kelas' => 1, 'total_nominal' => 250000, 'tanggal_terbit' => '2024-01-05', 'status' => 'Aktif'];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil detail tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    /** Simpan tagihan */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kode_tagihan' => 'required|string|max:100',
            'judul' => 'required|string|max:150',
            'jenis_kode' => 'required|string|max:100',
            'id_kelas' => 'required|integer',
            'total_nominal' => 'required|integer|min:0',
            'tanggal_terbit' => 'required|date',
            'status' => 'required|in:Aktif,Non-aktif'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $id = DB::table('tagihan')->insertGetId($request->only(['kode_tagihan','judul','jenis_kode','id_kelas','total_nominal','tanggal_terbit','status']));
                return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
            }
            return response()->json(['success' => true, 'message' => 'Mock: tagihan disimpan'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    /** Update tagihan */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'kode_tagihan' => 'sometimes|string|max:100',
            'judul' => 'sometimes|string|max:150',
            'jenis_kode' => 'sometimes|string|max:100',
            'id_kelas' => 'sometimes|integer',
            'total_nominal' => 'sometimes|integer|min:0',
            'tanggal_terbit' => 'sometimes|date',
            'status' => 'sometimes|in:Aktif,Non-aktif'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $updated = DB::table('tagihan')->where('id', $id)->update($request->only(['kode_tagihan','judul','jenis_kode','id_kelas','total_nominal','tanggal_terbit','status']));
                if (!$updated) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Tagihan diperbarui']);
            }
            return response()->json(['success' => true, 'message' => 'Mock: tagihan diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui tagihan', 'error' => $e->getMessage()], 500);
        }
    }

    /** Hapus tagihan */
    public function destroy($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('tagihan');
            if ($exists) {
                $deleted = DB::table('tagihan')->where('id', $id)->delete();
                if (!$deleted) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Tagihan dihapus']);
            }
            return response()->json(['success' => true, 'message' => 'Mock: tagihan dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus tagihan', 'error' => $e->getMessage()], 500);
        }
    }
}