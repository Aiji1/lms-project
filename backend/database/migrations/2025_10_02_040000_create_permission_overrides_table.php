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
        Schema::create('permission_overrides', function (Blueprint $table) {
            $table->id('id_override');
            // role atau user
            $table->string('target_type'); // 'role' | 'user'
            $table->string('target_id');   // nama role atau user_id
            // key resource (gunakan href menu atau label jika tidak ada href)
            $table->string('resource_key');
            // permissions
            $table->boolean('view')->default(false);
            $table->boolean('create')->default(false);
            $table->boolean('edit')->default(false);
            $table->boolean('delete')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_overrides');
    }
};