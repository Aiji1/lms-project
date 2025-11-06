<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdabQuestion extends Model
{
    protected $table = 'adab_questions';
    protected $primaryKey = 'id_question';
    public $timestamps = false;

    protected $fillable = [
        'id_component',
        'teks_pertanyaan',
        'urutan',
        'status'
    ];

    protected $casts = [
        'id_question' => 'integer',
        'id_component' => 'integer',
        'urutan' => 'integer',
        'status' => 'string'
    ];
}