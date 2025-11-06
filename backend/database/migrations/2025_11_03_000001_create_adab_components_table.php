<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('adab_components', function (Blueprint $table) {
            $table->increments('id_component');
            $table->string('nama_component');
            $table->integer('urutan')->default(0);
            $table->string('status')->default('Aktif');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adab_components');
    }
};