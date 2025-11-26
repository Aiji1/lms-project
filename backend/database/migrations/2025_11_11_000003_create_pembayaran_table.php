<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('pembayaran')) {
            Schema::create('pembayaran', function (Blueprint $table) {
                $table->id();
                $table->string('kode_transaksi', 100)->unique();
                $table->string('nis', 50);
                $table->string('nama_siswa', 150)->nullable();
                $table->string('jenis_kode', 100)->nullable();
                $table->string('tagihan_kode', 100)->nullable();
                $table->integer('nominal')->default(0);
                $table->date('tanggal_bayar');
                $table->string('metode', 50)->default('Manual');
                $table->string('status', 20)->default('Berhasil');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pembayaran')) {
            Schema::dropIfExists('pembayaran');
        }
    }
};