<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PembayaranController extends Controller
{
    /** List pembayaran */
    public function index(Request $request)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('pembayaran');
            if ($exists) {
                $rows = DB::table('pembayaran')
                    ->select('id', 'kode_transaksi', 'nis', 'nama_siswa', 'jenis_kode', 'tagihan_kode', 'nominal', 'tanggal_bayar', 'metode', 'status')
                    ->orderBy('tanggal_bayar', 'desc')
                    ->get();
                return response()->json(['success' => true, 'data' => $rows]);
            }

            $mock = [
                ['id' => 1, 'kode_transaksi' => 'TRX-2024-001', 'nis' => '12345', 'nama_siswa' => 'Budi', 'jenis_kode' => 'SPP', 'tagihan_kode' => 'TAG-2024-001', 'nominal' => 250000, 'tanggal_bayar' => '2024-01-10', 'metode' => 'Tunai', 'status' => 'Lunas'],
            ];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Detail pembayaran */
    public function show($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('pembayaran');
            if ($exists) {
                $row = DB::table('pembayaran')
                    ->select('id', 'kode_transaksi', 'nis', 'nama_siswa', 'jenis_kode', 'tagihan_kode', 'nominal', 'tanggal_bayar', 'metode', 'status')
                    ->where('id', $id)
                    ->first();
                if (!$row) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'data' => $row]);
            }

            $mock = ['id' => (int)$id, 'kode_transaksi' => 'TRX-2024-001', 'nis' => '12345', 'nama_siswa' => 'Budi', 'jenis_kode' => 'SPP', 'tagihan_kode' => 'TAG-2024-001', 'nominal' => 250000, 'tanggal_bayar' => '2024-01-10', 'metode' => 'Tunai', 'status' => 'Lunas'];
            return response()->json(['success' => true, 'data' => $mock]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil detail pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Simpan pembayaran */
    public function store(Request $request)
    {
        // Terima dua bentuk payload:
        // 1) Bentuk lengkap (kode_transaksi, nama_siswa, jenis_kode, tagihan_kode, status)
        // 2) Bentuk minimal dari frontend: { nis, jenis_id, tagihan_id, nominal, tanggal_bayar, metode, nama? }
        $validator = Validator::make($request->all(), [
            'nis' => 'required|string|max:50',
            'jenis_id' => 'nullable|integer',
            'tagihan_id' => 'nullable|integer',
            'nominal' => 'required|integer|min:0',
            'tanggal_bayar' => 'required|date',
            'metode' => 'required|string|max:50',
            // opsional bila bentuk lengkap
            'kode_transaksi' => 'sometimes|string|max:100',
            'nama' => 'sometimes|string|max:150',
            'nama_siswa' => 'sometimes|string|max:150',
            'jenis_kode' => 'sometimes|string|max:100',
            'tagihan_kode' => 'sometimes|string|max:100',
            'status' => 'sometimes|in:Berhasil,Pending,Gagal,Lunas,Batal'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('pembayaran');
            if ($exists) {
                // Bangun field untuk insert
                $kodeTransaksi = $request->get('kode_transaksi');
                if (empty($kodeTransaksi)) {
                    $kodeTransaksi = 'PAY-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
                }

                // Nama siswa: gunakan 'nama' atau 'nama_siswa' atau lookup dari tabel siswa
                $namaSiswa = $request->get('nama_siswa') ?? $request->get('nama');
                if (empty($namaSiswa)) {
                    if (DB::getSchemaBuilder()->hasTable('siswa')) {
                        $s = DB::table('siswa')->select('nama')->where('nis', $request->get('nis'))->first();
                        if ($s) { $namaSiswa = $s->nama; }
                    }
                }

                // jenis_kode: pakai langsung bila ada, atau lookup dari jenis_id
                $jenisKode = $request->get('jenis_kode');
                if (empty($jenisKode)) {
                    $jenisId = $request->get('jenis_id');
                    if (!empty($jenisId) && DB::getSchemaBuilder()->hasTable('jenis_pembayaran')) {
                        $j = DB::table('jenis_pembayaran')->select('kode')->where('id', $jenisId)->first();
                        if ($j) { $jenisKode = $j->kode; }
                    }
                }

                // tagihan_kode: pakai langsung atau lookup dari tagihan_id
                $tagihanKode = $request->get('tagihan_kode');
                if (empty($tagihanKode)) {
                    $tagihanId = $request->get('tagihan_id');
                    if (!empty($tagihanId) && DB::getSchemaBuilder()->hasTable('tagihan')) {
                        $t = DB::table('tagihan')->select('kode_tagihan')->where('id', $tagihanId)->first();
                        if ($t) { $tagihanKode = $t->kode_tagihan; }
                    }
                }

                // status default selaras dengan frontend list
                $status = $request->get('status') ?? 'Berhasil';

                $id = DB::table('pembayaran')->insertGetId([
                    'kode_transaksi' => $kodeTransaksi,
                    'nis' => $request->get('nis'),
                    'nama_siswa' => $namaSiswa,
                    'jenis_kode' => $jenisKode,
                    'tagihan_kode' => $tagihanKode,
                    'nominal' => (int) $request->get('nominal'),
                    'tanggal_bayar' => $request->get('tanggal_bayar'),
                    'metode' => $request->get('metode'),
                    'status' => $status,
                ]);
                return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
            }
            return response()->json(['success' => true, 'message' => 'Mock: pembayaran disimpan'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Update pembayaran */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'kode_transaksi' => 'sometimes|string|max:100',
            'nis' => 'sometimes|string|max:50',
            'nama_siswa' => 'sometimes|string|max:150',
            'jenis_kode' => 'sometimes|string|max:100',
            'tagihan_kode' => 'sometimes|string|max:100',
            'nominal' => 'sometimes|integer|min:0',
            'tanggal_bayar' => 'sometimes|date',
            'metode' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:Lunas,Pending,Batal'
        ]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        try {
            $exists = DB::getSchemaBuilder()->hasTable('pembayaran');
            if ($exists) {
                $updated = DB::table('pembayaran')->where('id', $id)->update($request->only(['kode_transaksi','nis','nama_siswa','jenis_kode','tagihan_kode','nominal','tanggal_bayar','metode','status']));
                if (!$updated) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Pembayaran diperbarui']);
            }
            return response()->json(['success' => true, 'message' => 'Mock: pembayaran diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui pembayaran', 'error' => $e->getMessage()], 500);
        }
    }

    /** Hapus pembayaran */
    public function destroy($id)
    {
        try {
            $exists = DB::getSchemaBuilder()->hasTable('pembayaran');
            if ($exists) {
                $deleted = DB::table('pembayaran')->where('id', $id)->delete();
                if (!$deleted) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
                return response()->json(['success' => true, 'message' => 'Pembayaran dihapus']);
            }
            return response()->json(['success' => true, 'message' => 'Mock: pembayaran dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus pembayaran', 'error' => $e->getMessage()], 500);
        }
    }
}