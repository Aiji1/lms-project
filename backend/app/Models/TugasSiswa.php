<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TugasSiswa extends Model
{
    protected $table = 'tugas_siswa';
    protected $primaryKey = 'id_tugas_siswa';
    public $timestamps = false;

    protected $fillable = [
        'id_tugas',
        'nis',
        'status_pengumpulan'
    ];

    protected $casts = [
        'id_tugas_siswa' => 'integer',
        'id_tugas' => 'integer'
    ];

    // Relationships
    public function tugas()
    {
        return $this->belongsTo(Tugas::class, 'id_tugas', 'id_tugas');
    }

    /**
     * Get siswa data (using direct query since no Siswa model exists)
     */
    public function getSiswaData()
    {
        return DB::table('siswa')->where('nis', $this->nis)->first();
    }

    // Scopes
    public function scopeByTugas($query, $idTugas)
    {
        return $query->where('id_tugas', $idTugas);
    }

    public function scopeBySiswa($query, $nis)
    {
        return $query->where('nis', $nis);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status_pengumpulan', $status);
    }
}