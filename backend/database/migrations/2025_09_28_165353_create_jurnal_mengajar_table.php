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
        Schema::create('jurnal_mengajar', function (Blueprint $table) {
            $table->id('id_jurnal');
            $table->unsignedBigInteger('id_jadwal');
            $table->date('tanggal');
            $table->enum('status_mengajar', ['Hadir', 'Tidak_Hadir', 'Diganti']);
            $table->text('materi_diajarkan');
            $table->text('keterangan')->nullable();
            $table->timestamp('jam_input')->useCurrent();
            $table->timestamps();
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
