<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengumumanRead extends Model
{
    protected $table = 'pengumuman_reads';
    public $timestamps = false;
    
    protected $fillable = [
        'id_pengumuman',
        'user_id',
        'user_identifier',
        'user_type',
        'dibaca_pada',
    ];

    protected $casts = [
        'dibaca_pada' => 'datetime',
    ];

    // Relasi ke tabel pengumuman
    public function pengumuman()
    {
        return $this->belongsTo(Pengumuman::class, 'id_pengumuman', 'id_pengumuman');
    }
}