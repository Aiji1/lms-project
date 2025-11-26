<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JenisPembayaranController extends Controller
{
    /**
     * Get form data untuk dropdown options
     */
    public function getFormData()
    {
        try {
            // Tahun ajaran (format sesuai frontend: { id, tahun_ajaran })
            $tahunAjaran = DB::table('tahun_ajaran')
                ->select('id_tahun_ajaran as id', 'tahun_ajaran')
                ->where('status', 'Aktif')
                ->orderBy('tahun_ajaran')
                ->get();

            // Kelas (format sesuai frontend: { id, nama_kelas, nama_jurusan })
            $kelas = DB::table('kelas as k')
                ->leftJoin('jurusan as j', 'k.id_jurusan', '=', 'j.id_jurusan')
                ->select('k.id_kelas as id', 'k.nama_kelas', DB::raw('COALESCE(j.nama_jurusan, "Tanpa Jurusan") as nama_jurusan'))
                ->orderBy('k.nama_kelas')
                ->get();

            // Siswa (format sesuai frontend: { id, nama_lengkap, nis })
            $siswaRows = DB::table('siswa')
                ->select('nama_lengkap', 'nis')
                ->where('status', 'Aktif')
                ->orderBy('nama_lengkap')
                ->get();
            $siswa = [];
            $i = 1;
            foreach ($siswaRows as $row) {
                $siswa[] = [
                    'id' => $i++,
                    'nama_lengkap' => $row->nama_lengkap,
                    'nis' => $row->nis,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'tahun_ajaran' => $tahunAjaran,
                    'kelas' => $kelas,
                    'siswa' => $siswa,
                    'tipe_periode' => [
                        ['value' => 'bulanan', 'label' => 'Bulanan (Setiap Bulan)'],
                        ['value' => 'custom', 'label' => 'Bulan Tertentu'],
                        ['value' => 'sekali', 'label' => 'Sekali Bayar']
                    ],
                    'tipe_siswa' => [
                        ['value' => 'semua', 'label' => 'Semua Siswa'],
                        ['value' => 'kelas', 'label' => 'Kelas Tertentu'],
                        ['value' => 'individu', 'label' => 'Siswa Tertentu']
                    ],
                    'bulan' => [
                        ['value' => 1, 'label' => 'Januari'],
                        ['value' => 2, 'label' => 'Februari'],
                        ['value' => 3, 'label' => 'Maret'],
                        ['value' => 4, 'label' => 'April'],
                        ['value' => 5, 'label' => 'Mei'],
                        ['value' => 6, 'label' => 'Juni'],
                        ['value' => 7, 'label' => 'Juli'],
                        ['value' => 8, 'label' => 'Agustus'],
                        ['value' => 9, 'label' => 'September'],
                        ['value' => 10, 'label' => 'Oktober'],
                        ['value' => 11, 'label' => 'November'],
                        ['value' => 12, 'label' => 'Desember']
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data form',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /** Unduh template import (CSV) */
    public function template()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="template-jenis-pembayaran.csv"'
        ];
        $csv = "nama_pembayaran,deskripsi,nominal,tipe_periode,tipe_siswa,id_tahun_ajaran\n";
        $csv .= "SPP Bulanan,,250000,bulanan,semua,\n";
        return response($csv, 200, $headers);
    }

    /** Export daftar jenis pembayaran (CSV) */
    public function export(Request $request)
    {
        $rows = DB::table('jenis_pembayaran')->select('id_jenis_pembayaran','kode','nama_pembayaran','deskripsi','nominal','tipe_periode','tipe_siswa','id_tahun_ajaran','is_active')->orderBy('nama_pembayaran')->get();
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="jenis-pembayaran-export.csv"'
        ];
        $csv = "id,kode,nama_pembayaran,deskripsi,nominal,tipe_periode,tipe_siswa,id_tahun_ajaran,is_active\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [
                $r->id_jenis_pembayaran,
                $r->kode,
                '"'.str_replace('"','""',$r->nama_pembayaran).'"',
                '"'.str_replace('"','""',$r->deskripsi).'"',
                (int)$r->nominal,
                $r->tipe_periode,
                $r->tipe_siswa,
                $r->id_tahun_ajaran,
                (int)$r->is_active,
            ])."\n";
        }
        return response($csv, 200, $headers);
    }

    /**
     * List jenis pembayaran dengan relasi
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int)($request->get('per_page', 10));
            $search = $request->get('search', '');

            $query = DB::table('jenis_pembayaran as jp')
                ->leftJoin('tahun_ajaran as ta', 'jp.id_tahun_ajaran', '=', 'ta.id_tahun_ajaran')
                ->select(
                    'jp.id_jenis_pembayaran',
                    'jp.kode',
                    'jp.nama_pembayaran',
                    'jp.nama',
                    'jp.deskripsi',
                    'jp.nominal',
                    'jp.nominal_default',
                    'jp.tipe_periode',
                    'jp.tipe_siswa',
                    'jp.id_tahun_ajaran',
                    'jp.is_active',
                    'jp.created_at',
                    'ta.tahun_ajaran'
                )
                ->orderBy('jp.nama_pembayaran');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('jp.nama_pembayaran', 'like', "%{$search}%")
                      ->orWhere('jp.nama', 'like', "%{$search}%")
                      ->orWhere('jp.kode', 'like', "%{$search}%");
                });
            }

            $pagination = $query->paginate($perPage);

            $items = collect($pagination->items())->map(function ($item) {
                $id = $item->id_jenis_pembayaran;

                $periodeBulan = [];
                if ($item->tipe_periode === 'custom') {
                    $periodeBulan = DB::table('jenis_pembayaran_periode')
                        ->where('id_jenis_pembayaran', $id)
                        ->pluck('bulan')
                        ->toArray();
                }

                $jumlahKelas = 0;
                if ($item->tipe_siswa === 'kelas') {
                    $jumlahKelas = DB::table('jenis_pembayaran_kelas')
                        ->where('id_jenis_pembayaran', $id)
                        ->count();
                }

                $jumlahSiswa = 0;
                if ($item->tipe_siswa === 'individu') {
                    $jumlahSiswa = DB::table('jenis_pembayaran_siswa')
                        ->where('id_jenis_pembayaran', $id)
                        ->count();
                }

                $monthNames = [1=>'Januari',2=>'Februari',3=>'Maret',4=>'April',5=>'Mei',6=>'Juni',7=>'Juli',8=>'Agustus',9=>'September',10=>'Oktober',11=>'November',12=>'Desember'];
                $periodeDisplay = $item->tipe_periode === 'bulanan' ? 'Setiap bulan' : ($item->tipe_periode === 'sekali' ? 'Sekali bayar' : (count($periodeBulan) ? implode(', ', array_map(fn($b) => $monthNames[(int)$b] ?? $b, $periodeBulan)) : null));
                $targetDisplay = $item->tipe_siswa === 'semua' ? 'Semua siswa' : ($item->tipe_siswa === 'kelas' ? ($jumlahKelas . ' kelas') : ($jumlahSiswa . ' siswa'));

                return [
                    'id' => $id,
                    'kode' => $item->kode ?? null,
                    'nama' => $item->nama_pembayaran ?? $item->nama ?? '',
                    'deskripsi' => $item->deskripsi ?? '',
                    'nominal' => (int)($item->nominal ?? $item->nominal_default ?? 0),
                    'tipe_periode' => $item->tipe_periode,
                    'tipe_siswa' => $item->tipe_siswa,
                    'id_tahun_ajaran' => $item->id_tahun_ajaran,
                    'tahun_ajaran' => $item->tahun_ajaran,
                    'is_active' => (bool)$item->is_active,
                    'periode_display' => $periodeDisplay,
                    'target_display' => $targetDisplay,
                    'jumlah_periode' => count($periodeBulan),
                    'jumlah_kelas' => $jumlahKelas,
                    'jumlah_siswa' => $jumlahSiswa,
                    'created_at' => $item->created_at,
                ];
            })->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $items,
                    'current_page' => $pagination->currentPage(),
                    'per_page' => $pagination->perPage(),
                    'total' => $pagination->total(),
                    'last_page' => $pagination->lastPage(),
                    'from' => $pagination->firstItem(),
                    'to' => $pagination->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Detail jenis pembayaran dengan relasi lengkap
     */
    public function show($id)
    {
        try {
            $jenisPembayaran = DB::table('jenis_pembayaran as jp')
                ->select(
                    'jp.*',
                    'ta.tahun_ajaran'
                )
                ->leftJoin('tahun_ajaran as ta', 'jp.id_tahun_ajaran', '=', 'ta.id_tahun_ajaran')
                ->where('jp.id_jenis_pembayaran', $id)
                ->first();

            if (!$jenisPembayaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis pembayaran tidak ditemukan'
                ], 404);
            }

            // Get periode bulan
            $periode = DB::table('jenis_pembayaran_periode')
                ->where('id_jenis_pembayaran', $id)
                ->pluck('bulan')
                ->toArray();

            // Get kelas dengan JOIN ke jurusan
            $kelas = DB::table('jenis_pembayaran_kelas as jpk')
                ->join('kelas as k', 'jpk.id_kelas', '=', 'k.id_kelas')
                ->leftJoin('jurusan as j', 'k.id_jurusan', '=', 'j.id_jurusan')
                ->select('k.id_kelas', 'k.nama_kelas', 'j.nama_jurusan')
                ->where('jpk.id_jenis_pembayaran', $id)
                ->get();

            // Get siswa
            $siswa = DB::table('jenis_pembayaran_siswa as jps')
                ->join('siswa as s', 'jps.nis', '=', 's.nis')
                ->select('s.nis', 's.nama_lengkap')
                ->where('jps.id_jenis_pembayaran', $id)
                ->get();

            $jenisPembayaran->periode_bulan = $periode;
            $jenisPembayaran->kelas = $kelas;
            $jenisPembayaran->siswa = $siswa;

            return response()->json([
                'success' => true,
                'data' => $jenisPembayaran
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create jenis pembayaran dengan relasi
     */
    public function store(Request $request)
    {
        // Terima baik field versi frontend (id_kelas, id_siswa) maupun versi backend (kelas_ids, siswa_nis)
        $payload = $request->all();
        if (isset($payload['id_siswa']) && !isset($payload['siswa_nis'])) {
            $payload['siswa_nis'] = $payload['id_siswa'];
        }
        if (isset($payload['id_kelas']) && !isset($payload['kelas_ids'])) {
            $payload['kelas_ids'] = $payload['id_kelas'];
        }
        if (isset($payload['nama']) && !isset($payload['nama_pembayaran'])) {
            $payload['nama_pembayaran'] = $payload['nama'];
        }

        $validator = Validator::make($payload, [
            'nama_pembayaran' => 'required|string|max:100',
            'nominal' => 'required|numeric|min:0',
            'tipe_periode' => 'required|in:bulanan,custom,sekali',
            'tipe_siswa' => 'required|in:semua,kelas,individu',
            'id_tahun_ajaran' => 'nullable|exists:tahun_ajaran,id_tahun_ajaran',
            'deskripsi' => 'nullable|string',
            'periode_bulan' => 'required_if:tipe_periode,custom|array',
            'periode_bulan.*' => 'integer|min:1|max:12',
            'kelas_ids' => 'required_if:tipe_siswa,kelas|array',
            'kelas_ids.*' => 'exists:kelas,id_kelas',
            'siswa_nis' => 'required_if:tipe_siswa,individu|array',
            'siswa_nis.*' => 'exists:siswa,nis'
        ], [
            'nama_pembayaran.required' => 'Nama pembayaran wajib diisi',
            'nominal.required' => 'Nominal wajib diisi',
            'nominal.min' => 'Nominal tidak boleh negatif',
            'tipe_periode.required' => 'Tipe periode wajib dipilih',
            'tipe_siswa.required' => 'Tipe siswa wajib dipilih',
            'periode_bulan.required_if' => 'Bulan periode wajib dipilih untuk tipe custom',
            'kelas_ids.required_if' => 'Minimal 1 kelas harus dipilih',
            'siswa_nis.required_if' => 'Minimal 1 siswa harus dipilih'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Generate kode otomatis jika tidak disediakan
            $kode = $payload['kode'] ?? strtoupper(preg_replace('/[^A-Z0-9_]/', '_', str_replace(' ', '_', $payload['nama_pembayaran'])));

            // Insert jenis pembayaran
            $id = DB::table('jenis_pembayaran')->insertGetId([
                'nama_pembayaran' => $payload['nama_pembayaran'],
                'deskripsi' => $payload['deskripsi'] ?? null,
                'nominal' => $payload['nominal'],
                'tipe_periode' => $payload['tipe_periode'],
                'tipe_siswa' => $payload['tipe_siswa'],
                'id_tahun_ajaran' => $payload['id_tahun_ajaran'] ?? null,
                'is_active' => 1,
                'kode' => $kode,
                'nama' => $payload['nama_pembayaran'],
                'nominal_default' => $payload['nominal'],
                'status' => 'Aktif',
                'created_at' => now()
            ]);

            // Insert periode bulan jika custom
            if ($payload['tipe_periode'] === 'custom' && !empty($payload['periode_bulan'])) {
                foreach ($payload['periode_bulan'] as $bulan) {
                    DB::table('jenis_pembayaran_periode')->insert([
                        'id_jenis_pembayaran' => $id,
                        'bulan' => $bulan,
                        'created_at' => now()
                    ]);
                }
            }

            // Insert relasi kelas jika tipe_siswa = kelas
            if ($payload['tipe_siswa'] === 'kelas' && !empty($payload['kelas_ids'])) {
                foreach ($payload['kelas_ids'] as $kelas_id) {
                    DB::table('jenis_pembayaran_kelas')->insert([
                        'id_jenis_pembayaran' => $id,
                        'id_kelas' => $kelas_id,
                        'created_at' => now()
                    ]);
                }
            }

            // Insert relasi siswa jika tipe_siswa = individu
            if ($payload['tipe_siswa'] === 'individu' && !empty($payload['siswa_nis'])) {
                foreach ($payload['siswa_nis'] as $nis) {
                    DB::table('jenis_pembayaran_siswa')->insert([
                        'id_jenis_pembayaran' => $id,
                        'nis' => $nis,
                        'created_at' => now()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis pembayaran berhasil ditambahkan',
                'data' => ['id_jenis_pembayaran' => $id]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update jenis pembayaran dengan relasi
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama_pembayaran' => 'required|string|max:100',
            'nominal' => 'required|numeric|min:0',
            'tipe_periode' => 'required|in:bulanan,custom,sekali',
            'tipe_siswa' => 'required|in:semua,kelas,individu',
            'id_tahun_ajaran' => 'nullable|exists:tahun_ajaran,id_tahun_ajaran',
            'deskripsi' => 'nullable|string',
            'periode_bulan' => 'required_if:tipe_periode,custom|array',
            'periode_bulan.*' => 'integer|min:1|max:12',
            'kelas_ids' => 'required_if:tipe_siswa,kelas|array',
            'kelas_ids.*' => 'exists:kelas,id_kelas',
            'siswa_nis' => 'required_if:tipe_siswa,individu|array',
            'siswa_nis.*' => 'exists:siswa,nis',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Cek apakah data exists
            $exists = DB::table('jenis_pembayaran')
                ->where('id_jenis_pembayaran', $id)
                ->exists();

            if (!$exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis pembayaran tidak ditemukan'
                ], 404);
            }

            // Update jenis pembayaran
            $kode = strtoupper(preg_replace('/[^A-Z0-9_]/', '_', str_replace(' ', '_', $request->nama_pembayaran)));

            DB::table('jenis_pembayaran')
                ->where('id_jenis_pembayaran', $id)
                ->update([
                    'nama_pembayaran' => $request->nama_pembayaran,
                    'deskripsi' => $request->deskripsi,
                    'nominal' => $request->nominal,
                    'tipe_periode' => $request->tipe_periode,
                    'tipe_siswa' => $request->tipe_siswa,
                    'id_tahun_ajaran' => $request->id_tahun_ajaran,
                    'is_active' => $request->has('is_active') ? $request->is_active : 1,
                    'kode' => $kode,
                    'nama' => $request->nama_pembayaran,
                    'nominal_default' => $request->nominal,
                    'updated_at' => now()
                ]);

            // Hapus dan insert ulang periode bulan
            DB::table('jenis_pembayaran_periode')
                ->where('id_jenis_pembayaran', $id)
                ->delete();

            if ($request->tipe_periode === 'custom' && !empty($request->periode_bulan)) {
                foreach ($request->periode_bulan as $bulan) {
                    DB::table('jenis_pembayaran_periode')->insert([
                        'id_jenis_pembayaran' => $id,
                        'bulan' => $bulan,
                        'created_at' => now()
                    ]);
                }
            }

            // Hapus dan insert ulang relasi kelas
            DB::table('jenis_pembayaran_kelas')
                ->where('id_jenis_pembayaran', $id)
                ->delete();

            if ($request->tipe_siswa === 'kelas' && !empty($request->kelas_ids)) {
                foreach ($request->kelas_ids as $kelas_id) {
                    DB::table('jenis_pembayaran_kelas')->insert([
                        'id_jenis_pembayaran' => $id,
                        'id_kelas' => $kelas_id,
                        'created_at' => now()
                    ]);
                }
            }

            // Hapus dan insert ulang relasi siswa
            DB::table('jenis_pembayaran_siswa')
                ->where('id_jenis_pembayaran', $id)
                ->delete();

            if ($request->tipe_siswa === 'individu' && !empty($request->siswa_nis)) {
                foreach ($request->siswa_nis as $nis) {
                    DB::table('jenis_pembayaran_siswa')->insert([
                        'id_jenis_pembayaran' => $id,
                        'nis' => $nis,
                        'created_at' => now()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis pembayaran berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete jenis pembayaran
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            // Hapus tagihan yang terkait agar penghapusan fleksibel
            DB::table('tagihan')
                ->where('id_jenis_pembayaran', $id)
                ->delete();

            // Hapus relasi
            DB::table('jenis_pembayaran_periode')->where('id_jenis_pembayaran', $id)->delete();
            DB::table('jenis_pembayaran_kelas')->where('id_jenis_pembayaran', $id)->delete();
            DB::table('jenis_pembayaran_siswa')->where('id_jenis_pembayaran', $id)->delete();

            // Hapus jenis pembayaran
            $deleted = DB::table('jenis_pembayaran')
                ->where('id_jenis_pembayaran', $id)
                ->delete();

            if (!$deleted) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis pembayaran tidak ditemukan'
                ], 404);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jenis pembayaran berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jenis pembayaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate tagihan berdasarkan jenis pembayaran
     */
    public function generateTagihan(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'bulan' => 'nullable|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2020',
            'tanggal_jatuh_tempo' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Get jenis pembayaran
            $jenisPembayaran = DB::table('jenis_pembayaran')
                ->where('id_jenis_pembayaran', $id)
                ->first();

            if (!$jenisPembayaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis pembayaran tidak ditemukan'
                ], 404);
            }

            $generated = 0;
            $skipped = 0;
            $siswaList = [];

            // Get siswa berdasarkan tipe_siswa
            if ($jenisPembayaran->tipe_siswa === 'semua') {
                // Semua siswa aktif
                $siswaList = DB::table('siswa')
                    ->where('status', 'Aktif')
                    ->pluck('nis')
                    ->toArray();
            } elseif ($jenisPembayaran->tipe_siswa === 'kelas') {
                // Siswa di kelas tertentu
                $kelasIds = DB::table('jenis_pembayaran_kelas')
                    ->where('id_jenis_pembayaran', $id)
                    ->pluck('id_kelas')
                    ->toArray();

                $siswaList = DB::table('siswa')
                    ->whereIn('id_kelas', $kelasIds)
                    ->where('status', 'Aktif')
                    ->pluck('nis')
                    ->toArray();
            } elseif ($jenisPembayaran->tipe_siswa === 'individu') {
                // Siswa tertentu
                $siswaList = DB::table('jenis_pembayaran_siswa')
                    ->where('id_jenis_pembayaran', $id)
                    ->pluck('nis')
                    ->toArray();
            }

            if (empty($siswaList)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ada siswa yang sesuai dengan konfigurasi jenis pembayaran'
                ], 400);
            }

            // Generate tagihan untuk setiap siswa
            foreach ($siswaList as $nis) {
                // Cek apakah tagihan sudah ada (untuk tipe bulanan/custom)
                if ($jenisPembayaran->tipe_periode !== 'sekali') {
                    $exists = DB::table('tagihan')
                        ->where('nis', $nis)
                        ->where('id_jenis_pembayaran', $id)
                        ->where('bulan_tagihan', $request->bulan)
                        ->where('tahun_tagihan', $request->tahun)
                        ->exists();
                } else {
                    // Untuk sekali bayar, cek tanpa bulan
                    $exists = DB::table('tagihan')
                        ->where('nis', $nis)
                        ->where('id_jenis_pembayaran', $id)
                        ->where('tahun_tagihan', $request->tahun)
                        ->exists();
                }

                if ($exists) {
                    $skipped++;
                    continue;
                }

                DB::table('tagihan')->insert([
                    'nis' => $nis,
                    'id_jenis_pembayaran' => $id,
                    'id_tahun_ajaran' => $jenisPembayaran->id_tahun_ajaran,
                    'bulan_tagihan' => $jenisPembayaran->tipe_periode === 'sekali' ? null : sprintf('%02d', $request->bulan),
                    'tahun_tagihan' => $request->tahun,
                    'nominal_tagihan' => $jenisPembayaran->nominal,
                    'tanggal_jatuh_tempo' => $request->tanggal_jatuh_tempo,
                    'status_tagihan' => 'Belum_Bayar',
                    'keterangan' => null,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $generated++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil generate {$generated} tagihan baru" . ($skipped > 0 ? ", {$skipped} tagihan sudah ada (dilewati)" : ""),
                'data' => [
                    'total_siswa' => count($siswaList),
                    'generated' => $generated,
                    'skipped' => $skipped
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate tagihan',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
