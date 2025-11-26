<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengumuman;
use App\Models\PengumumanRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PengumumanController extends Controller
{
    /**
     * Get list pengumuman dengan filtering
     */
    public function index(Request $request)
    {
        try {
            $query = Pengumuman::query();

            // Filter berdasarkan kategori
            if ($request->filled('kategori')) {
                $query->where('kategori', $request->kategori);
            }

            // Filter berdasarkan prioritas
            if ($request->filled('prioritas')) {
                $query->where('prioritas', $request->prioritas);
            }

            // Filter berdasarkan status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            } else {
                // Default: hanya tampilkan yang Published
                $query->where('status', 'Published');
            }

            // Filter berdasarkan tanggal
            if ($request->filled('tanggal_mulai')) {
                $query->where('tanggal_mulai', '>=', $request->tanggal_mulai);
            }

            if ($request->filled('tanggal_selesai')) {
                $query->where('tanggal_selesai', '<=', $request->tanggal_selesai);
            }

            // Search berdasarkan judul atau konten
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('judul', 'like', "%{$search}%")
                      ->orWhere('konten', 'like', "%{$search}%");
                });
            }

            // Filter hanya pengumuman aktif (belum expired)
            if ($request->filled('aktif_only') && $request->aktif_only == 'true') {
                $query->active();
            }

            // Filter pengumuman untuk user tertentu berdasarkan targeting
            if ($request->filled('for_user')) {
                $userIdentifier = $request->for_user;
                $userType = $request->user_type;
                $userKelas = $request->user_kelas;
                $userTingkat = $request->user_tingkat;

                $query->where(function($q) use ($userType, $userKelas, $userTingkat, $userIdentifier) {
                    // Target: All
                    $q->orWhere('target_type', 'all')
                      // Target: Roles
                      ->orWhere(function($subQ) use ($userType) {
                          $subQ->where('target_type', 'roles')
                               ->whereJsonContains('target_roles', $userType);
                      })
                      // Target: Tingkat
                      ->orWhere(function($subQ) use ($userTingkat) {
                          if ($userTingkat) {
                              $subQ->where('target_type', 'tingkat')
                                   ->whereJsonContains('target_tingkat', $userTingkat);
                          }
                      })
                      // Target: Kelas
                      ->orWhere(function($subQ) use ($userKelas) {
                          if ($userKelas) {
                              $subQ->where('target_type', 'kelas')
                                   ->whereJsonContains('target_kelas', (int)$userKelas);
                          }
                      })
                      // Target: Siswa Spesifik
                      ->orWhere(function($subQ) use ($userIdentifier) {
                          $subQ->where('target_type', 'siswa_spesifik')
                               ->whereJsonContains('target_siswa', $userIdentifier);
                      });
                });
            }

            // Sorting: Pinned dulu, lalu terbaru
            $query->orderBy('is_pinned', 'desc')
                  ->orderBy('pin_order', 'asc')
                  ->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->input('per_page', 10);
            $pengumuman = $query->paginate($perPage);

            // Tambahkan info apakah user sudah baca (jika ada user_identifier)
            if ($request->filled('for_user')) {
                $userIdentifier = $request->for_user;
                $pengumuman->getCollection()->transform(function($item) use ($userIdentifier) {
                    $item->is_read = $item->isReadBy($userIdentifier);
                    return $item;
                });
            }

            return response()->json([
                'success' => true,
                'message' => 'Data pengumuman berhasil diambil',
                'data' => $pengumuman->items(),
                'pagination' => [
                    'current_page' => $pengumuman->currentPage(),
                    'last_page' => $pengumuman->lastPage(),
                    'per_page' => $pengumuman->perPage(),
                    'total' => $pengumuman->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pengumuman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detail pengumuman
     */
    public function show($id)
    {
        try {
            $pengumuman = Pengumuman::with('reads')->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail pengumuman berhasil diambil',
                'data' => $pengumuman
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pengumuman tidak ditemukan'
            ], 404);
        }
    }

    /**
     * Create pengumuman baru
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'judul' => 'required|string|max:255',
                'konten' => 'required|string',
                'kategori' => 'required|in:Umum,Akademik,Kegiatan,Keuangan,Keagamaan',
                'prioritas' => 'required|in:Normal,Penting,Sangat Penting',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
                'status' => 'required|in:Draft,Published,Archived',
                'target_type' => 'required|in:all,roles,tingkat,kelas,siswa_spesifik',
                'target_roles' => 'nullable|array',
                'target_tingkat' => 'nullable|array',
                'target_kelas' => 'nullable|array',
                'target_siswa' => 'nullable|array',
                'is_pinned' => 'nullable|boolean',
                'pin_order' => 'nullable|integer',
                'file_lampiran' => 'nullable|file|max:10240', // max 10MB
                'dibuat_oleh' => 'required',
                'dibuat_oleh_nama' => 'required|string',
                'dibuat_oleh_role' => 'required|in:Admin,Kepala_Sekolah,Guru,Petugas_Keuangan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Handle file upload
            if ($request->hasFile('file_lampiran')) {
                $file = $request->file('file_lampiran');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('pengumuman', $filename, 'public');
                
                $data['file_lampiran'] = $path;
                $data['file_original_name'] = $file->getClientOriginalName();
            }

            // Jika di-pin, atur pin_order
            if (!empty($data['is_pinned'])) {
                if (empty($data['pin_order'])) {
                    // Auto-increment pin_order
                    $maxOrder = Pengumuman::where('is_pinned', true)->max('pin_order');
                    $data['pin_order'] = ($maxOrder ?? 0) + 1;
                }
            } else {
                $data['pin_order'] = 0;
            }

            $pengumuman = Pengumuman::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Pengumuman berhasil dibuat',
                'data' => $pengumuman
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pengumuman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update pengumuman
     */
    public function update(Request $request, $id)
    {
        try {
            $pengumuman = Pengumuman::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'judul' => 'sometimes|required|string|max:255',
                'konten' => 'sometimes|required|string',
                'kategori' => 'sometimes|required|in:Umum,Akademik,Kegiatan,Keuangan,Keagamaan',
                'prioritas' => 'sometimes|required|in:Normal,Penting,Sangat Penting',
                'tanggal_mulai' => 'sometimes|required|date',
                'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
                'status' => 'sometimes|required|in:Draft,Published,Archived',
                'target_type' => 'sometimes|required|in:all,roles,tingkat,kelas,siswa_spesifik',
                'target_roles' => 'nullable|array',
                'target_tingkat' => 'nullable|array',
                'target_kelas' => 'nullable|array',
                'target_siswa' => 'nullable|array',
                'is_pinned' => 'nullable|boolean',
                'pin_order' => 'nullable|integer',
                'file_lampiran' => 'nullable|file|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();

            // Handle file upload
            if ($request->hasFile('file_lampiran')) {
                // Hapus file lama jika ada
                if ($pengumuman->file_lampiran) {
                    Storage::disk('public')->delete($pengumuman->file_lampiran);
                }

                $file = $request->file('file_lampiran');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('pengumuman', $filename, 'public');
                
                $data['file_lampiran'] = $path;
                $data['file_original_name'] = $file->getClientOriginalName();
            }

            // Handle pin_order
            if (isset($data['is_pinned'])) {
                if ($data['is_pinned'] && empty($data['pin_order'])) {
                    $maxOrder = Pengumuman::where('is_pinned', true)
                                         ->where('id_pengumuman', '!=', $id)
                                         ->max('pin_order');
                    $data['pin_order'] = ($maxOrder ?? 0) + 1;
                } elseif (!$data['is_pinned']) {
                    $data['pin_order'] = 0;
                }
            }

            $pengumuman->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Pengumuman berhasil diupdate',
                'data' => $pengumuman
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate pengumuman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete pengumuman (soft delete)
     */
    public function destroy($id)
    {
        try {
            $pengumuman = Pengumuman::findOrFail($id);
            
            // Soft delete
            $pengumuman->delete();

            return response()->json([
                'success' => true,
                'message' => 'Pengumuman berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus pengumuman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark pengumuman sebagai dibaca
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_identifier' => 'required|string',
                'user_type' => 'required|in:Admin,Kepala_Sekolah,Guru,Siswa,Orang_Tua,Petugas_Keuangan',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $pengumuman = Pengumuman::findOrFail($id);
            
            $pengumuman->markAsReadBy(
                $request->user_identifier,
                $request->user_type
            );

            return response()->json([
                'success' => true,
                'message' => 'Pengumuman ditandai sebagai dibaca'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai pengumuman: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get jumlah unread notifications untuk user
     */
    public function getUnreadCount(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_identifier' => 'required|string',
                'user_type' => 'required|string',
                'user_kelas' => 'nullable|integer',
                'user_tingkat' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userIdentifier = $request->user_identifier;
            $userType = $request->user_type;
            $userKelas = $request->user_kelas;
            $userTingkat = $request->user_tingkat;

            // Query pengumuman yang ditargetkan ke user ini
            $query = Pengumuman::where('status', 'Published')
                ->active()
                ->where(function($q) use ($userType, $userKelas, $userTingkat, $userIdentifier) {
                    $q->where('target_type', 'all')
                      ->orWhere(function($subQ) use ($userType) {
                          $subQ->where('target_type', 'roles')
                               ->whereJsonContains('target_roles', $userType);
                      })
                      ->orWhere(function($subQ) use ($userTingkat) {
                          if ($userTingkat) {
                              $subQ->where('target_type', 'tingkat')
                                   ->whereJsonContains('target_tingkat', $userTingkat);
                          }
                      })
                      ->orWhere(function($subQ) use ($userKelas) {
                          if ($userKelas) {
                              $subQ->where('target_type', 'kelas')
                                   ->whereJsonContains('target_kelas', (int)$userKelas);
                          }
                      })
                      ->orWhere(function($subQ) use ($userIdentifier) {
                          $subQ->where('target_type', 'siswa_spesifik')
                               ->whereJsonContains('target_siswa', $userIdentifier);
                      });
                });

            $totalPengumuman = $query->count();

            // Hitung yang sudah dibaca
            $readIds = PengumumanRead::where('user_identifier', $userIdentifier)
                                    ->pluck('id_pengumuman')
                                    ->toArray();

            $unreadCount = $query->whereNotIn('id_pengumuman', $readIds)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $totalPengumuman,
                    'unread' => $unreadCount,
                    'read' => $totalPengumuman - $unreadCount
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung unread: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle pin status
     */
    public function togglePin($id)
    {
        try {
            $pengumuman = Pengumuman::findOrFail($id);
            
            $pengumuman->is_pinned = !$pengumuman->is_pinned;
            
            if ($pengumuman->is_pinned) {
                // Set pin_order jika belum ada
                if ($pengumuman->pin_order == 0) {
                    $maxOrder = Pengumuman::where('is_pinned', true)->max('pin_order');
                    $pengumuman->pin_order = ($maxOrder ?? 0) + 1;
                }
            } else {
                $pengumuman->pin_order = 0;
            }
            
            $pengumuman->save();

            return response()->json([
                'success' => true,
                'message' => $pengumuman->is_pinned ? 'Pengumuman berhasil di-pin' : 'Pin berhasil dihapus',
                'data' => $pengumuman
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal toggle pin: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form data untuk dropdown
     */
    public function getFormData()
    {
        try {
            $data = [
                'kategori' => ['Umum', 'Akademik', 'Kegiatan', 'Keuangan', 'Keagamaan'],
                'prioritas' => ['Normal', 'Penting', 'Sangat Penting'],
                'status' => ['Draft', 'Published', 'Archived'],
                'target_type' => ['all', 'roles', 'tingkat', 'kelas', 'siswa_spesifik'],
                'roles' => ['Admin', 'Kepala_Sekolah', 'Guru', 'Siswa', 'Orang_Tua', 'Petugas_Keuangan'],
                'tingkat' => ['10', '11', '12'],
            ];

            // Get kelas options
            $kelasOptions = DB::table('kelas')
                             ->select('id_kelas', 'nama_kelas', 'tingkat')
                             ->orderBy('tingkat')
                             ->orderBy('nama_kelas')
                             ->get();

            $data['kelas'] = $kelasOptions;

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil form data: ' . $e->getMessage()
            ], 500);
        }
    }
}