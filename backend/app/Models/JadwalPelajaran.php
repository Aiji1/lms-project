<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JadwalPelajaran extends Model
{
    protected $table = 'jadwal_pelajaran';
    protected $primaryKey = 'id_jadwal';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_tahun_ajaran',
        'id_mata_pelajaran',
        'nik_guru',
        'id_kelas',
        'hari',
        'jam_ke'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'id_tahun_ajaran' => 'integer',
        'id_mata_pelajaran' => 'integer',
        'id_kelas' => 'integer',
        'hari' => 'string',
        'jam_ke' => 'string'
    ];

    /**
     * Get the tahun ajaran that owns the jadwal pelajaran.
     */
    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Get the mata pelajaran that owns the jadwal pelajaran.
     */
    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    /**
     * Get the guru that owns the jadwal pelajaran.
     */
    public function guru(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'nik_guru', 'nik_guru');
    }

    /**
     * Get the kelas that owns the jadwal pelajaran.
     */
    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }
}