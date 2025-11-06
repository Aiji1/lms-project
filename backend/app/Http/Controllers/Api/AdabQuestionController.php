<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class AdabQuestionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $componentId = $request->get('component_id');
            $q = DB::table('adab_questions');
            if (!empty($componentId)) {
                $q->where('id_component', $componentId);
            }
            $questions = $q->orderBy('urutan', 'asc')->orderBy('id_question', 'asc')->get();
            return response()->json(['success' => true, 'data' => $questions]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil pertanyaan', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $componentId = (int) $request->get('id_component');
            $text = trim((string) $request->get('teks_pertanyaan'));
            $order = (int) $request->get('urutan', 0);
            $status = (string) $request->get('status', 'Aktif');
            if ($componentId <= 0 || $text === '') {
                return response()->json(['success' => false, 'message' => 'id_component dan teks_pertanyaan wajib diisi'], 422);
            }
            $id = DB::table('adab_questions')->insertGetId([
                'id_component' => $componentId,
                'teks_pertanyaan' => $text,
                'urutan' => $order,
                'status' => $status,
            ], 'id_question');
            $question = DB::table('adab_questions')->where('id_question', $id)->first();
            return response()->json(['success' => true, 'message' => 'Pertanyaan berhasil ditambahkan', 'data' => $question]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menambah pertanyaan', 'error' => $e->getMessage()], 500);
        }
    }

    public function update($id, Request $request)
    {
        try {
            $exists = DB::table('adab_questions')->where('id_question', $id)->exists();
            if (!$exists) {
                return response()->json(['success' => false, 'message' => 'Pertanyaan tidak ditemukan'], 404);
            }
            $payload = [];
            if ($request->has('teks_pertanyaan')) $payload['teks_pertanyaan'] = trim((string) $request->get('teks_pertanyaan'));
            if ($request->has('urutan')) $payload['urutan'] = (int) $request->get('urutan');
            if ($request->has('status')) $payload['status'] = (string) $request->get('status');
            DB::table('adab_questions')->where('id_question', $id)->update($payload);
            $question = DB::table('adab_questions')->where('id_question', $id)->first();
            return response()->json(['success' => true, 'message' => 'Pertanyaan berhasil diperbarui', 'data' => $question]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui pertanyaan', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $exists = DB::table('adab_questions')->where('id_question', $id)->exists();
            if (!$exists) {
                return response()->json(['success' => false, 'message' => 'Pertanyaan tidak ditemukan'], 404);
            }
            DB::table('adab_questions')->where('id_question', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Pertanyaan berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus pertanyaan', 'error' => $e->getMessage()], 500);
        }
    }
}