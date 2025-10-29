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
        Schema::table('siswa', function (Blueprint $table) {
            $table->string('barcode', 50)->nullable()->unique()->comment('Barcode unik untuk siswa');
            $table->string('rfid_code', 50)->nullable()->unique()->comment('RFID code unik untuk siswa');
            $table->timestamp('barcode_generated_at')->nullable()->comment('Waktu barcode di-generate');
            $table->timestamp('rfid_assigned_at')->nullable()->comment('Waktu RFID di-assign');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('siswa', function (Blueprint $table) {
            $table->dropColumn(['barcode', 'rfid_code', 'barcode_generated_at', 'rfid_assigned_at']);
        });
    }
};