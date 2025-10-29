<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            if (!Schema::hasColumn('pengumpulan_tugas', 'keterangan_siswa')) {
                $table->text('keterangan_siswa')->nullable()->after('file_jawaban');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengumpulan_tugas', function (Blueprint $table) {
            if (Schema::hasColumn('pengumpulan_tugas', 'keterangan_siswa')) {
                $table->dropColumn('keterangan_siswa');
            }
        });
    }
};