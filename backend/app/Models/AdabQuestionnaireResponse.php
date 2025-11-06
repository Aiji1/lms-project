<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdabQuestionnaireResponse extends Model
{
    protected $table = 'adab_questionnaire_responses';
    protected $primaryKey = 'id_response';
    public $timestamps = false;

    protected $fillable = [
        'nis',
        'tanggal',
        'id_component',
        'id_question',
        'jawaban',
    ];
}