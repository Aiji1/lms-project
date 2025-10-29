<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('modul_ajar', function (Blueprint $table) {
            $table->id('id_modul');
            $table->string('judul_modul');
            $table->unsignedBigInteger('id_mata_pelajaran')->nullable();
            $table->unsignedBigInteger('id_kelas')->nullable();
            $table->string('nik_guru')->nullable();
            $table->string('tipe_file', 20)->nullable();
            $table->unsignedBigInteger('ukuran_bytes')->default(0);
            $table->string('file_path');
            $table->enum('status', ['Menunggu', 'Disetujui', 'Ditolak'])->default('Menunggu');
            $table->unsignedInteger('downloads_count')->default(0);
            $table->timestamp('tanggal_upload')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modul_ajar');
    }
};