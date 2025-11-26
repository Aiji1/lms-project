<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class JenisPelanggaranController extends Controller
{
    public function index(Request $request)
    {
        $rows = DB::table('jenis_pelanggaran')
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', $request->get('status'));
            })
            ->orderBy('label')
            ->get();
        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'label' => 'required|string|max:200',
            'poin_default' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Aktif,Non-aktif',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }
        $label = $request->label;
        $exists = DB::table('jenis_pelanggaran')->where('label', $label)->first();
        if ($exists) {
            DB::table('jenis_pelanggaran')->where('id', $exists->id)->update([
                'poin_default' => $request->poin_default ?? $exists->poin_default,
                'status' => $request->status ?? $exists->status,
                'updated_at' => now(),
            ]);
            return response()->json(['success' => true, 'message' => 'Jenis pelanggaran sudah ada', 'data' => ['id' => $exists->id]]);
        }
        $kode = Str::upper(Str::of($label)->replace(' ', '_')->replaceMatches('/[^A-Z0-9_]/', ''));
        $id = DB::table('jenis_pelanggaran')->insertGetId([
            'kode' => $kode,
            'label' => $label,
            'poin_default' => $request->poin_default ?? 0,
            'status' => $request->status ?? 'Aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['success' => true, 'message' => 'Jenis pelanggaran berhasil ditambahkan', 'data' => ['id' => $id]]);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'label' => 'sometimes|string|max:200',
            'poin_default' => 'sometimes|integer|min:0',
            'status' => 'sometimes|in:Aktif,Non-aktif',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }
        $exists = DB::table('jenis_pelanggaran')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }
        $update = [];
        foreach (['label','poin_default','status'] as $f) {
            if ($request->has($f)) $update[$f] = $request->get($f);
        }
        if (array_key_exists('label', $update)) {
            $update['kode'] = Str::upper(Str::of($update['label'])->replace(' ', '_')->replaceMatches('/[^A-Z0-9_]/', ''));
        }
        $update['updated_at'] = now();
        DB::table('jenis_pelanggaran')->where('id', $id)->update($update);
        return response()->json(['success' => true, 'message' => 'Jenis pelanggaran berhasil diperbarui']);
    }

    public function destroy($id)
    {
        $deleted = DB::table('jenis_pelanggaran')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }
        return response()->json(['success' => true, 'message' => 'Jenis pelanggaran berhasil dihapus']);
    }
}