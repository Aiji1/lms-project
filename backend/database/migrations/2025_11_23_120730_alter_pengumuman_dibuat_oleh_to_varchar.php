<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('pengumuman')) { return; }
        try {
            DB::statement('ALTER TABLE pengumuman MODIFY dibuat_oleh VARCHAR(100) NOT NULL');
        } catch (\Throwable $e) {
            // ignore if already modified
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('pengumuman')) { return; }
        try {
            DB::statement('ALTER TABLE pengumuman MODIFY dibuat_oleh BIGINT UNSIGNED NOT NULL');
        } catch (\Throwable $e) {
            // ignore rollback errors
        }
    }
};

