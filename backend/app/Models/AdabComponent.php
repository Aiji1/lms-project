<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdabComponent extends Model
{
    protected $table = 'adab_components';
    protected $primaryKey = 'id_component';
    public $timestamps = false;

    protected $fillable = [
        'nama_component',
        'urutan',
        'status'
    ];

    protected $casts = [
        'id_component' => 'integer',
        'urutan' => 'integer',
        'status' => 'string'
    ];
}