<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\ModulAjar;

class ModulAjarController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = ModulAjar::query();

            if ($search = $request->input('search')) {
                $query->where('judul_modul', 'like', "%$search%");
            }
            if ($status = $request->input('status')) {
                $query->where('status', $status);
            }
            if ($guru = $request->input('nik_guru')) {
                $query->where('nik_guru', $guru);
            }
            if ($mapel = $request->input('id_mata_pelajaran')) {
                $query->where('id_mata_pelajaran', $mapel);
            }
            if ($kelas = $request->input('id_kelas')) {
                $query->where('id_kelas', $kelas);
            }

            $page = (int)($request->input('page', 1));
            $perPage = (int)($request->input('per_page', 10));

            $data = $query->orderByDesc('tanggal_upload')->paginate($perPage, ['*'], 'page', $page);

            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil data: '.$e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'judul_modul' => 'required|string|max:255',
                'nik_guru' => 'nullable|string|max:50',
                'id_mata_pelajaran' => 'nullable|integer',
                'id_kelas' => 'nullable|integer',
                'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx|max:10240'
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();
            $file = $request->file('file');
            $fileName = time().'_'.preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->storeAs('modul', $fileName, 'public');

            $tipe = strtolower($file->getClientOriginalExtension());
            $size = $file->getSize();

            $modul = ModulAjar::create([
                'judul_modul' => $request->input('judul_modul'),
                'nik_guru' => $request->input('nik_guru'),
                'id_mata_pelajaran' => $request->input('id_mata_pelajaran'),
                'id_kelas' => $request->input('id_kelas'),
                'tipe_file' => strtoupper($tipe),
                'ukuran_bytes' => $size,
                'file_path' => 'modul/'.$fileName,
                'status' => $request->input('status', 'Menunggu'),
                'downloads_count' => 0,
                'tanggal_upload' => now(),
            ]);
            DB::commit();

            return response()->json(['success' => true, 'data' => $modul], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan modul: '.$e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $item = ModulAjar::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        return response()->json(['success' => true, 'data' => $item]);
    }

    public function update(Request $request, $id)
    {
        try {
            $item = ModulAjar::find($id);
            if (!$item) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);

            $validator = Validator::make($request->all(), [
                'judul_modul' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|in:Menunggu,Disetujui,Ditolak'
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $item->update($validator->validated());
            return response()->json(['success' => true, 'data' => $item]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal update: '.$e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $item = ModulAjar::find($id);
            if (!$item) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            // Hapus file fisik
            if ($item->file_path) {
                Storage::disk('public')->delete($item->file_path);
            }
            $item->delete();
            return response()->json(['success' => true, 'message' => 'Modul dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus: '.$e->getMessage()], 500);
        }
    }

    public function download($id)
    {
        $item = ModulAjar::find($id);
        if (!$item) return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        if (!Storage::disk('public')->exists($item->file_path)) {
            return response()->json(['success' => false, 'message' => 'File tidak ditemukan'], 404);
        }
        // Increment counter
        $item->increment('downloads_count');

        $fullPath = Storage::disk('public')->path($item->file_path);
        $filename = basename($fullPath);
        return response()->download($fullPath, $filename, [
            'Content-Type' => mime_content_type($fullPath),
            'Content-Disposition' => 'attachment; filename="'.$filename.'"'
        ]);
    }

    public function stats(Request $request)
    {
        $total = ModulAjar::count();
        $aktifGuru = ModulAjar::distinct('nik_guru')->count('nik_guru');
        $menunggu = ModulAjar::where('status', 'Menunggu')->count();
        $downloadBulanIni = ModulAjar::whereMonth('tanggal_upload', now()->month)->sum('downloads_count');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'guru_aktif' => $aktifGuru,
                'menunggu' => $menunggu,
                'download_bulan_ini' => (int) $downloadBulanIni,
            ]
        ]);
    }
}