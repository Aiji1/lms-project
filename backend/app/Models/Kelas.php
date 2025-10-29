<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kelas extends Model
{
    protected $table = 'kelas';
    protected $primaryKey = 'id_kelas';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'ruangan',
        'nama_kelas',
        'tingkat',
        'id_jurusan',
        'id_tahun_ajaran',
        'kapasitas_maksimal',
        'wali_kelas'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'ruangan' => 'string',
        'nama_kelas' => 'string',
        'tingkat' => 'string',
        'id_jurusan' => 'integer',
        'id_tahun_ajaran' => 'integer',
        'kapasitas_maksimal' => 'integer'
    ];

    /**
     * Get the jadwal pelajaran for the kelas.
     */
    public function jadwalPelajaran(): HasMany
    {
        return $this->hasMany(JadwalPelajaran::class, 'id_kelas', 'id_kelas');
    }

    /**
     * Get the tahun ajaran that owns the kelas.
     */
    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Get the wali kelas (guru) that owns the kelas.
     */
    public function waliKelas(): BelongsTo
    {
        return $this->belongsTo(Guru::class, 'wali_kelas', 'nik_guru');
    }

    /**
     * Scope a query to filter by tingkat.
     */
    public function scopeByTingkat($query, $tingkat)
    {
        return $query->where('tingkat', $tingkat);
    }

    /**
     * Scope a query to filter by tahun ajaran.
     */
    public function scopeByTahunAjaran($query, $tahunAjaranId)
    {
        return $query->where('id_tahun_ajaran', $tahunAjaranId);
    }

    /**
     * Scope a query to filter by jurusan.
     */
    public function scopeByJurusan($query, $jurusanId)
    {
        return $query->where('id_jurusan', $jurusanId);
    }
}