<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('adab_questionnaire_responses', function (Blueprint $table) {
            $table->increments('id_response');
            $table->string('nis');
            $table->date('tanggal');
            $table->unsignedInteger('id_question');
            $table->string('jawaban'); // Ya/Tidak

            $table->index(['nis', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('adab_questionnaire_responses');
    }
};