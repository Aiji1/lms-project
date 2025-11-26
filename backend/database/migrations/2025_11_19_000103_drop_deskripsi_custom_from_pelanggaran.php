<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement('ALTER TABLE pelanggaran DROP COLUMN deskripsi_custom');
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE pelanggaran ADD COLUMN deskripsi_custom VARCHAR(200) DEFAULT NULL COMMENT 'Deskripsi custom untuk jenis Other'");
    }
};