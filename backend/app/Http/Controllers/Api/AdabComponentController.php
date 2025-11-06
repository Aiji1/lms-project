<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class AdabComponentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $includeQuestions = (bool) $request->get('include_questions', false);
            $components = DB::table('adab_components')
                ->orderBy('urutan', 'asc')
                ->orderBy('id_component', 'asc')
                ->get();

            if ($includeQuestions) {
                $componentIds = $components->pluck('id_component')->all();
                $questions = DB::table('adab_questions')
                    ->whereIn('id_component', $componentIds)
                    ->orderBy('urutan', 'asc')
                    ->orderBy('id_question', 'asc')
                    ->get();
                $grouped = [];
                foreach ($questions as $q) {
                    $grouped[$q->id_component][] = $q;
                }
                $components = $components->map(function ($c) use ($grouped) {
                    $c->questions = $grouped[$c->id_component] ?? [];
                    return $c;
                });
            }

            return response()->json(['success' => true, 'data' => $components]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil komponen', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $nama = trim((string) $request->get('nama_component'));
            $urutan = (int) $request->get('urutan', 0);
            $status = (string) $request->get('status', 'Aktif');
            if ($nama === '') {
                return response()->json(['success' => false, 'message' => 'Nama komponen wajib diisi'], 422);
            }
            $id = DB::table('adab_components')->insertGetId([
                'nama_component' => $nama,
                'urutan' => $urutan,
                'status' => $status,
            ], 'id_component');
            $component = DB::table('adab_components')->where('id_component', $id)->first();
            return response()->json(['success' => true, 'message' => 'Komponen berhasil ditambahkan', 'data' => $component]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menambah komponen', 'error' => $e->getMessage()], 500);
        }
    }

    public function update($id, Request $request)
    {
        try {
            $exists = DB::table('adab_components')->where('id_component', $id)->exists();
            if (!$exists) {
                return response()->json(['success' => false, 'message' => 'Komponen tidak ditemukan'], 404);
            }
            $payload = [];
            if ($request->has('nama_component')) $payload['nama_component'] = trim((string) $request->get('nama_component'));
            if ($request->has('urutan')) $payload['urutan'] = (int) $request->get('urutan');
            if ($request->has('status')) $payload['status'] = (string) $request->get('status');
            DB::table('adab_components')->where('id_component', $id)->update($payload);
            $component = DB::table('adab_components')->where('id_component', $id)->first();
            return response()->json(['success' => true, 'message' => 'Komponen berhasil diperbarui', 'data' => $component]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui komponen', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $exists = DB::table('adab_components')->where('id_component', $id)->exists();
            if (!$exists) {
                return response()->json(['success' => false, 'message' => 'Komponen tidak ditemukan'], 404);
            }
            // Hapus pertanyaan terkait
            DB::table('adab_questions')->where('id_component', $id)->delete();
            DB::table('adab_components')->where('id_component', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Komponen berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus komponen', 'error' => $e->getMessage()], 500);
        }
    }
}