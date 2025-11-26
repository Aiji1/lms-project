<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('pengumuman_reads')) { return; }
        try {
            DB::statement('ALTER TABLE pengumuman_reads MODIFY user_id VARCHAR(100) NOT NULL');
        } catch (\Throwable $e) {
            // ignore if already modified
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('pengumuman_reads')) { return; }
        try {
            DB::statement('ALTER TABLE pengumuman_reads MODIFY user_id BIGINT UNSIGNED NOT NULL');
        } catch (\Throwable $e) {
            // ignore rollback errors
        }
    }
};

