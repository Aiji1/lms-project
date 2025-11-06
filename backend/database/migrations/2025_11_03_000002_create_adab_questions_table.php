<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('adab_questions', function (Blueprint $table) {
            $table->increments('id_question');
            $table->unsignedInteger('id_component');
            $table->string('teks_pertanyaan');
            $table->integer('urutan')->default(0);
            $table->string('status')->default('Aktif');

            $table->foreign('id_component')->references('id_component')->on('adab_components')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adab_questions');
    }
};