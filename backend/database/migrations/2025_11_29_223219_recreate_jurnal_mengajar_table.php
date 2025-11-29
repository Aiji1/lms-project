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
        // Drop existing table with foreign key constraints disabled
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('jurnal_mengajar');
        Schema::enableForeignKeyConstraints();

        // Recreate with correct structure for manual entry (no id_jadwal)
        Schema::create('jurnal_mengajar', function (Blueprint $table) {
            $table->id('id_jurnal');

            // Manual entry fields - matching parent table types
            $table->string('nik_guru', 20);
            $table->integer('id_mata_pelajaran');
            $table->integer('id_kelas');
            $table->date('tanggal');
            $table->integer('jam_ke_mulai');
            $table->integer('jam_ke_selesai');
            $table->enum('status_mengajar', ['Hadir', 'Tidak_Hadir', 'Diganti']);
            $table->text('materi_diajarkan');
            $table->text('keterangan')->nullable();
            $table->timestamp('jam_input')->useCurrent();
            $table->timestamps();

            // Add indexes for foreign key columns
            $table->index('nik_guru');
            $table->index('id_mata_pelajaran');
            $table->index('id_kelas');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jurnal_mengajar');
    }
};
