<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('jenis_pembayaran')) {
            return; // Nothing to align
        }

        Schema::table('jenis_pembayaran', function (Blueprint $table) {
            // Tambahkan kolom yang digunakan UI baru jika belum ada
            if (!Schema::hasColumn('jenis_pembayaran', 'kode')) {
                $table->string('kode', 100)->nullable()->after('id_jenis_pembayaran');
            }
            if (!Schema::hasColumn('jenis_pembayaran', 'nama')) {
                $table->string('nama', 150)->nullable()->after('kode');
            }
            if (!Schema::hasColumn('jenis_pembayaran', 'nominal_default')) {
                $table->integer('nominal_default')->nullable()->after('nama');
            }
            if (!Schema::hasColumn('jenis_pembayaran', 'deskripsi')) {
                $table->text('deskripsi')->nullable()->after('nominal_default');
            }
        });

        // Backfill data dari skema lama ke kolom baru
        try {
            $rows = DB::table('jenis_pembayaran')->select('*')->get();
            foreach ($rows as $r) {
                // Sumber nama: nama kolom baru atau nama_pembayaran lama
                $nama = $r->nama ?? $r->nama_pembayaran ?? null;
                // Bangun kode dari nama jika belum ada
                $kode = $r->kode ?? null;
                if (empty($kode) && !empty($nama)) {
                    $kode = strtoupper(preg_replace('/[^A-Z0-9_]/', '', str_replace(' ', '_', $nama)));
                }
                // nominal_default dari nominal lama bila belum ada
                $nominalDefault = $r->nominal_default ?? $r->nominal ?? null;
                // deskripsi dari periode bila belum ada
                $deskripsi = $r->deskripsi ?? $r->periode ?? null;

                $update = [];
                if (!empty($kode) && (!isset($r->kode) || $r->kode !== $kode)) { $update['kode'] = $kode; }
                if (!empty($nama) && (!isset($r->nama) || $r->nama !== $nama)) { $update['nama'] = $nama; }
                if ($nominalDefault !== null && (!isset($r->nominal_default) || (int)$r->nominal_default !== (int)$nominalDefault)) { $update['nominal_default'] = (int)$nominalDefault; }
                if ($deskripsi !== null && (!isset($r->deskripsi) || $r->deskripsi !== $deskripsi)) { $update['deskripsi'] = (string)$deskripsi; }

                if (!empty($update)) {
                    // Gunakan id_jenis_pembayaran bila tersedia, fallback ke id
                    if (Schema::hasColumn('jenis_pembayaran', 'id_jenis_pembayaran')) {
                        DB::table('jenis_pembayaran')->where('id_jenis_pembayaran', $r->id_jenis_pembayaran)->update($update);
                    } else {
                        DB::table('jenis_pembayaran')->where('id', $r->id)->update($update);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Biarkan migrasi tetap berjalan walau backfill gagal
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('jenis_pembayaran')) { return; }
        Schema::table('jenis_pembayaran', function (Blueprint $table) {
            // Rollback: hapus kolom baru (opsional)
            if (Schema::hasColumn('jenis_pembayaran', 'deskripsi')) { $table->dropColumn('deskripsi'); }
            if (Schema::hasColumn('jenis_pembayaran', 'nominal_default')) { $table->dropColumn('nominal_default'); }
            if (Schema::hasColumn('jenis_pembayaran', 'nama')) { $table->dropColumn('nama'); }
            if (Schema::hasColumn('jenis_pembayaran', 'kode')) { $table->dropColumn('kode'); }
        });
    }
};