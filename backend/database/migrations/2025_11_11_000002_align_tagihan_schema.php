<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('tagihan')) {
            Schema::create('tagihan', function (Blueprint $table) {
                $table->id();
                $table->string('kode_tagihan', 100)->unique();
                $table->string('judul', 150);
                $table->string('jenis_kode', 100)->nullable();
                $table->unsignedBigInteger('id_kelas')->nullable();
                $table->integer('total_nominal')->default(0);
                $table->date('tanggal_terbit')->nullable();
                $table->string('status', 20)->default('Aktif');
                $table->timestamps();
            });
            return;
        }

        // Jika tabel sudah ada, tambahkan kolom yang hilang tanpa mengganggu data lama
        Schema::table('tagihan', function (Blueprint $table) {
            if (!Schema::hasColumn('tagihan', 'kode_tagihan')) { $table->string('kode_tagihan', 100)->nullable()->after('id'); }
            if (!Schema::hasColumn('tagihan', 'judul')) { $table->string('judul', 150)->nullable()->after('kode_tagihan'); }
            if (!Schema::hasColumn('tagihan', 'jenis_kode')) { $table->string('jenis_kode', 100)->nullable()->after('judul'); }
            if (!Schema::hasColumn('tagihan', 'id_kelas')) { $table->unsignedBigInteger('id_kelas')->nullable()->after('jenis_kode'); }
            if (!Schema::hasColumn('tagihan', 'total_nominal')) { $table->integer('total_nominal')->default(0)->after('id_kelas'); }
            if (!Schema::hasColumn('tagihan', 'tanggal_terbit')) { $table->date('tanggal_terbit')->nullable()->after('total_nominal'); }
            if (!Schema::hasColumn('tagihan', 'status')) { $table->string('status', 20)->default('Aktif')->after('tanggal_terbit'); }
        });

        // Upaya ringan backfill untuk kolom wajib agar sesuai tampilan (opsional, aman)
        try {
            // Jika tidak ada kode_tagihan, isi menggunakan pola TAG-YYYY-### berdasarkan tanggal_terbit
            $rows = DB::table('tagihan')->select('id','kode_tagihan','judul','tanggal_terbit')->get();
            $counter = 1;
            foreach ($rows as $r) {
                $update = [];
                if (empty($r->kode_tagihan)) {
                    $year = null;
                    if (!empty($r->tanggal_terbit)) { $year = substr((string)$r->tanggal_terbit, 0, 4); }
                    $year = $year ?: date('Y');
                    $update['kode_tagihan'] = sprintf('TAG-%s-%03d', $year, $counter++);
                }
                if (empty($r->judul)) {
                    $update['judul'] = 'Tagihan ' . ($r->kode_tagihan ?? ('BARU-' . $r->id));
                }
                if (!empty($update)) {
                    DB::table('tagihan')->where('id', $r->id)->update($update);
                }
            }
        } catch (\Throwable $e) {
            // Abaikan error backfill agar migrasi tetap berjalan
        }
    }

    public function down(): void
    {
        // Tidak drop tabel karena kemungkinan sudah dipakai. Hanya drop kolom yang ditambahkan.
        if (!Schema::hasTable('tagihan')) { return; }
        Schema::table('tagihan', function (Blueprint $table) {
            if (Schema::hasColumn('tagihan', 'status')) { $table->dropColumn('status'); }
            if (Schema::hasColumn('tagihan', 'tanggal_terbit')) { $table->dropColumn('tanggal_terbit'); }
            if (Schema::hasColumn('tagihan', 'total_nominal')) { $table->dropColumn('total_nominal'); }
            if (Schema::hasColumn('tagihan', 'id_kelas')) { $table->dropColumn('id_kelas'); }
            if (Schema::hasColumn('tagihan', 'jenis_kode')) { $table->dropColumn('jenis_kode'); }
            if (Schema::hasColumn('tagihan', 'judul')) { $table->dropColumn('judul'); }
            if (Schema::hasColumn('tagihan', 'kode_tagihan')) { $table->dropColumn('kode_tagihan'); }
        });
    }
};