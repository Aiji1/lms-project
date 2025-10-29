<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PengumpulanTugas extends Model
{
    protected $table = 'pengumpulan_tugas';
    protected $primaryKey = 'id_pengumpulan';
    public $timestamps = false;

    protected $fillable = [
        'id_tugas',
        'nis',
        'tanggal_submit',
        'file_jawaban',
        'keterangan_siswa',
        'status',
        'nilai',
        'feedback_guru'
    ];

    protected $casts = [
        'id_pengumpulan' => 'integer',
        'id_tugas' => 'integer',
        'tanggal_submit' => 'timestamp',
        'nilai' => 'integer',
        'keterangan_siswa' => 'string'
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
        return $query->where('status', $status);
    }

    public function scopeWithNilai($query)
    {
        return $query->whereNotNull('nilai');
    }

    public function scopeWithoutNilai($query)
    {
        return $query->whereNull('nilai');
    }
}