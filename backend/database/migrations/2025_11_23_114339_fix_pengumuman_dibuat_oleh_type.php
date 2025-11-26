<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengumuman', function (Blueprint $table) {
            // Ubah dibuat_oleh dari bigint ke varchar
            $table->string('dibuat_oleh', 50)->change();
        });
    }

    public function down(): void
    {
        Schema::table('pengumuman', function (Blueprint $table) {
            $table->unsignedBigInteger('dibuat_oleh')->change();
        });
    }
};