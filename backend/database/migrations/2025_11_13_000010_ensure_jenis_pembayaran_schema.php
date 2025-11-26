<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('jenis_pembayaran')) {
            Schema::create('jenis_pembayaran', function (Blueprint $table) {
                $table->id();
                $table->string('kode', 50)->unique();
                $table->string('nama', 100);
                // Gunakan unsignedBigInteger untuk nilai rupiah agar aman dari overflow
                $table->unsignedBigInteger('nominal_default')->default(0);
                // Simpan deskripsi sebagai JSON string (frontend kadang kirim object)
                $table->json('deskripsi')->nullable();
                $table->string('status', 16)->default('Aktif');
                $table->timestamps();
            });
        } else {
            // Pastikan kolom-kolom penting tersedia pada tabel yang sudah ada
            Schema::table('jenis_pembayaran', function (Blueprint $table) {
                if (!Schema::hasColumn('jenis_pembayaran', 'kode')) {
                    $table->string('kode', 50)->nullable();
                }
                if (!Schema::hasColumn('jenis_pembayaran', 'nama')) {
                    $table->string('nama', 100)->nullable();
                }
                if (!Schema::hasColumn('jenis_pembayaran', 'nominal_default')) {
                    $table->unsignedBigInteger('nominal_default')->default(0)->nullable();
                }
                if (!Schema::hasColumn('jenis_pembayaran', 'deskripsi')) {
                    $table->json('deskripsi')->nullable();
                }
                if (!Schema::hasColumn('jenis_pembayaran', 'status')) {
                    $table->string('status', 16)->default('Aktif')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        // Tidak melakukan rollback destruktif untuk menjaga skema eksisting.
        // Jika perlu, buat migrasi baru khusus untuk penyesuaian skema.
    }
};