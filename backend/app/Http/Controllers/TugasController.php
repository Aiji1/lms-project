<?php

namespace App\Http\Controllers;

use App\Models\Tugas;
use App\Models\TugasSiswa;
use App\Models\PengumpulanTugas;
use App\Models\MataPelajaran;
use App\Models\Kelas;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TugasController extends Controller
{
    /**
     * Display a listing of tugas.
     */
    public function index(Request $request)
    {
        try {
            // Get authenticated user from custom middleware
            $user = $request->attributes->get('authenticated_user');
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            
            $query = Tugas::with(['mataPelajaran', 'guru', 'kelas', 'tahunAjaran']);

            // Filter by guru if user is a teacher
            if ($user->user_type === 'Guru') {
                $query->byGuru($user->reference_id);
            }
            
            // Filter by siswa: hanya tampilkan tugas yang ditugaskan ke siswa ini
            if ($user->user_type === 'Siswa') {
                // Ensure only tasks that have a tugas_siswa record for this NIS
                $query->whereHas('tugasSiswa', function ($q) use ($user) {
                    $q->where('nis', $user->reference_id);
                });
                // Also include tugasSiswa relation constrained to this student for frontend status usage
                $query->with(['tugasSiswa' => function ($q) use ($user) {
                    $q->where('nis', $user->reference_id);
                }]);
            }

            // Apply filters
            if ($request->has('mata_pelajaran') && $request->mata_pelajaran) {
                $query->where('id_mata_pelajaran', $request->mata_pelajaran);
            }

            if ($request->has('kelas') && $request->kelas) {
                $query->where('id_kelas', $request->kelas);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Tahun ajaran filtering
            // Jika client mengirimkan id_tahun_ajaran, gunakan itu.
            // Jika tidak ada, untuk non-Admin gunakan tahun ajaran aktif.
            // Admin default: tanpa filter tahun ajaran agar bisa melihat semua data.
            $tahunAjaranAktif = TahunAjaran::active()->first();
            if ($request->has('id_tahun_ajaran') && $request->id_tahun_ajaran) {
                $query->byTahunAjaran($request->id_tahun_ajaran);
            } else {
                if ($tahunAjaranAktif && $user->user_type !== 'Admin') {
                    $query->byTahunAjaran($tahunAjaranAktif->id_tahun_ajaran);
                }
            }

            $tugas = $query->orderBy('tanggal_pemberian', 'desc')->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $tugas,
                'message' => 'Data tugas berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created tugas.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'id_kelas' => 'required|integer|exists:kelas,id_kelas',
                'judul_tugas' => 'required|string|max:200',
                'deskripsi_tugas' => 'required|string',
                'tanggal_pemberian' => 'required|date',
                'tanggal_deadline' => 'required|date|after:tanggal_pemberian',
                'tipe_tugas' => 'required|in:Semua_Siswa,Siswa_Terpilih',
                'bobot_nilai' => 'nullable|numeric|between:0,100',
                'file_tugas' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:10240',
                'keterangan' => 'nullable|string',
                'siswa_terpilih' => 'required_if:tipe_tugas,Siswa_Terpilih|array',
                'siswa_terpilih.*' => 'string|exists:siswa,nis'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get authenticated user from custom middleware
            $user = $request->attributes->get('authenticated_user');
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }
            
            $tahunAjaranAktif = TahunAjaran::active()->first();

            if (!$tahunAjaranAktif) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada tahun ajaran aktif'
                ], 400);
            }

            DB::beginTransaction();

            // Handle file upload
            $fileName = null;
            if ($request->hasFile('file_tugas')) {
                $file = $request->file('file_tugas');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('tugas', $fileName, 'public');
            }

            // Create tugas
            $tugas = Tugas::create([
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'nik_guru' => $user->reference_id, // Use reference_id for guru's NIK
                'id_kelas' => $request->id_kelas,
                'id_tahun_ajaran' => $tahunAjaranAktif->id_tahun_ajaran,
                'judul_tugas' => $request->judul_tugas,
                'deskripsi_tugas' => $request->deskripsi_tugas,
                'tanggal_pemberian' => $request->tanggal_pemberian,
                'tanggal_deadline' => $request->tanggal_deadline,
                'tipe_tugas' => $request->tipe_tugas,
                'status' => 'Aktif',
                'file_tugas' => $fileName,
                'bobot_nilai' => $request->bobot_nilai,
                'keterangan' => $request->keterangan
            ]);

            // Assign tugas to students
            if ($request->tipe_tugas === 'Semua_Siswa') {
                // Get all students in the class
                $siswaList = DB::table('siswa')
                    ->join('kelas_siswa', 'siswa.nis', '=', 'kelas_siswa.nis')
                    ->where('kelas_siswa.id_kelas', $request->id_kelas)
                    ->where('kelas_siswa.id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran)
                    ->pluck('siswa.nis');
            } else {
                $siswaList = $request->siswa_terpilih;
            }

            foreach ($siswaList as $nis) {
                TugasSiswa::create([
                    'id_tugas' => $tugas->id_tugas,
                    'nis' => $nis,
                    'status_pengumpulan' => 'Belum'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $tugas->load(['mataPelajaran', 'guru', 'kelas']),
                'message' => 'Tugas berhasil dibuat'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified tugas.
     */
    public function show($id)
    {
        try {
            // Get authenticated user from custom middleware
            // and load tugas with relations
            $user = request()->attributes->get('authenticated_user');
            $tugas = Tugas::with(['mataPelajaran', 'guru', 'kelas', 'tahunAjaran', 'tugasSiswa'])
                ->findOrFail($id);

            // If guru, ensure the tugas belongs to this guru
            if ($user && $user->user_type === 'Guru' && $tugas->nik_guru !== $user->reference_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas tidak tersedia untuk guru ini'
                ], 403);
            }

            // If siswa, ensure the tugas is assigned to this siswa
            if ($user && $user->user_type === 'Siswa') {
                $isAssigned = $tugas->tugasSiswa->contains(function ($ts) use ($user) {
                    return $ts->nis === $user->reference_id;
                });
                if (!$isAssigned) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tugas tidak tersedia untuk siswa ini'
                    ], 403);
                }
            }

            // Get submission statistics
            $totalSiswa = $tugas->tugasSiswa->count();
            $sudahMengumpulkan = $tugas->tugasSiswa->where('status_pengumpulan', 'Sudah')->count();
            $belumMengumpulkan = $tugas->tugasSiswa->where('status_pengumpulan', 'Belum')->count();
            $terlambat = $tugas->tugasSiswa->where('status_pengumpulan', 'Terlambat')->count();

            $tugas->statistik = [
                'total_siswa' => $totalSiswa,
                'sudah_mengumpulkan' => $sudahMengumpulkan,
                'belum_mengumpulkan' => $belumMengumpulkan,
                'terlambat' => $terlambat
            ];

            return response()->json([
                'success' => true,
                'data' => $tugas,
                'message' => 'Data tugas berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tugas tidak ditemukan: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified tugas.
     */
    public function update(Request $request, $id)
    {
        try {
            $tugas = Tugas::findOrFail($id);

            // Validate ownership for Guru role
            $user = $request->attributes->get('authenticated_user');
            if ($user && $user->user_type === 'Guru' && $tugas->nik_guru !== $user->reference_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guru tidak diizinkan mengubah tugas milik guru lain'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'id_mata_pelajaran' => 'required|integer|exists:mata_pelajaran,id_mata_pelajaran',
                'id_kelas' => 'required|integer|exists:kelas,id_kelas',
                'judul_tugas' => 'required|string|max:200',
                'deskripsi_tugas' => 'required|string',
                'tanggal_pemberian' => 'required|date',
                'tanggal_deadline' => 'required|date|after:tanggal_pemberian',
                'tipe_tugas' => 'required|in:Semua_Siswa,Siswa_Terpilih',
                'bobot_nilai' => 'nullable|numeric|between:0,100',
                'file_tugas' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:10240',
                'keterangan' => 'nullable|string',
                'status' => 'required|in:Aktif,Non-aktif'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Handle file upload
            $fileName = $tugas->file_tugas;
            if ($request->hasFile('file_tugas')) {
                // Delete old file
                if ($fileName) {
                    Storage::disk('public')->delete('tugas/' . $fileName);
                }
                
                $file = $request->file('file_tugas');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('tugas', $fileName, 'public');
            }

            // Update tugas
            $tugas->update([
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'id_kelas' => $request->id_kelas,
                'judul_tugas' => $request->judul_tugas,
                'deskripsi_tugas' => $request->deskripsi_tugas,
                'tanggal_pemberian' => $request->tanggal_pemberian,
                'tanggal_deadline' => $request->tanggal_deadline,
                'tipe_tugas' => $request->tipe_tugas,
                'file_tugas' => $fileName,
                'bobot_nilai' => $request->bobot_nilai,
                'keterangan' => $request->keterangan,
                'status' => $request->status
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $tugas->load(['mataPelajaran', 'guru', 'kelas']),
                'message' => 'Tugas berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified tugas.
     */
    public function destroy($id)
    {
        try {
            $tugas = Tugas::findOrFail($id);

            // Validate ownership for Guru role
            $user = request()->attributes->get('authenticated_user');
            if ($user && $user->user_type === 'Guru' && $tugas->nik_guru !== $user->reference_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Guru tidak diizinkan menghapus tugas milik guru lain'
                ], 403);
            }

            DB::beginTransaction();

            // Delete related records
            TugasSiswa::where('id_tugas', $id)->delete();
            PengumpulanTugas::where('id_tugas', $id)->delete();

            // Delete file if exists
            if ($tugas->file_tugas) {
                Storage::disk('public')->delete('tugas/' . $tugas->file_tugas);
            }

            $tugas->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Tugas berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get pengumpulan data for a specific tugas.
     */
    public function getPengumpulan($id)
    {
        try {
            $tugas = Tugas::findOrFail($id);

            // Validate ownership for Guru role accessing pengumpulan
            $user = request()->attributes->get('authenticated_user');
            if ($user && $user->user_type === 'Guru' && $tugas->nik_guru !== $user->reference_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas tidak tersedia untuk guru ini'
                ], 403);
            }

            // Build base query for students assigned to this task with their submission data
            $pengumpulanQuery = DB::table('tugas_siswa')
                ->leftJoin('pengumpulan_tugas', function($join) {
                    $join->on('tugas_siswa.id_tugas', '=', 'pengumpulan_tugas.id_tugas')
                         ->on('tugas_siswa.nis', '=', 'pengumpulan_tugas.nis');
                })
                ->leftJoin('siswa', 'tugas_siswa.nis', '=', 'siswa.nis')
                ->where('tugas_siswa.id_tugas', $id)
                ->select([
                    'pengumpulan_tugas.id_pengumpulan',
                    'tugas_siswa.nis',
                    'siswa.nama_lengkap as nama_siswa',
                    'pengumpulan_tugas.tanggal_submit as tanggal_pengumpulan',
                    'pengumpulan_tugas.file_jawaban as file_pengumpulan',
                    'pengumpulan_tugas.keterangan_siswa',
                    'pengumpulan_tugas.nilai',
                    'pengumpulan_tugas.feedback_guru',
                    'tugas_siswa.status_pengumpulan',
                    DB::raw('CASE 
                        WHEN pengumpulan_tugas.id_pengumpulan IS NOT NULL THEN "Sudah_Mengumpulkan"
                        WHEN tugas_siswa.status_pengumpulan = "Terlambat" THEN "Terlambat"
                        ELSE "Belum_Mengumpulkan"
                    END as status_pengumpulan')
                ])
                ->orderBy('siswa.nama_lengkap', 'asc');

            // If user is Siswa, limit to their own NIS only
            // Catatan: sesuai requirement terbaru, siswa tetap melihat semua murid.
            // Pembatasan akses jawaban dilakukan saat transformasi data di bawah.

            $pengumpulan = $pengumpulanQuery->get();

            // Transform the data to match frontend expectations
            $pengumpulanData = $pengumpulan->map(function($item) use ($user) {
                $isOtherStudentForSiswa = $user && $user->user_type === 'Siswa' && $item->nis !== $user->reference_id;
                return [
                    'id_pengumpulan' => $item->id_pengumpulan ?? 0,
                    'nis' => $item->nis,
                    'nama_siswa' => $item->nama_siswa,
                    'tanggal_pengumpulan' => $item->tanggal_pengumpulan,
                    // Mask file jawaban milik murid lain jika user adalah siswa
                    'file_pengumpulan' => ($isOtherStudentForSiswa || !$item->file_pengumpulan)
                        ? null
                        : asset('storage/pengumpulan/' . $item->file_pengumpulan),
                    // Mask keterangan siswa milik murid lain jika user adalah siswa
                    'keterangan_siswa' => $isOtherStudentForSiswa ? null : $item->keterangan_siswa,
                    'nilai' => $item->nilai,
                    'status_pengumpulan' => $item->status_pengumpulan,
                    'feedback_guru' => $item->feedback_guru
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $pengumpulanData,
                'message' => 'Data pengumpulan berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pengumpulan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit atau perbarui pengumpulan tugas oleh siswa.
     */
    public function submitPengumpulan(Request $request, $id)
    {
        try {
            // Ambil user terautentikasi dari middleware kustom
            $user = request()->attributes->get('authenticated_user');

            if (!$user || $user->user_type !== 'Siswa') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya siswa yang dapat mengumpulkan tugas'
                ], 403);
            }

            $tugas = Tugas::findOrFail($id);

            // Pastikan tugas memang ditugaskan ke siswa
            $tugasSiswa = TugasSiswa::where('id_tugas', $id)
                ->where('nis', $user->reference_id)
                ->first();

            if (!$tugasSiswa) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas tidak ditugaskan kepada siswa ini'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'file_jawaban' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,txt,jpg,jpeg,png|max:10240',
                'keterangan_siswa' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Handle file upload jika ada
            $fileName = null;
            if ($request->hasFile('file_jawaban')) {
                $file = $request->file('file_jawaban');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('pengumpulan', $fileName, 'public');
            }

            // Cek apakah sudah ada pengumpulan sebelumnya
            $existing = PengumpulanTugas::where('id_tugas', $id)
                ->where('nis', $user->reference_id)
                ->first();

            if ($existing) {
                // Hapus file lama jika diganti
                if ($fileName && $existing->file_jawaban) {
                    Storage::disk('public')->delete('pengumpulan/' . $existing->file_jawaban);
                }

                $existing->update([
                    'tanggal_submit' => now(),
                    'file_jawaban' => $fileName ? $fileName : $existing->file_jawaban,
                    'keterangan_siswa' => $request->input('keterangan_siswa') ?? $existing->keterangan_siswa,
                    'status' => 'Final',
                    'feedback_guru' => $existing->feedback_guru // tidak diubah di sini
                ]);

                $pengumpulanRecord = $existing;
            } else {
                $pengumpulanRecord = PengumpulanTugas::create([
                    'id_tugas' => $id,
                    'nis' => $user->reference_id,
                    'tanggal_submit' => now(),
                    'file_jawaban' => $fileName,
                    'keterangan_siswa' => $request->input('keterangan_siswa'),
                    'status' => 'Final'
                ]);
            }

            // Tentukan status pengumpulan pada tabel tugas_siswa
            $isLate = now()->greaterThan(new \DateTime($tugas->tanggal_deadline));
            $tugasSiswa->update([
                'status_pengumpulan' => $isLate ? 'Terlambat' : 'Sudah'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'id_pengumpulan' => $pengumpulanRecord->id_pengumpulan,
                    'nis' => $user->reference_id,
                    'tanggal_pengumpulan' => $pengumpulanRecord->tanggal_submit,
                    'file_pengumpulan' => $pengumpulanRecord->file_jawaban ? asset('storage/pengumpulan/' . $pengumpulanRecord->file_jawaban) : null,
                    'status_pengumpulan' => $isLate ? 'Terlambat' : 'Sudah_Mengumpulkan'
                ],
                'message' => 'Pengumpulan tugas berhasil disimpan'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengumpulkan tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get form options for creating/editing tugas.
     */
    public function getFormOptions(Request $request)
    {
        try {
            // Get current user from token (similar to JadwalPelajaranController)
            $currentUser = null;
            $token = $request->bearerToken();
            if ($token) {
                $currentUser = DB::table('users')
                    ->where('remember_token', $token)
                    ->where('status', 'Aktif')
                    ->first();
            }

            $tahunAjaranAktif = DB::table('tahun_ajaran')
                ->where('status', 'Aktif')
                ->orderBy('tahun_ajaran', 'desc')
                ->first();

            // Default: get all mata pelajaran and kelas
            $mataPelajaranQuery = DB::table('mata_pelajaran')
                ->where('status', 'Aktif');
            
            $kelasQuery = DB::table('kelas')
                ->orderBy('tingkat', 'asc')
                ->orderBy('nama_kelas', 'asc');

            // If user is a teacher (Guru), filter by their jadwal pelajaran
            if ($currentUser && $currentUser->user_type === 'Guru') {
                // Filter mata pelajaran based on teacher's jadwal pelajaran
                $mataPelajaranQuery = DB::table('jadwal_pelajaran')
                    ->join('mata_pelajaran', 'jadwal_pelajaran.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                    ->where('jadwal_pelajaran.nik_guru', $currentUser->reference_id)
                    ->where('mata_pelajaran.status', 'Aktif')
                    ->select('mata_pelajaran.*')
                    ->distinct();

                if ($tahunAjaranAktif) {
                    $mataPelajaranQuery->where('jadwal_pelajaran.id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran);
                }

                // Filter kelas based on teacher's jadwal pelajaran
                $kelasQuery = DB::table('jadwal_pelajaran')
                    ->join('kelas', 'jadwal_pelajaran.id_kelas', '=', 'kelas.id_kelas')
                    ->where('jadwal_pelajaran.nik_guru', $currentUser->reference_id)
                    ->select('kelas.*')
                    ->distinct()
                    ->orderBy('kelas.tingkat', 'asc')
                    ->orderBy('kelas.nama_kelas', 'asc');

                if ($tahunAjaranAktif) {
                    $kelasQuery->where('jadwal_pelajaran.id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran);
                }
            }

            $mataPelajaran = $mataPelajaranQuery->orderBy('nama_mata_pelajaran', 'asc')->get();
            $kelas = $kelasQuery->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'mata_pelajaran' => $mataPelajaran,
                    'kelas' => $kelas,
                    'tipe_tugas_options' => [
                        'Semua_Siswa' => 'Semua Siswa',
                        'Siswa_Terpilih' => 'Siswa Terpilih'
                    ],
                    'status_options' => [
                        'Aktif' => 'Aktif',
                        'Non-aktif' => 'Non-aktif'
                    ]
                ],
                'message' => 'Form options berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil form options: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get students by class for assignment.
     */
    public function getSiswaByKelas($idKelas)
    {
        try {
            $tahunAjaranAktif = TahunAjaran::active()->first();

            $siswa = DB::table('siswa')
                ->join('kelas_siswa', 'siswa.nis', '=', 'kelas_siswa.nis')
                ->where('kelas_siswa.id_kelas', $idKelas)
                ->where('kelas_siswa.id_tahun_ajaran', $tahunAjaranAktif->id_tahun_ajaran ?? 0)
                ->select('siswa.nis', 'siswa.nama_lengkap')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $siswa,
                'message' => 'Data siswa berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data siswa: ' . $e->getMessage()
            ], 500);
        }
    }
}