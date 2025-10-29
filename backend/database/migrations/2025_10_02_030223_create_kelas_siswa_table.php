<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kelas_siswa', function (Blueprint $table) {
            $table->id('id_kelas_siswa')->comment('ID kelas siswa');
            $table->string('nis', 20)->comment('NIS siswa');
            $table->integer('id_kelas')->comment('ID kelas');
            $table->integer('id_tahun_ajaran')->comment('ID tahun ajaran');
            $table->enum('status', ['Aktif', 'Non-aktif'])->default('Aktif')->comment('Status aktif');
            $table->timestamps();
            
            // Add indexes for better performance
            $table->index(['nis', 'id_kelas', 'id_tahun_ajaran']);
            $table->index('id_kelas');
            $table->index('id_tahun_ajaran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelas_siswa');
    }
};
