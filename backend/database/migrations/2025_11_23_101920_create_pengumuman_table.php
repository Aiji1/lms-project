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
        Schema::create('pengumuman', function (Blueprint $table) {
            $table->id('id_pengumuman');
            
            // Informasi Dasar
            $table->string('judul', 255);
            $table->text('konten');
            
            // Kategori & Prioritas
            $table->enum('kategori', ['Umum', 'Akademik', 'Kegiatan', 'Keuangan', 'Keagamaan'])->default('Umum');
            $table->enum('prioritas', ['Normal', 'Penting', 'Sangat Penting'])->default('Normal');
            
            // File Lampiran
            $table->string('file_lampiran', 500)->nullable();
            $table->string('file_original_name', 255)->nullable();
            
            // Tanggal Berlaku
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai')->nullable();
            
            // Pin Feature
            $table->boolean('is_pinned')->default(false);
            $table->integer('pin_order')->default(0); // untuk urutan pin
            
            // Status
            $table->enum('status', ['Draft', 'Published', 'Archived'])->default('Draft');
            
            // Target Audience - Role Based
            $table->json('target_roles')->nullable(); // ["Admin", "Guru", "Siswa"]
            
            // Target Audience - Tingkat
            $table->json('target_tingkat')->nullable(); // ["10", "11", "12"] atau "all"
            
            // Target Audience - Kelas
            $table->json('target_kelas')->nullable(); // [1, 2, 3] (id_kelas) atau "all"
            
            // Target Audience - Siswa Spesifik
            $table->json('target_siswa')->nullable(); // ["NIS1", "NIS2"] atau "all"
            
            // Target Type untuk kemudahan filtering
            $table->enum('target_type', ['all', 'roles', 'tingkat', 'kelas', 'siswa_spesifik'])->default('all');
            
            // Pembuat
            $table->unsignedBigInteger('dibuat_oleh');
            $table->string('dibuat_oleh_nama', 255);
            $table->enum('dibuat_oleh_role', ['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan']);
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes(); // untuk soft delete
            
            // Indexes
            $table->index('kategori');
            $table->index('prioritas');
            $table->index('status');
            $table->index('is_pinned');
            $table->index('tanggal_mulai');
            $table->index('tanggal_selesai');
            $table->index('dibuat_oleh');
            $table->index('created_at');
        });
        
        // Tabel untuk tracking siapa yang sudah baca pengumuman
        Schema::create('pengumuman_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_pengumuman');
            $table->unsignedBigInteger('user_id'); // bisa dari users.user_id atau siswa.nis
            $table->string('user_identifier', 100); // username atau NIS
            $table->enum('user_type', ['Admin', 'Kepala_Sekolah', 'Guru', 'Siswa', 'Orang_Tua', 'Petugas_Keuangan']);
            $table->timestamp('dibaca_pada');
            
            $table->foreign('id_pengumuman')
                ->references('id_pengumuman')
                ->on('pengumuman')
                ->onDelete('cascade');
            
            // Unique constraint: satu user hanya bisa mark read sekali per pengumuman
            $table->unique(['id_pengumuman', 'user_identifier']);
            
            $table->index('user_identifier');
            $table->index('id_pengumuman');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengumuman_reads');
        Schema::dropIfExists('pengumuman');
    }
};